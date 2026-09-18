import { existsSync } from 'node:fs'
import { join } from 'node:path'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'

/**
 * components/home/FounderNote.tsx
 *
 * Marcel, in his own voice, with a slot for his own photograph.
 *
 * THE PHOTOGRAPH IS NOT FAKED
 * No AI portrait, no stock person, no silhouette pretending to be somebody.
 * The component checks whether a real file exists at the path below and renders
 * it if it does. If it does not, the frame stays and carries the founder's
 * initials and a short line saying a photograph is to follow. That is honest:
 * the reader sees a person is meant to be here and that we have not put a
 * stranger in his place.
 *
 * Drop the file in and it appears. There is no code change to make:
 *
 *     apps/web/public/images/homepage/founder.jpg
 *
 * A portrait, subject looking at the camera, real room, no studio backdrop.
 * 1200x1500 minimum for a 2x render at this size.
 *
 * The existence check runs on the server at render time, which is why this is
 * a server component. It costs one `existsSync` per render of the homepage.
 */

const PORTRAIT = '/images/homepage/founder.jpg'

export interface FounderCopy {
  eyebrow: string
  title: string
  p1: string
  p2: string
  list: readonly string[]
  p3: string
  p4: string
  rule: string
  name: string
  role: string
  cta: string
  portraitAlt: string
  portraitPending: string
}

export function FounderNote({ copy }: { copy: FounderCopy }) {
  const hasPortrait = existsSync(join(process.cwd(), 'public', PORTRAIT.replace(/^\//, '')))

  return (
    <div className="founder">
      <figure className="founder-portrait">
        {hasPortrait ? (
          <Image
            src={PORTRAIT}
            alt={copy.portraitAlt}
            width={1200}
            height={1500}
            sizes="(min-width: 900px) 20rem, 100vw"
            className="founder-photo"
          />
        ) : (
          <div className="founder-photo founder-photo-pending">
            {/* Initials, not a stock face and not a generated one. */}
            <span className="founder-initials" aria-hidden="true">MA</span>
            <span className="founder-pending-note">{copy.portraitPending}</span>
          </div>
        )}
      </figure>

      <div className="founder-say">
        <p className="section-label">{copy.eyebrow}</p>
        <h2 className="founder-title">{copy.title}</h2>

        <p className="founder-p">{copy.p1}</p>
        <p className="founder-p">{copy.p2}</p>

        <ul className="founder-list">
          {copy.list.map((line) => <li key={line}>{line}</li>)}
        </ul>

        <p className="founder-p">{copy.p3}</p>
        <p className="founder-p">{copy.p4}</p>

        <p className="founder-rule">{copy.rule}</p>

        <p className="founder-sig">
          <span className="founder-name">{copy.name}</span>
          <span className="founder-role">{copy.role}</span>
        </p>

        <Link href="/about" className="quiet-link">{copy.cta}</Link>
      </div>
    </div>
  )
}
