'use client'
/**
 * /os/leads/calibration — the Research Agent field calibration: what the agent said about real
 * prospects next to Marcel's judgement, and the counts over them. Patterns appear only from enough
 * judged runs. Reads only; judgements are recorded on the lead screen.
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useOsLocale } from '@/lib/os-i18n/context'
import { LEADS_COPY } from '@/lib/os-i18n/leads'
import { CALIBRATION_COPY, JUDGEMENT_COPY } from '@/lib/os-i18n/calibration'
import type { CalibrationRun, CalibrationSummary } from '@/lib/agents/calibration'

type Data = CalibrationSummary & { minimum: number }

export default function CalibrationPage() {
  const { locale, fmtDate } = useOsLocale()
  const c = LEADS_COPY[locale]
  const k = { ...JUDGEMENT_COPY[locale], ...CALIBRATION_COPY[locale] }
  const [data, setData] = useState<Data | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    fetch('/api/os/leads/calibration', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => setData(d as Data))
      .catch(() => setFailed(true))
  }, [])

  if (failed) return <div className="os-page money-page"><p className="money-alert">{c.failed}</p></div>
  if (!data) return <div className="os-page money-page"><p role="status" className="money-quiet">…</p></div>

  const pct = (n: number) => (data.reviewed ? `${Math.round((n / data.reviewed) * 100)} %` : '—')
  const secs = (ms: number | null) => (ms === null ? '—' : k.seconds(Math.round(ms / 1000)))
  const counts = (o: Record<string, number>, label: (x: string) => string) => Object.entries(o).filter(([, n]) => n > 0).map(([x, n]) => `${label(x)} ${n}`).join(' · ') || '—'

  return (
    <div className="os-page money-page lead-page">
      <Link href="/os/leads" className="money-more lead-back">‹ {c.back}</Link>
      <section className="money-hero" aria-label={k.title}>
        <h1 className="lead-title">{k.title}</h1>
        <p className="money-sub">{k.intro}</p>
      </section>

      <section className="money-card" aria-label={k.agreement}>
        <dl className="calib-stats">
          <div><dt>{k.researched}</dt><dd>{data.researched}</dd></div>
          <div><dt>{k.reviewed}</dt><dd>{data.reviewed}</dd></div>
          <div><dt>{k.agreement}</dt><dd>{pct(data.agreement.agree)}</dd></div>
          <div><dt>{k.duration}</dt><dd>{secs(data.averageDurationMs)}</dd></div>
          <div><dt>{k.partial}</dt><dd>{data.partial}</dd></div>
          <div><dt>{k.failed}</dt><dd>{data.failed}</dd></div>
        </dl>
        <p className="money-rail">{k.reviewed}: {counts(data.agreement, x => k.verdict[x] ?? x)}</p>
        <p className="money-rail">{k.verdicts}: {counts(data.verdicts, x => c.verdict[x as keyof typeof c.verdict] ?? x)}</p>
        <p className="money-rail">{k.confidence}: {counts(data.confidence, x => c.confidence[x as keyof typeof c.confidence] ?? x)}</p>
        <p className="money-rail">{k.issues}: {counts(data.issues, x => k.issue[x] ?? x)}</p>
      </section>

      <section className="money-card" aria-label={k.patterns}>
        <h2 className="money-label">{k.patterns}</h2>
        {!data.patterns ? <p className="money-quiet">{k.tooFew(data.reviewed, data.minimum)}</p> : (
          <ul className="money-list">
            {data.patterns.map(g => (
              <li key={`${g.by}:${g.key}`} className="money-row">
                <span>{k.patternBy[g.by]}: {g.by === 'verdict' ? c.verdict[g.key as keyof typeof c.verdict] ?? g.key : g.by === 'confidence' ? c.confidence[g.key as keyof typeof c.confidence] ?? g.key : g.by === 'reading' ? k.reading[g.key] : g.key}</span>
                <span className="money-amount">{g.agree}/{g.partly}/{g.disagree}</span>
              </li>
            ))}
          </ul>
        )}
        {data.notes.length > 0 && (
          <>
            <h3 className="money-label">{k.notes}</h3>
            <ul className="money-list">
              {data.notes.map((n, i) => <li key={i}><strong>{k.issue[n.issue]}</strong> · {n.business}: „{n.note}“</li>)}
            </ul>
          </>
        )}
      </section>

      <section className="money-card" aria-label={k.runs}>
        <h2 className="money-label">{k.runs}</h2>
        {data.runs.length === 0 ? <p className="money-quiet">{k.none}</p> : data.runs.map(r => <Run key={r.workId} r={r} c={c} k={k} fmtDate={fmtDate} secs={secs} />)}
      </section>
    </div>
  )
}

function Run({ r, c, k, fmtDate, secs }: { r: CalibrationRun; c: (typeof LEADS_COPY)['en']; k: (typeof JUDGEMENT_COPY)['en'] & (typeof CALIBRATION_COPY)['en']; fmtDate: (d: string) => string; secs: (ms: number | null) => string }) {
  const s = r.summary
  const verdict = s ? s.verdict ?? (s.qualified ? 'qualified' : 'not_qualified') : null
  const head = [
    fmtDate(r.at), r.category,
    s ? `${s.score}/100 · ${c.verdict[verdict as keyof typeof c.verdict] ?? verdict} · ${c.confidence[s.confidence]}` : k.failedRun(r.failure?.detail ?? '—'),
    s?.record ? k.pages(s.record.pages.length) : null, s ? k.facts(s.evidenceCount) : null, secs(r.durationMs),
  ].filter(Boolean).join(' · ')
  return (
    <details className="calib-run">
      <summary>
        <strong>{r.business}</strong>{r.test && <span className="money-sub"> · {k.test}</span>}
        <span className="money-sub"> — {head}</span>
        <br /><span className="money-sub">{r.review ? `${k.verdict[r.review.verdict]}${r.review.issues.length ? ` · ${r.review.issues.map(i => k.issue[i]).join(', ')}` : ''}` : s ? k.notReviewed : ''}</span>
      </summary>
      {r.website && <p className="money-sub">{r.website.replace(/^https?:\/\//, '')}</p>}
      {r.review?.note && <p>„{r.review.note}“</p>}
      {s && <p className="money-rail">{k.recommendation}: {c.next[s.recommendation] ?? s.recommendation}</p>}
      {s?.record ? (
        <>
          <p className="money-label">{k.record}</p>
          <ul className="money-list">
            {s.record.facts.map((f, i) => <li key={i}>{f.text} <span className="money-sub">„{f.quote}“</span></li>)}
          </ul>
          {s.record.opportunities.length > 0 && <p className="money-rail">{k.opportunities}: {s.record.opportunities.map(o => `${c.solution[o.solution] ?? o.solution} — ${o.hypothesis}`).join(' · ')}</p>}
          {s.record.unknowns.length > 0 && <p className="money-rail">{k.unknowns}: {s.record.unknowns.map(x => ('question' in x ? x.question : (c.unknown[x.code] ?? (() => x.code))(x.value))).join(' · ')}</p>}
          {s.record.limitations.length > 0 && <p className="money-rail">{k.limitations}: {s.record.limitations.map(x => (c.caveat[x.code] ?? (() => x.code))(x.value)).join(' · ')}</p>}
          <p className="money-sub">{s.record.pages.map(p => p.replace(/^https?:\/\//, '')).join(' · ')}</p>
        </>
      ) : s && <p className="money-sub">{k.noRecord}</p>}
      <Link className="money-more" href={`/os/leads/${r.leadId}`}>{k.openLead}</Link>
    </details>
  )
}
