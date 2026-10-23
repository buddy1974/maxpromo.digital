-- Provider spam state and quarantine (ADR-0022). Additive schema and functions only; replayable;
-- the previous application code keeps working against it. No existing row is changed.
-- Hostinger's message.received webhook carries no folder or spam field (observed: 14 data
-- fields, 0 unknown keys) and fires for mail it files into Junk. Provider state therefore comes
-- from the REST folder API (read-only metadata) and is recorded here per message.
ALTER TABLE mail.messages ADD COLUMN IF NOT EXISTS provider_state text NOT NULL DEFAULT 'unverified';
ALTER TABLE mail.messages ADD COLUMN IF NOT EXISTS provider_folder text;
ALTER TABLE mail.messages ADD COLUMN IF NOT EXISTS provider_uid bigint;
ALTER TABLE mail.messages ADD COLUMN IF NOT EXISTS provider_checks integer NOT NULL DEFAULT 0;
ALTER TABLE mail.messages ADD COLUMN IF NOT EXISTS provider_checked_at timestamptz;
ALTER TABLE mail.messages ADD COLUMN IF NOT EXISTS risk_signals jsonb NOT NULL DEFAULT '[]';
-- A quarantined thread is outside every attention, business and agent surface.
-- owner_verdict is Marcel's decision; automatic signals never override it.
ALTER TABLE mail.threads ADD COLUMN IF NOT EXISTS quarantine text;
ALTER TABLE mail.threads ADD COLUMN IF NOT EXISTS quarantined_at timestamptz;
ALTER TABLE mail.threads ADD COLUMN IF NOT EXISTS owner_verdict text;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='mail_messages_provider_state') THEN
  ALTER TABLE mail.messages ADD CONSTRAINT mail_messages_provider_state
   CHECK(provider_state IN ('unverified','inbox','junk','trash','other','not_found'));
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='mail_threads_quarantine') THEN
  ALTER TABLE mail.threads ADD CONSTRAINT mail_threads_quarantine
   CHECK(quarantine IS NULL OR quarantine IN ('provider_junk','suspected_phishing','owner_spam','blocked_sender'));
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='mail_threads_owner_verdict') THEN
  ALTER TABLE mail.threads ADD CONSTRAINT mail_threads_owner_verdict
   CHECK(owner_verdict IS NULL OR owner_verdict IN ('spam','not_spam'));
 END IF;
END $$;
CREATE INDEX IF NOT EXISTS mail_provider_unverified ON mail.messages(received_at) WHERE provider_state='unverified';
CREATE TABLE IF NOT EXISTS mail.sender_blocks (
 account_id text NOT NULL REFERENCES mail.accounts, address text NOT NULL,
 created_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(account_id,address)
);

-- Same contract as 0014 plus quarantine. Payloads without the new keys (old code) behave as before.
CREATE OR REPLACE FUNCTION mail.accept_hostinger(p_account text,p jsonb,p_sealed jsonb,p_expires timestamptz)
RETURNS TABLE(created boolean, message_id uuid, thread_id uuid) LANGUAGE plpgsql AS $$
DECLARE
 v_event text := p->>'eventId'; v_delivery text := p->>'deliveryId';
 v_message uuid; v_thread uuid; v_existing text; v_class text := p->>'classification';
 v_candidates uuid[]; v_rfc text := nullif(p->>'messageId',''); v_parent text := nullif(p->>'inReplyTo','');
 v_signals jsonb := coalesce(p->'riskSignals','[]'::jsonb); v_quarantine text; v_needs boolean := (p->>'needsReply')::boolean;
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
 -- Owner block first; then a structural phishing signal from a sender with no CRM relationship.
 IF EXISTS(SELECT 1 FROM mail.sender_blocks b WHERE b.account_id=p_account AND b.address=p->>'sender') THEN v_quarantine:='blocked_sender';
 ELSIF (p->>'suspect')::boolean IS TRUE AND NOT EXISTS(
   SELECT 1 FROM os_leads l WHERE lower(l.email)=p->>'sender' UNION ALL SELECT 1 FROM os_clients c WHERE lower(c.email)=p->>'sender')
 THEN v_quarantine:='suspected_phishing'; END IF;
 IF v_quarantine IS NOT NULL THEN
   -- Quarantined mail never joins, raises or links an existing conversation.
   INSERT INTO mail.threads(account_id,provider_thread_id,subject,classification,needs_reply,updated_at,quarantine,quarantined_at)
   VALUES(p_account,'hostinger:'||v_event,p->>'subject',v_class,false,(p->>'eventAt')::timestamptz,v_quarantine,now()) RETURNING id INTO v_thread;
 ELSE
   -- Headers are hints, not identity. Link only one uncontested referenced thread
   -- with the same stored external sender; never merge by subject/display name.
   SELECT array_agg(DISTINCT m.thread_id) INTO v_candidates FROM mail.messages m JOIN mail.threads t ON t.id=m.thread_id
   WHERE m.account_id=p_account AND m.sender=p->>'sender' AND t.quarantine IS NULL
   AND (m.rfc_message_id=v_parent OR m.rfc_message_id IN (SELECT jsonb_array_elements_text(p->'references')));
   IF cardinality(v_candidates)=1 THEN v_thread:=v_candidates[1];
   ELSE
     INSERT INTO mail.threads(account_id,provider_thread_id,subject,classification,needs_reply,updated_at)
     VALUES(p_account,'hostinger:'||v_event,p->>'subject',v_class,v_needs,(p->>'eventAt')::timestamptz) RETURNING id INTO v_thread;
   END IF;
 END IF;
 INSERT INTO mail.messages(thread_id,account_id,provider_message_id,sender,recipients,cc,subject,body_text,received_at,attachments,
   rfc_message_id,in_reply_to,header_references,event_at,email_date,body_state,preview_text,risk_signals)
 VALUES(v_thread,p_account,v_event,p->>'sender',p->'recipients',p->'cc',p->>'subject','',(p->>'eventAt')::timestamptz,p->'attachments',
   v_rfc,v_parent,p->'references',(p->>'eventAt')::timestamptz,nullif(p->>'emailDate','')::timestamptz,'preview',p->>'previewText',v_signals) RETURNING id INTO v_message;
 INSERT INTO mail.deliveries(account_id,delivery_id,provider_event_id,message_id,event_at) VALUES(p_account,v_delivery,v_event,v_message,(p->>'eventAt')::timestamptz);
 INSERT INTO mail.events(id,account_id,kind,thread_id) VALUES(jsonb_build_array('hostinger',p_account,v_event)::text,p_account,'received',v_thread);
 INSERT INTO mail.content_jobs(message_id,sealed_locator,expires_at,state) VALUES(v_message,CASE WHEN p_expires<=now() THEN '{}'::jsonb ELSE p_sealed END,p_expires,CASE WHEN p_expires<=now() THEN 'expired' ELSE 'blocked_policy' END);
 INSERT INTO mail.content_assets(message_id,attachment_key,filename,size_bytes)
 SELECT v_message,a->>'id',a->>'filename',(a->>'size')::bigint FROM jsonb_array_elements(p->'attachments') a;
 IF v_quarantine IS NOT NULL THEN RETURN QUERY SELECT true,v_message,v_thread; RETURN; END IF;
 INSERT INTO mail.business_links(thread_id,entity_kind,entity_id,match_status)
 SELECT v_thread,'lead',l.id::text,'possible' FROM os_leads l WHERE lower(l.email)=p->>'sender'
 UNION ALL SELECT v_thread,'client',c.id::text,'possible' FROM os_clients c WHERE lower(c.email)=p->>'sender'
 ON CONFLICT DO NOTHING;
 UPDATE mail.threads t SET updated_at=greatest(t.updated_at,(p->>'eventAt')::timestamptz),
 needs_reply=t.needs_reply OR v_needs OR (v_class<>'routine' AND EXISTS(SELECT 1 FROM mail.business_links b WHERE b.thread_id=v_thread AND b.entity_kind='client')),
 classification=CASE WHEN t.classification='system' THEN t.classification WHEN v_class='system' THEN v_class
 WHEN t.classification='billing' THEN t.classification WHEN v_needs THEN v_class ELSE t.classification END
 WHERE t.id=v_thread;
 RETURN QUERY SELECT true,v_message,v_thread;
END $$;

-- Full content can refine triage, never raise a quarantined thread's attention.
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
 UPDATE mail.threads t SET needs_reply=t.needs_reply OR (p_needs AND t.quarantine IS NULL),
 classification=CASE WHEN t.classification='system' THEN t.classification WHEN p_class='system' THEN p_class
 WHEN t.classification='billing' THEN t.classification WHEN p_needs THEN p_class ELSE t.classification END,
 updated_at=CASE WHEN t.quarantine IS NOT NULL THEN t.updated_at WHEN (p_needs AND NOT t.needs_reply) OR (p_class='system' AND t.classification<>'system')
   OR (p_class='billing' AND t.classification NOT IN ('system','billing')) THEN now() ELSE t.updated_at END
 WHERE t.id=v_thread;
 UPDATE mail.content_jobs SET state='complete',sealed_locator='{}',lease_until=NULL WHERE id=p_job;
 RETURN true;
END $$;

-- The provider's folder for one message, from the REST API. Junk quarantines its thread
-- unless Marcel said "not spam"; the provider moving it back out lifts only its own quarantine.
CREATE OR REPLACE FUNCTION mail.apply_provider_state(p_message uuid,p_state text,p_folder text,p_uid bigint)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE v_thread uuid; v_result text;
BEGIN
 UPDATE mail.messages SET provider_state=p_state,provider_folder=p_folder,provider_uid=p_uid,
   provider_checks=provider_checks+1,provider_checked_at=now()
 WHERE id=p_message RETURNING thread_id INTO v_thread;
 IF NOT FOUND THEN RETURN 'missing'; END IF;
 IF p_state='junk' THEN
   UPDATE mail.threads SET quarantine='provider_junk',quarantined_at=now(),needs_reply=false,waiting=false
   WHERE id=v_thread AND quarantine IS NULL AND owner_verdict IS DISTINCT FROM 'not_spam' RETURNING 'quarantined' INTO v_result;
 ELSIF p_state='inbox' THEN
   UPDATE mail.threads SET quarantine=NULL,quarantined_at=NULL
   WHERE id=v_thread AND quarantine='provider_junk'
   AND NOT EXISTS(SELECT 1 FROM mail.messages m WHERE m.thread_id=v_thread AND m.provider_state='junk') RETURNING 'released' INTO v_result;
 END IF;
 RETURN coalesce(v_result,'recorded');
END $$;
