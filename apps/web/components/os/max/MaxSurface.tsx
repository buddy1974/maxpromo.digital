'use client'
/**
 * The Universal Max surface (ADR-0029): the conversation and the one composer — type, paste,
 * dictate, attach a file, take a photo. Loaded only when Max is opened (the Max tab, the desktop
 * slide-over), with its own stylesheet, so no other screen carries it.
 *
 * Questions are answered from the records (Ask Max). Actions come back as proposal cards; several
 * actions are several cards, confirmed together or one by one. Nothing runs without Marcel.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Icon } from '@maxpromo/ui'
import { useOsLocale } from '@/lib/os-i18n/context'
import { MAX_SCREEN_COPY } from '@/lib/os-i18n/max'
import { shrinkImage } from '@/components/os/shared/shrinkImage'
import { useMax, type InteractionView, type ProposalView } from './MaxProvider'
import { ProposalCard } from './ProposalCard'
import { useVoice } from './useVoice'
import './max.css'

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.gif,.txt,.csv,application/pdf,image/*,text/plain'
const MAX_BYTES = 4 * 1024 * 1024

export default function MaxSurface({ onNavigate, autoFocus = false }: { onNavigate?: () => void; autoFocus?: boolean }) {
  const { t, locale } = useOsLocale()
  const c = MAX_SCREEN_COPY[locale]
  const max = useMax()
  const { entries, loading, send, decide, envelope, clearEnvelope, loadHistory, scanRequested, consumeScan, voice: voiceMode } = max
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [fromVoice, setFromVoice] = useState(false)
  const [scan, setScan] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  const field = useRef<HTMLTextAreaElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const cameraInput = useRef<HTMLInputElement>(null)
  const voice = useVoice({
    server: voiceMode === 'server', locale,
    onTranscript: tx => { setText(prev => (prev.trim() ? `${prev.trim()} ${tx}` : tx)); setFromVoice(true); field.current?.focus() },
  })

  useEffect(() => { loadHistory() }, [loadHistory])
  /* Follow the conversation when a message arrives — not when a card changes, so Marcel keeps his place. */
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [entries.length, loading])
  useEffect(() => { if (autoFocus) field.current?.focus() }, [autoFocus])
  /* Quick Scan opens Max in capture mode; the picker itself needs Marcel's tap (phones require it). */
  if (scanRequested && !scan) { setScan(true); consumeScan() }

  async function pick(f: File | undefined | null) {
    setFileError(null)
    if (!f) return
    const shrunk = await shrinkImage(f)
    if (shrunk.size > MAX_BYTES) { setFileError(c.fileTooLarge); return }
    setFile(shrunk)
    setScan(false)
    field.current?.focus()
  }

  function submit() {
    if (loading || (!text.trim() && !file)) return
    void send({ text, file, inputKind: file && !text.trim() ? 'file' : fromVoice ? 'voice' : 'text' })
    setText(''); setFile(null); setFromVoice(false)
  }

  const prompts = [t.ai.prompt6, t.ai.prompt5, t.ai.prompt2]

  return (
    <div className="max-surface">
      <div className="max-log" aria-live="polite" aria-busy={loading}>
        {entries.length === 0 && !scan && (
          <div className="max-start">
            <p className="max-label">{c.shortcutsLabel}</p>
            <div className="max-chips">
              {c.shortcuts.map(s => (
                <button key={s.label} type="button" className="max-chip" onClick={() => { if (s.scan) setScan(true); else { setText(s.text); field.current?.focus() } }}>{s.label}</button>
              ))}
            </div>
            <p className="max-label">{c.questionsLabel}</p>
            <div className="max-prompts">
              {prompts.map(p => <button key={p} type="button" className="max-prompt" onClick={() => void send({ text: p })}>{p}</button>)}
            </div>
          </div>
        )}
        {entries.map(e => <Entry key={e.id} e={e} decide={decide} onNavigate={onNavigate} />)}
        {scan && (
          <div className="max-scan">
            <p className="max-scan-title">{c.scanTitle}</p>
            <p className="max-scan-hint">{c.scanHint}</p>
            <div className="max-actions">
              <button type="button" className="btn-primary" onClick={() => cameraInput.current?.click()}><Icon name="camera" size="sm" /> {c.scanCamera}</button>
              <button type="button" className="btn-secondary" onClick={() => fileInput.current?.click()}><Icon name="attach" size="sm" /> {c.scanChoose}</button>
              <button type="button" className="btn-ghost" onClick={() => setScan(false)}>{c.scanCancel}</button>
            </div>
          </div>
        )}
        <div ref={end} />
      </div>

      <form className="max-compose" onSubmit={e => { e.preventDefault(); submit() }}>
        {(envelope?.label || file || fileError || voice.problem || voice.state !== 'idle' || fromVoice) && (
          <div className="max-compose-meta">
            {envelope?.label && (
              <span className="max-context-chip">
                <span>{c.context}: <strong>{envelope.label}</strong></span>
                <button type="button" onClick={clearEnvelope} aria-label={c.contextRemove}><Icon name="close" size="xs" /></button>
              </span>
            )}
            {file && (
              <span className="max-context-chip max-file-chip">
                <Icon name="attach" size="xs" /><span>{file.name} · {Math.max(1, Math.round(file.size / 1024))} KB</span>
                <button type="button" onClick={() => setFile(null)} aria-label={c.removeFile}><Icon name="close" size="xs" /></button>
              </span>
            )}
            {fileError && <span className="max-compose-note max-compose-error" role="alert">{fileError}</span>}
            {voice.state === 'listening' && <span className="max-compose-note max-listening" role="status">{voice.interim || c.voiceListening}</span>}
            {voice.state === 'transcribing' && <span className="max-compose-note" role="status">{c.voiceTranscribing}</span>}
            {voice.problem && <span className="max-compose-note max-compose-error" role="alert">{{ denied: c.voiceDenied, failed: c.voiceFailed, empty: c.voiceEmpty, unavailable: c.voiceUnavailable }[voice.problem]}</span>}
            {fromVoice && voice.state === 'idle' && <span className="max-compose-note">{c.voiceReview}{voice.used === 'browser' ? ` · ${c.voiceBrowserNote}` : ''}</span>}
          </div>
        )}
        <div className="max-compose-row">
          <label className="visually-hidden" htmlFor="max-input">{c.placeholder}</label>
          <textarea id="max-input" ref={field} value={text} rows={1} maxLength={4000} enterKeyHint="send"
            placeholder={file ? c.placeholderFile : c.placeholder} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !window.matchMedia('(pointer: coarse)').matches) { e.preventDefault(); submit() } }} />
        </div>
        <div className="max-compose-tools">
          <button type="button" className="max-tool" onClick={() => fileInput.current?.click()} aria-label={c.attach} title={c.attach}><Icon name="attach" size="md" /></button>
          <button type="button" className="max-tool" onClick={() => cameraInput.current?.click()} aria-label={c.photo} title={c.photo}><Icon name="camera" size="md" /></button>
          <button type="button" className={`max-tool${voice.state === 'listening' ? ' max-tool-live' : ''}`} disabled={voice.state === 'transcribing'}
            onClick={() => (voice.state === 'listening' ? voice.stop() : void voice.start())} aria-pressed={voice.state === 'listening'}
            aria-label={voice.state === 'listening' ? c.voiceStop : c.voice} title={voice.state === 'listening' ? c.voiceStop : c.voice}>
            <Icon name={voice.state === 'listening' ? 'stop' : 'mic'} size="md" />
          </button>
          <span className="max-tools-gap" />
          <button type="submit" className="max-send" disabled={loading || (!text.trim() && !file)} aria-label={c.send}><Icon name="send" size="md" /><span>{c.send}</span></button>
        </div>
        <input ref={fileInput} type="file" accept={ACCEPT} hidden onChange={e => { void pick(e.target.files?.[0]); e.target.value = '' }} />
        <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={e => { void pick(e.target.files?.[0]); e.target.value = '' }} />
      </form>
    </div>
  )
}

function Entry({ e, decide, onNavigate }: { e: InteractionView; decide: ReturnType<typeof useMax>['decide']; onNavigate?: () => void }) {
  const { locale } = useOsLocale()
  const c = MAX_SCREEN_COPY[locale]
  const ctx = e.context as { client?: { label: string }; thread?: { subject: string }; invoice?: { number: string }; angebot?: { number: string }; selected?: number }
  const ctxLabel = ctx.client?.label ?? ctx.thread?.subject ?? ctx.invoice?.number ?? ctx.angebot?.number ?? (ctx.selected ? c.selectedThreads(ctx.selected) : null)
  return (
    <>
      {(e.input || e.file) && (
        <div className="max-msg max-msg-user">
          {e.input && <p className="max-text">{e.input}</p>}
          {e.file && <p className="max-msg-file"><Icon name="attach" size="xs" /> {e.file.name}</p>}
          {ctxLabel && <p className="max-msg-ctx">{c.context}: {ctxLabel}</p>}
        </div>
      )}
      {e.pending && <div className="max-msg max-msg-max"><p className="max-thinking">{c.thinking}</p></div>}
      {e.failed && <div className="max-msg max-msg-max max-msg-failed"><p className="max-text">{e.failed === 'unavailable' ? c.errorReply : e.failed}</p></div>}
      {!e.pending && !e.failed && (Boolean(e.reply.text) || (e.reply.notes?.length ?? 0) > 0) && (
        <div className={`max-msg max-msg-max${e.outcome === 'failed' || e.outcome === 'refused' ? ' max-msg-failed' : ''}`}>
          {e.reply.text && <p className="max-text">{e.reply.text}</p>}
          {e.reply.links && e.reply.links.length > 0 && (
            <ul className="max-answer-links">{e.reply.links.map(l => <li key={l.href}><Link href={l.href} onClick={onNavigate}>{l.label}</Link></li>)}</ul>
          )}
          {e.reply.phrased && e.reply.facts && e.reply.facts.length > 0 && (
            <details className="max-facts"><summary>{c.facts}</summary><ul>{e.reply.facts.map((f, i) => <li key={i}>{f}</li>)}</ul></details>
          )}
          {!e.reply.phrased && e.reply.facts && e.reply.facts.length > 1 && <ul className="max-factlist">{e.reply.facts.slice(1).map((f, i) => <li key={i}>{f}</li>)}</ul>}
          {e.reply.notes && e.reply.notes.length > 0 && <ul className="max-notes">{e.reply.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
        </div>
      )}
      {e.proposals.length > 0 && <Proposals list={e.proposals} decide={decide} />}
    </>
  )
}

function Proposals({ list, decide }: { list: ProposalView[]; decide: ReturnType<typeof useMax>['decide'] }) {
  const { locale } = useOsLocale()
  const c = MAX_SCREEN_COPY[locale]
  const ready = list.filter(p => p.status === 'proposed' && p.grounded.state === 'ready')
  const [picked, setPicked] = useState<Set<string>>(() => new Set(ready.map(p => p.id)))
  const [running, setRunning] = useState(false)
  const multi = list.length > 1
  const settled = list.filter(p => ['done', 'failed', 'refused', 'rejected', 'expired', 'awaiting_approval'].includes(p.status))
  const done = list.filter(p => p.status === 'done').length
  const selected = ready.filter(p => picked.has(p.id))
  const summary = useMemo(() => {
    if (!multi || settled.length === 0) return null
    if (done === list.length) return c.allDone(list.length)
    return c.partial(done, list.length)
  }, [multi, settled.length, done, list.length, c])

  /* Each confirmation is its own request through its own capability: one failing never stops,
     undoes or hides another. */
  async function confirmMany(items: ProposalView[]) {
    setRunning(true)
    for (const p of items) await decide(p.id, { action: 'confirm', payload_hash: p.payloadHash })
    setRunning(false)
  }

  return (
    <div className={`max-proposals${multi ? ' max-proposals-multi' : ''}`}>
      {multi && <p className="max-label">{c.understood} · {c.proposals(list.length)}</p>}
      {list.map(p => (
        <ProposalCard key={p.id} p={p} decide={decide} selectable={multi && ready.length > 1} selected={picked.has(p.id)}
          onSelect={v => setPicked(s => { const n = new Set(s); if (v) n.add(p.id); else n.delete(p.id); return n })} />
      ))}
      {multi && ready.length > 1 && (
        <div className="max-multibar">
          <button type="button" className="btn-primary" disabled={running} onClick={() => void confirmMany(ready)}>{c.confirmAll(ready.length)}</button>
          {selected.length > 0 && selected.length < ready.length && <button type="button" className="btn-secondary" disabled={running} onClick={() => void confirmMany(selected)}>{c.confirmSelected(selected.length)}</button>}
        </div>
      )}
      {summary && <p className={`max-summary${done === list.length ? ' max-summary-ok' : ''}`} role="status">{summary}</p>}
    </div>
  )
}
