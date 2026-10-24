-- 0021 — Mail sent by the mailbox to itself is not new business (risk 135).
--
-- When Maxpromo sends to its own address (a test, a copy to self, a note from Marcel's phone mail app),
-- Hostinger delivers that message back into the inbox. Until now it became a NEW inbound conversation,
-- was linked to any client with that address and — through that link — raised "needs reply".
--
-- Identity, not address special-casing:
--   1. A delivered message whose Message-ID is one Maxpromo itself sent (mail.messages, direction
--      outbound, rfc_message_id) IS that message. The delivery is recorded against it; no new thread,
--      message, link or attention.
--   2. A message from the mailbox's own address that matches no recorded send yet (the Message-ID
--      readback is best effort and may come later, or it was written outside the OS) is kept, marked
--      `self_copy`, threaded only into a conversation it references, and never raises needs-reply,
--      never re-opens a conversation and is never linked to a lead or client. Unthreaded, it is filed
--      as an archived system conversation.
--   3. mail.merge_self_copy(account, outbound message) folds such a copy into the sent message once
--      its Message-ID is known (called after the readback).
-- Genuine replies are unchanged: their sender is not the mailbox.
-- Schema-only: no existing row is changed by this migration.

CREATE OR REPLACE FUNCTION mail.accept_hostinger(p_account text,p jsonb,p_sealed jsonb,p_expires timestamptz)
RETURNS TABLE(created boolean, message_id uuid, thread_id uuid) LANGUAGE plpgsql AS $$
DECLARE
 v_event text := p->>'eventId'; v_delivery text := p->>'deliveryId';
 v_message uuid; v_thread uuid; v_existing text; v_class text := p->>'classification';
 v_candidates uuid[]; v_rfc text := nullif(p->>'messageId',''); v_parent text := nullif(p->>'inReplyTo','');
 v_signals jsonb := coalesce(p->'riskSignals','[]'::jsonb); v_quarantine text; v_needs boolean := (p->>'needsReply')::boolean;
 v_answered boolean := false; v_self boolean := false; v_new boolean := false;
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
 -- (1) Our own sent message, delivered back: the same message, not a new one.
 IF v_rfc IS NOT NULL THEN
   SELECT m.id,m.thread_id INTO v_message,v_thread FROM mail.messages m
   WHERE m.account_id=p_account AND m.direction='outbound' AND m.rfc_message_id=v_rfc LIMIT 1;
   IF FOUND THEN
     INSERT INTO mail.deliveries(account_id,delivery_id,provider_event_id,message_id,event_at) VALUES(p_account,v_delivery,v_event,v_message,(p->>'eventAt')::timestamptz);
     RETURN QUERY SELECT false,v_message,v_thread; RETURN;
   END IF;
 END IF;
 -- (2) From the mailbox's own address, not (yet) matched to a recorded send.
 v_self := EXISTS(SELECT 1 FROM mail.accounts a WHERE a.id=p_account AND lower(a.address)=lower(p->>'sender'));
 IF v_self THEN v_needs := false; v_class := 'system'; v_signals := v_signals || '["self_copy"]'::jsonb; END IF;
 IF NOT v_self AND EXISTS(SELECT 1 FROM mail.sender_blocks b WHERE b.account_id=p_account AND b.address=p->>'sender') THEN v_quarantine:='blocked_sender';
 ELSIF NOT v_self AND (p->>'suspect')::boolean IS TRUE AND NOT EXISTS(
   SELECT 1 FROM os_leads l WHERE lower(l.email)=p->>'sender' UNION ALL SELECT 1 FROM os_clients c WHERE lower(c.email)=p->>'sender')
 THEN v_quarantine:='suspected_phishing'; END IF;
 IF v_quarantine IS NOT NULL THEN
   INSERT INTO mail.threads(account_id,provider_thread_id,subject,classification,needs_reply,updated_at,quarantine,quarantined_at)
   VALUES(p_account,'hostinger:'||v_event,p->>'subject',v_class,false,(p->>'eventAt')::timestamptz,v_quarantine,now()) RETURNING id INTO v_thread;
 ELSE
   -- Headers are hints, not identity. Link only one uncontested referenced thread: a message
   -- from this same sender, or Maxpromo's own outbound message addressed to this sender.
   -- A self copy may join only a conversation Maxpromo itself wrote in.
   SELECT array_agg(DISTINCT m.thread_id) INTO v_candidates FROM mail.messages m JOIN mail.threads t ON t.id=m.thread_id
   WHERE m.account_id=p_account AND t.quarantine IS NULL
   AND (CASE WHEN v_self THEN m.direction='outbound'
        ELSE (m.sender=p->>'sender' OR (m.direction='outbound' AND (m.recipients ? (p->>'sender') OR m.cc ? (p->>'sender')))) END)
   AND (m.rfc_message_id=v_parent OR m.rfc_message_id IN (SELECT jsonb_array_elements_text(p->'references')));
   IF cardinality(v_candidates)=1 THEN v_thread:=v_candidates[1];
   ELSE
     INSERT INTO mail.threads(account_id,provider_thread_id,subject,classification,needs_reply,updated_at)
     VALUES(p_account,'hostinger:'||v_event,p->>'subject',v_class,v_needs,(p->>'eventAt')::timestamptz) RETURNING id INTO v_thread;
     v_new := true;
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
 IF v_self THEN
   -- Kept and readable, never business attention: no links, no needs-reply, nothing re-opened.
   UPDATE mail.threads t SET updated_at=greatest(t.updated_at,(p->>'eventAt')::timestamptz),
     archived=CASE WHEN v_new THEN true ELSE t.archived END
   WHERE t.id=v_thread;
   RETURN QUERY SELECT true,v_message,v_thread; RETURN;
 END IF;
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

-- (3) Once a sent message's Message-ID is known, a self copy that arrived first is folded into it:
-- its deliveries point at the sent message, the copy goes, and a conversation left empty goes too.
CREATE OR REPLACE FUNCTION mail.merge_self_copy(p_account text, p_outbound uuid)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE v_rfc text; v_n integer := 0; r record;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_account,0));
 SELECT m.rfc_message_id INTO v_rfc FROM mail.messages m WHERE m.id=p_outbound AND m.account_id=p_account AND m.direction='outbound';
 IF v_rfc IS NULL THEN RETURN 0; END IF;
 FOR r IN SELECT m.id, m.thread_id FROM mail.messages m
   WHERE m.account_id=p_account AND m.direction='inbound' AND m.rfc_message_id=v_rfc AND m.risk_signals ? 'self_copy'
     AND NOT EXISTS(SELECT 1 FROM mail.drafts d WHERE d.source_message_id=m.id)
 LOOP
   UPDATE mail.deliveries SET message_id=p_outbound WHERE message_id=r.id;
   DELETE FROM mail.content_assets WHERE message_id=r.id;
   DELETE FROM mail.content_jobs WHERE message_id=r.id;
   UPDATE mail.messages SET delivery_report=NULL WHERE delivery_report=r.id;
   DELETE FROM mail.messages WHERE id=r.id;
   IF NOT EXISTS(SELECT 1 FROM mail.messages m WHERE m.thread_id=r.thread_id)
      AND NOT EXISTS(SELECT 1 FROM mail.drafts d WHERE d.thread_id=r.thread_id) THEN
     DELETE FROM mail.business_links WHERE thread_id=r.thread_id;
     DELETE FROM mail.action_audit WHERE thread_id=r.thread_id;
     UPDATE mail.events SET thread_id=NULL WHERE thread_id=r.thread_id;
     DELETE FROM mail.threads WHERE id=r.thread_id;
   END IF;
   v_n := v_n + 1;
 END LOOP;
 RETURN v_n;
END $$;
