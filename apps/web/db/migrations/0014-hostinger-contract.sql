-- Local preparation only. Apply to evidence first; production requires owner approval.
ALTER TABLE mail.messages ADD COLUMN IF NOT EXISTS rfc_message_id text;
ALTER TABLE mail.messages ADD COLUMN IF NOT EXISTS in_reply_to text;
ALTER TABLE mail.messages ADD COLUMN IF NOT EXISTS header_references jsonb NOT NULL DEFAULT '[]';
ALTER TABLE mail.messages ADD COLUMN IF NOT EXISTS event_at timestamptz;
ALTER TABLE mail.messages ADD COLUMN IF NOT EXISTS email_date timestamptz;
ALTER TABLE mail.messages ADD COLUMN IF NOT EXISTS body_state text NOT NULL DEFAULT 'complete';
ALTER TABLE mail.messages ADD COLUMN IF NOT EXISTS preview_text text NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS mail_rfc_lookup ON mail.messages(account_id,rfc_message_id);
CREATE TABLE IF NOT EXISTS mail.deliveries (
 account_id text NOT NULL REFERENCES mail.accounts, delivery_id text NOT NULL,
 provider_event_id text NOT NULL, message_id uuid REFERENCES mail.messages,
 event_at timestamptz NOT NULL, accepted_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(account_id,delivery_id)
);
-- Upgrade the early evidence prototype only; avoid a redundant ALTER lock on replay.
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='mail'
   AND table_name='deliveries' AND column_name='delivery_id' AND data_type<>'text') THEN
   ALTER TABLE mail.deliveries ALTER COLUMN delivery_id TYPE text USING delivery_id::text;
 END IF;
END $$;
CREATE TABLE IF NOT EXISTS mail.content_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), message_id uuid NOT NULL UNIQUE REFERENCES mail.messages,
 sealed_locator jsonb NOT NULL, expires_at timestamptz NOT NULL,
 state text NOT NULL DEFAULT 'blocked_policy', attempts integer NOT NULL DEFAULT 0,
 lease_until timestamptz, lease_token uuid, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS mail.content_assets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), message_id uuid NOT NULL REFERENCES mail.messages,
 attachment_key text NOT NULL, filename text NOT NULL, size_bytes bigint NOT NULL,
 content_type text NOT NULL DEFAULT 'application/octet-stream',
 state text NOT NULL DEFAULT 'pending', storage_ref text, sha256 text,
 UNIQUE(message_id,attachment_key)
);
CREATE INDEX IF NOT EXISTS mail_locator_expiry ON mail.content_jobs(expires_at) WHERE state<>'complete';

-- Serialize one mailbox's thread mapping and dedupe in the same database transaction.
-- No external tool/model/send/lead creation is reachable from this function.
CREATE OR REPLACE FUNCTION mail.accept_hostinger(p_account text,p jsonb,p_sealed jsonb,p_expires timestamptz)
RETURNS TABLE(created boolean, message_id uuid, thread_id uuid) LANGUAGE plpgsql AS $$
DECLARE
 v_event text := p->>'eventId'; v_delivery text := p->>'deliveryId';
 v_message uuid; v_thread uuid; v_existing text; v_class text := p->>'classification';
 v_candidates uuid[]; v_rfc text := nullif(p->>'messageId',''); v_parent text := nullif(p->>'inReplyTo','');
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_account,0));
 IF NOT EXISTS(SELECT 1 FROM mail.accounts a WHERE a.id=p_account AND a.enabled AND a.provider='hostinger' AND lower(a.address)=p->>'mailbox')
 THEN RAISE EXCEPTION 'mail_account_unavailable' USING ERRCODE='22023'; END IF;
 UPDATE mail.content_jobs j SET sealed_locator='{}',state='expired',lease_until=NULL
 WHERE j.expires_at<=now() AND j.state<>'complete' AND j.message_id IN (SELECT m.id FROM mail.messages m WHERE m.account_id=p_account);
 SELECT d.provider_event_id,d.message_id INTO v_existing,v_message FROM mail.deliveries d WHERE d.account_id=p_account AND d.delivery_id=v_delivery;
 IF FOUND THEN
   IF v_existing<>v_event THEN RAISE EXCEPTION 'mail_delivery_conflict' USING ERRCODE='22023'; END IF;
   RETURN QUERY SELECT false,v_message,m.thread_id FROM mail.messages m WHERE m.id=v_message; RETURN;
 END IF;
 SELECT m.id,m.thread_id INTO v_message,v_thread FROM mail.messages m WHERE m.account_id=p_account AND m.provider_message_id=v_event;
 IF FOUND THEN
   INSERT INTO mail.deliveries(account_id,delivery_id,provider_event_id,message_id,event_at) VALUES(p_account,v_delivery,v_event,v_message,(p->>'eventAt')::timestamptz);
   RETURN QUERY SELECT false,v_message,v_thread; RETURN;
 END IF;
 -- Headers are hints, not identity. Link only one uncontested referenced thread
 -- with the same stored external sender; never merge by subject/display name.
 SELECT array_agg(DISTINCT m.thread_id) INTO v_candidates FROM mail.messages m
 WHERE m.account_id=p_account AND m.sender=p->>'sender'
 AND (m.rfc_message_id=v_parent OR m.rfc_message_id IN (SELECT jsonb_array_elements_text(p->'references')));
 IF cardinality(v_candidates)=1 THEN v_thread:=v_candidates[1];
 ELSE
   INSERT INTO mail.threads(account_id,provider_thread_id,subject,classification,needs_reply,updated_at)
   VALUES(p_account,'hostinger:'||v_event,p->>'subject',v_class,(p->>'needsReply')::boolean,(p->>'eventAt')::timestamptz) RETURNING id INTO v_thread;
 END IF;
 INSERT INTO mail.messages(thread_id,account_id,provider_message_id,sender,recipients,cc,subject,body_text,received_at,attachments,
   rfc_message_id,in_reply_to,header_references,event_at,email_date,body_state,preview_text)
 VALUES(v_thread,p_account,v_event,p->>'sender',p->'recipients',p->'cc',p->>'subject','',(p->>'eventAt')::timestamptz,p->'attachments',
   v_rfc,v_parent,p->'references',(p->>'eventAt')::timestamptz,nullif(p->>'emailDate','')::timestamptz,'preview',p->>'previewText') RETURNING id INTO v_message;
 INSERT INTO mail.deliveries(account_id,delivery_id,provider_event_id,message_id,event_at) VALUES(p_account,v_delivery,v_event,v_message,(p->>'eventAt')::timestamptz);
 INSERT INTO mail.events(id,account_id,kind,thread_id) VALUES(jsonb_build_array('hostinger',p_account,v_event)::text,p_account,'received',v_thread);
 INSERT INTO mail.content_jobs(message_id,sealed_locator,expires_at,state) VALUES(v_message,CASE WHEN p_expires<=now() THEN '{}'::jsonb ELSE p_sealed END,p_expires,CASE WHEN p_expires<=now() THEN 'expired' ELSE 'blocked_policy' END);
 INSERT INTO mail.content_assets(message_id,attachment_key,filename,size_bytes)
 SELECT v_message,a->>'id',a->>'filename',(a->>'size')::bigint FROM jsonb_array_elements(p->'attachments') a;
 INSERT INTO mail.business_links(thread_id,entity_kind,entity_id,match_status)
 SELECT v_thread,'lead',l.id::text,'possible' FROM os_leads l WHERE lower(l.email)=p->>'sender'
 UNION ALL SELECT v_thread,'client',c.id::text,'possible' FROM os_clients c WHERE lower(c.email)=p->>'sender'
 ON CONFLICT DO NOTHING;
 UPDATE mail.threads t SET updated_at=greatest(t.updated_at,(p->>'eventAt')::timestamptz),
 needs_reply=t.needs_reply OR (p->>'needsReply')::boolean OR (v_class<>'routine' AND EXISTS(SELECT 1 FROM mail.business_links b WHERE b.thread_id=v_thread AND b.entity_kind='client')),
 classification=CASE WHEN t.classification='system' THEN t.classification WHEN v_class='system' THEN v_class
 WHEN t.classification='billing' THEN t.classification WHEN (p->>'needsReply')::boolean THEN v_class ELSE t.classification END
 WHERE t.id=v_thread;
 RETURN QUERY SELECT true,v_message,v_thread;
END $$;

CREATE OR REPLACE FUNCTION mail.complete_content(p_job uuid,p_lease uuid,p_body text,p_assets jsonb,p_class text,p_needs boolean)
RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE v_message uuid; v_thread uuid; v_asset jsonb;
BEGIN
 SELECT j.message_id INTO v_message FROM mail.content_jobs j WHERE j.id=p_job AND j.lease_token=p_lease AND j.state='processing' AND j.lease_until>now() FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 IF octet_length(p_body)>262144 THEN RAISE EXCEPTION 'mail_content_too_large'; END IF;
 FOR v_asset IN SELECT * FROM jsonb_array_elements(p_assets) LOOP
   UPDATE mail.content_assets SET state='retained',storage_ref=v_asset->>'storageRef',sha256=v_asset->>'sha256',content_type=v_asset->>'contentType'
   WHERE message_id=v_message AND attachment_key=v_asset->>'id' AND size_bytes=(v_asset->>'size')::bigint;
   IF NOT FOUND THEN RAISE EXCEPTION 'mail_asset_mismatch'; END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM mail.content_assets WHERE message_id=v_message AND state<>'retained') THEN RAISE EXCEPTION 'mail_asset_incomplete'; END IF;
 UPDATE mail.messages SET body_text=p_body,body_state='complete' WHERE id=v_message RETURNING thread_id INTO v_thread;
 UPDATE mail.threads t SET needs_reply=t.needs_reply OR p_needs,
 classification=CASE WHEN t.classification='system' THEN t.classification WHEN p_class='system' THEN p_class
 WHEN t.classification='billing' THEN t.classification WHEN p_needs THEN p_class ELSE t.classification END,
 updated_at=CASE WHEN (p_needs AND NOT t.needs_reply) OR (p_class='system' AND t.classification<>'system')
   OR (p_class='billing' AND t.classification NOT IN ('system','billing')) THEN now() ELSE t.updated_at END
 WHERE t.id=v_thread;
 UPDATE mail.content_jobs SET state='complete',sealed_locator='{}',lease_until=NULL WHERE id=p_job;
 RETURN true;
END $$;
