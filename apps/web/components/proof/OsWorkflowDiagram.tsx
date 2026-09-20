import { Icon, type IconName } from '@maxpromo/ui'

import './proof.css'

/**
 * components/proof/OsWorkflowDiagram.tsx
 *
 * How a quotation actually gets made in Maxpromo OS, drawn from the code that
 * makes it.
 *
 * WHY THIS IS A COMPONENT AND NOT AN IMAGE
 * ADR-0013: a picture on a Maxpromo surface is built from the design system,
 * in markup, or it is not used. That rule was written about generated artwork
 * and it applies with more force here, because this diagram is evidence. An
 * exported PNG drifts from the code the moment the code changes and nothing
 * notices; markup beside the code shows up in the same diff.
 *
 * WHAT IT CLAIMS, AND WHAT ESTABLISHED IT
 * Every node was read out of the application on 2026-09-20. All of it is
 * `repository` basis in the proof package: it is what the source says, not
 * somebody's account of the software. The two facts the drawing exists to
 * carry:
 *
 *   NOTHING IS STORED UNTIL A PERSON SAVES. `applyExtracted()` in
 *   os/(protected)/angebote/new/page.tsx calls only React state setters, and
 *   api/os/ai/enhance/route.ts contains no INSERT. Extraction fills a form.
 *   `handleSave` is bound to an explicit button.
 *
 *   SENDING IS A SEPARATE DECISION. It is a different route, called from the
 *   detail view afterwards, and it is what moves the record to 'sent'.
 *
 * So the honest count is four human steps out of seven, and the thing this
 * drawing must never become is "AI creates and sends an invoice" — false here,
 * and the impression most automation diagrams leave.
 *
 * NOT MOUNTED ANYWHERE. Phase B3 captures evidence; publishing it is a
 * separate decision. Because nothing imports this, its CSS is in no route
 * chunk and no budget is spent on it yet.
 */

type Actor = 'system' | 'human'

interface Step {
  readonly id: string
  readonly actor: Actor
  readonly icon: IconName
  readonly label: { readonly de: string; readonly en: string }
  readonly detail: { readonly de: string; readonly en: string }
  /**
   * Whether a stored record exists once this step has finished. Drives the
   * connector below the step: dashed while nothing is persisted, solid after.
   */
  readonly recorded: boolean
}

const STEPS: readonly Step[] = [
  {
    id: 'source',
    actor: 'human',
    icon: 'inbox',
    label: { de: 'Die Anfrage kommt an', en: 'The enquiry arrives' },
    detail: {
      de: 'Als Foto, Screenshot, E-Mail oder Notiz',
      en: 'As a photo, screenshot, email or note',
    },
    recorded: false,
  },
  {
    id: 'extract',
    actor: 'system',
    icon: 'agents',
    label: { de: 'Das System liest sie aus', en: 'The system reads it' },
    detail: {
      de: 'Es füllt Felder, es legt nichts an',
      en: 'It fills in fields, it creates nothing',
    },
    recorded: false,
  },
  {
    id: 'review',
    actor: 'human',
    icon: 'quality',
    label: { de: 'Ein Mensch prüft', en: 'A person checks it' },
    detail: {
      de: 'Und korrigiert, was nicht stimmt',
      en: 'And corrects whatever is wrong',
    },
    recorded: false,
  },
  {
    id: 'save',
    actor: 'human',
    icon: 'approvals',
    label: { de: 'Ein Mensch speichert', en: 'A person saves' },
    detail: {
      de: 'Ab hier existiert ein Entwurf',
      en: 'From here a draft exists',
    },
    recorded: true,
  },
  {
    id: 'send-decision',
    actor: 'human',
    icon: 'send',
    label: { de: 'Ein Mensch gibt frei', en: 'A person decides to send' },
    detail: {
      de: 'Eigener Schritt, eigene Entscheidung',
      en: 'A separate step, a separate decision',
    },
    recorded: true,
  },
  {
    id: 'record',
    actor: 'system',
    icon: 'documents',
    label: { de: 'Das System hält es fest', en: 'The system records it' },
    detail: {
      de: 'Versendet, mit Zeitstempel',
      en: 'Sent, with a timestamp',
    },
    recorded: true,
  },
]

interface Props {
  locale?: 'de' | 'en'
  /**
   * The caption names the files the diagram was read from. On an internal
   * surface that is the provenance and belongs on screen; on a customer-facing
   * one it is noise, and the drawing stands without it.
   */
  showProvenance?: boolean
}

export function OsWorkflowDiagram({ locale = 'de', showProvenance = false }: Props) {
  const isDE = locale !== 'en'

  const title = isDE
    ? 'Wie in Maxpromo OS ein Angebot entsteht'
    : 'How a quotation is made in Maxpromo OS'

  /* The claim, not a ratio. Counting nodes would fold the customer who sends
     the enquiry in with the operator who checks, saves and releases, and those
     are two different people doing two different things. */
  const caption = isDE
    ? 'Das System legt nichts an und versendet nichts von selbst. Ein Mensch prüft, speichert und gibt frei. Gelesen aus angebote/new/page.tsx und api/os/ai/enhance/route.ts am 20. September 2026.'
    : 'The system creates nothing and sends nothing by itself. A person checks, saves and releases. Read from angebote/new/page.tsx and api/os/ai/enhance/route.ts on 20 September 2026.'

  return (
    <figure className="oswf" aria-label={title}>
      <div className="oswf-key">
        <span className="oswf-key-item">
          <span className="oswf-key-disc oswf-key-disc-system" aria-hidden="true" />
          {isDE ? 'System' : 'System'}
        </span>
        <span className="oswf-key-item">
          <span className="oswf-key-disc oswf-key-disc-human" aria-hidden="true" />
          {isDE ? 'Mensch' : 'Person'}
        </span>
        <span className="oswf-key-item">
          <span className="oswf-key-line oswf-key-line-none" aria-hidden="true" />
          {isDE ? 'Noch nichts gespeichert' : 'Nothing stored yet'}
        </span>
        <span className="oswf-key-item">
          <span className="oswf-key-line" aria-hidden="true" />
          {isDE ? 'Datensatz vorhanden' : 'A record exists'}
        </span>
      </div>

      <ol className="oswf-steps">
        {STEPS.map((s) => (
          <li
            key={s.id}
            className={[
              'oswf-step',
              `oswf-step-${s.actor}`,
              s.recorded ? 'oswf-step-recorded' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span className="oswf-marker">
              <span className="oswf-disc">
                <Icon name={s.icon} size="sm" />
              </span>
            </span>
            <span className="oswf-text">
              <span className="oswf-actor">
                {s.actor === 'human' ? (isDE ? 'Mensch' : 'Person') : 'System'}
              </span>
              <span className="oswf-label">{s.label[isDE ? 'de' : 'en']}</span>
              <span className="oswf-detail">{s.detail[isDE ? 'de' : 'en']}</span>
            </span>
          </li>
        ))}
      </ol>

      {showProvenance ? <figcaption className="oswf-caption">{caption}</figcaption> : null}
    </figure>
  )
}
