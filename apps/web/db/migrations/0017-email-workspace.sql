-- Email workspace (ADR-0023): outbound mail, drafts, follow-up state, full content.
-- Additive and replayable. Existing rows keep their meaning: every stored message is inbound,
-- no thread gets a follow-up date, no draft exists. Apply to evidence first.

-- Direction: Maxpromo's own replies live in the same conversation as the customer's mail.
ALTER TABLE mail.messages ADD COLUMN IF NOT EXISTS direction text NOT NULL DEFAULT 'inbound';
-- Full text from the provider's own API (GET …/messages/{uid}/text), bounded attempts.
ALTER TABLE mail.messages ADD COLUMN IF NOT EXISTS content_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE mail.messages ADD COLUMN IF NOT EXISTS content_checked_at timestamptz;
-- Follow-up: when Marcel wants to hear back, and the one next step he set himself.
ALTER TABLE mail.threads ADD COLUMN IF NOT EXISTS follow_up_on date;
ALTER TABLE mail.threads ADD COLUMN IF NOT EXISTS next_action text;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='mail_messages_direction') THEN
  ALTER TABLE mail.messages ADD CONSTRAINT mail_messages_direction CHECK(direction IN ('inbound','outbound'));
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='mail_threads_next_action_len') THEN
  ALTER TABLE mail.threads ADD CONSTRAINT mail_threads_next_action_len CHECK(next_action IS NULL OR char_length(next_action) <= 300);
 END IF;
END $$;
CREATE INDEX IF NOT EXISTS mail_threads_follow_up ON mail.threads(follow_up_on) WHERE follow_up_on IS NOT NULL AND archived=false AND trashed=false;
CREATE INDEX IF NOT EXISTS mail_messages_content_pending ON mail.messages(received_at) WHERE body_state='preview';

-- Drafts: what Marcel is writing. A draft is the only thing email.deliver can send, and only
-- at the revision he confirmed; editing it after confirmation makes the old approval useless.
CREATE TABLE IF NOT EXISTS mail.drafts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 account_id text NOT NULL REFERENCES mail.accounts,
 thread_id uuid REFERENCES mail.threads,
 mode text NOT NULL CHECK(mode IN ('new','reply','reply_all','forward')),
 source_message_id uuid REFERENCES mail.messages,
 to_addrs jsonb NOT NULL DEFAULT '[]', cc_addrs jsonb NOT NULL DEFAULT '[]', bcc_addrs jsonb NOT NULL DEFAULT '[]',
 subject text NOT NULL DEFAULT '' CHECK(char_length(subject) <= 300),
 body text NOT NULL DEFAULT '' CHECK(char_length(body) <= 20000),
 family text NOT NULL DEFAULT 'reply',
 language text NOT NULL DEFAULT 'de' CHECK(language IN ('de','en')),
 entity_kind text CHECK(entity_kind IS NULL OR entity_kind IN ('lead','client','project')),
 entity_id text,
 follow_up_days integer CHECK(follow_up_days IS NULL OR follow_up_days BETWEEN 0 AND 60),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','sending','sent','uncertain','discarded')),
 revision integer NOT NULL DEFAULT 1,
 created_by text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 sent_at timestamptz,
 sent_message_id uuid REFERENCES mail.messages
);
CREATE INDEX IF NOT EXISTS mail_drafts_open ON mail.drafts(thread_id, updated_at DESC) WHERE status='draft';

-- Full content from the provider can refine triage, never raise a quarantined thread.
CREATE OR REPLACE FUNCTION mail.store_content(p_message uuid,p_body text,p_class text,p_needs boolean)
RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE v_thread uuid;
BEGIN
 IF octet_length(p_body)>262144 THEN RAISE EXCEPTION 'mail_content_too_large'; END IF;
 UPDATE mail.messages SET body_text=p_body,body_state='complete',content_attempts=content_attempts+1,content_checked_at=now()
 WHERE id=p_message AND body_state='preview' RETURNING thread_id INTO v_thread;
 IF NOT FOUND THEN RETURN false; END IF;
 UPDATE mail.threads t SET needs_reply=t.needs_reply OR (p_needs AND t.quarantine IS NULL AND t.owner_verdict IS DISTINCT FROM 'spam'),
 classification=CASE WHEN t.classification='system' THEN t.classification WHEN p_class='system' THEN p_class
 WHEN t.classification='billing' THEN t.classification WHEN p_needs THEN p_class ELSE t.classification END
 WHERE t.id=v_thread;
 RETURN true;
END $$;

-- Same contract as 0016, plus two rules for conversations Maxpromo has written in:
--   * a reply that references Maxpromo's own message to this sender joins that conversation;
--   * a human reply to a conversation Maxpromo wrote in needs a reply and ends "waiting".
CREATE OR REPLACE FUNCTION mail.accept_hostinger(p_account text,p jsonb,p_sealed jsonb,p_expires timestamptz)
RETURNS TABLE(created boolean, message_id uuid, thread_id uuid) LANGUAGE plpgsql AS $$
DECLARE
 v_event text := p->>'eventId'; v_delivery text := p->>'deliveryId';
 v_message uuid; v_thread uuid; v_existing text; v_class text := p->>'classification';
 v_candidates uuid[]; v_rfc text := nullif(p->>'messageId',''); v_parent text := nullif(p->>'inReplyTo','');
 v_signals jsonb := coalesce(p->'riskSignals','[]'::jsonb); v_quarantine text; v_needs boolean := (p->>'needsReply')::boolean;
 v_answered boolean := false;
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
 IF EXISTS(SELECT 1 FROM mail.sender_blocks b WHERE b.account_id=p_account AND b.address=p->>'sender') THEN v_quarantine:='blocked_sender';
 ELSIF (p->>'suspect')::boolean IS TRUE AND NOT EXISTS(
   SELECT 1 FROM os_leads l WHERE lower(l.email)=p->>'sender' UNION ALL SELECT 1 FROM os_clients c WHERE lower(c.email)=p->>'sender')
 THEN v_quarantine:='suspected_phishing'; END IF;
 IF v_quarantine IS NOT NULL THEN
   INSERT INTO mail.threads(account_id,provider_thread_id,subject,classification,needs_reply,updated_at,quarantine,quarantined_at)
   VALUES(p_account,'hostinger:'||v_event,p->>'subject',v_class,false,(p->>'eventAt')::timestamptz,v_quarantine,now()) RETURNING id INTO v_thread;
 ELSE
   -- Headers are hints, not identity. Link only one uncontested referenced thread: a message
   -- from this same sender, or Maxpromo's own outbound message addressed to this sender.
   SELECT array_agg(DISTINCT m.thread_id) INTO v_candidates FROM mail.messages m JOIN mail.threads t ON t.id=m.thread_id
   WHERE m.account_id=p_account AND t.quarantine IS NULL
   AND (m.sender=p->>'sender' OR (m.direction='outbound' AND (m.recipients ? (p->>'sender') OR m.cc ? (p->>'sender'))))
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
 -- A person (not an automated mailbox) answering a conversation Maxpromo wrote in.
 v_answered := NOT (v_signals ? 'automated_sender') AND EXISTS(
   SELECT 1 FROM mail.messages m WHERE m.thread_id=v_thread AND m.direction='outbound');
 UPDATE mail.threads t SET updated_at=greatest(t.updated_at,(p->>'eventAt')::timestamptz),
 needs_reply=t.needs_reply OR v_needs OR v_answered OR (v_class<>'routine' AND EXISTS(SELECT 1 FROM mail.business_links b WHERE b.thread_id=v_thread AND b.entity_kind='client')),
 waiting=CASE WHEN v_answered THEN false ELSE t.waiting END,
 archived=CASE WHEN v_answered THEN false ELSE t.archived END,
 classification=CASE WHEN t.classification='system' THEN t.classification WHEN v_class='system' THEN v_class
 WHEN t.classification='billing' THEN t.classification WHEN v_needs THEN v_class ELSE t.classification END
 WHERE t.id=v_thread;
 RETURN QUERY SELECT true,v_message,v_thread;
END $$;
