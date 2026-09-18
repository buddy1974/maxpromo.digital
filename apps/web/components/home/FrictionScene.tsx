import { Icon, type IconName } from '@maxpromo/ui'

/**
 * components/home/FrictionScene.tsx
 *
 * Three small drawings, one per situation in "Sound familiar?".
 *
 * WHY THESE ARE NOT THREE CARDS WITH AN ICON
 * A row of three cards each carrying one glyph says "we have three features".
 * These three are not features, they are the reader's own Tuesday, and each one
 * is a different shape of problem: a duplicate, a queue, and a split. Drawing
 * the shape is what makes a reader recognise it before they have read the
 * words, which is the whole job of this section.
 *
 * Every scene is CSS and inline SVG on the existing tokens. No illustration, no
 * stock art, nothing that has to be downloaded. They are `aria-hidden` and each
 * one is described in words beside it, because a drawing of a problem is not
 * information an assistive reader should have to infer from a shape.
 *
 * MOTION
 * One thing moves in each scene, and it is the thing the sentence is about: the
 * record being copied, the queue waiting, the three tools failing to meet. It
 * is slow and it loops. Under `prefers-reduced-motion` the animation stops at
 * the state that makes the point, which is handled in the stylesheet so it is
 * true before hydration.
 */

export type FrictionSceneId = 'copy' | 'queue' | 'split'

/* The tools in scene three, named as what they are rather than as products. */
const SPLIT_PARTS: readonly { icon: IconName; key: string }[] = [
  { icon: 'inbox', key: 'a' },
  { icon: 'projects', key: 'b' },
  { icon: 'clients', key: 'c' },
]

export function FrictionScene({ id, a11y }: { id: FrictionSceneId; a11y: string }) {
  return (
    <figure className="fscene" aria-hidden="true" data-scene={id}>
      {id === 'copy' && (
        /* Two systems, one record, typed twice. The travelling chip is the
           duplicate: it leaves the first box and arrives in the second. */
        <div>
          <span className="fscene-box">
            <Icon name="inbox" size="sm" />
            <span className="fscene-rows"><i /><i /><i /></span>
          </span>
          <span className="fscene-track">
            <span className="fscene-chip" />
          </span>
          <span className="fscene-box">
            <Icon name="projects" size="sm" />
            <span className="fscene-rows"><i /><i /><i /></span>
          </span>
        </div>
      )}

      {id === 'queue' && (
        /* Three jobs behind one person. The front one pulses; the two behind
           it do not move, which is the point of the picture. */
        <div>
          <span className="fscene-jobs">
            <span className="fscene-job fscene-job-front" />
            <span className="fscene-job" />
            <span className="fscene-job" />
          </span>
          <span className="fscene-gate" />
          <span className="fscene-person">
            <Icon name="user" size="sm" />
          </span>
        </div>
      )}

      {id === 'split' && (
        /* One customer, three tools, no line between them. The dashed arcs
           reach toward a centre that is not there. */
        <div className="fscene-split">
          <svg className="fscene-arcs" viewBox="0 0 120 64" preserveAspectRatio="none" focusable="false">
            <path d="M20 44 C 20 26, 60 26, 60 32" />
            <path d="M60 44 V 32" />
            <path d="M100 44 C 100 26, 60 26, 60 32" />
          </svg>
          <span className="fscene-gap" />
          <span className="fscene-tools">
            {SPLIT_PARTS.map((p) => (
              <span className="fscene-tool" key={p.key}>
                <Icon name={p.icon} size="sm" />
                <span className="fscene-rows"><i /><i /></span>
              </span>
            ))}
          </span>
        </div>
      )}

      <figcaption className="sr-only">{a11y}</figcaption>
    </figure>
  )
}
