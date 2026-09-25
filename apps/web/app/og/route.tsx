import { ImageResponse } from 'next/og'
import { BRAND_OG, OG_FAMILIES, type OgFamily } from '@/lib/seo/og'

/**
 * app/og/route.tsx — the social card, generated.
 *
 * WHY GENERATED AND NOT A FOLDER OF PNGs
 *
 * The site served one static image for every page. A link to the Resources
 * page and a link to the Impressum previewed identically, which is how a
 * Facebook share of a specific page ends up telling nobody which page it is.
 *
 * The alternative to one static image is not forty static images. That is the
 * same problem with more maintenance: the day a page is renamed, its card
 * quietly starts lying, and nothing notices. One route that draws from the
 * page's own title cannot drift from it.
 *
 * WHAT IT DRAWS
 *
 * Black, one lime rule, the wordmark, the page title, and a small family
 * label. Nothing else. No robot, no neural network, no gradient, no stock
 * photograph, and above all no figure — a social card is a persuasive surface
 * and the claim rules apply to it exactly as they apply to a page.
 *
 * The card should be recognisable as Maxpromo before anybody reads the domain,
 * which is what the lime rule and the wordmark are for, and it should say what
 * page you are about to open, which is what the title is for.
 *
 *   /og?title=...&family=capability&locale=de
 */

export const runtime = 'edge'

/** Kept short enough to stay legible at the size a timeline renders it. */
const MAX_TITLE = 90

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const rawTitle = (searchParams.get('title') ?? '').trim()
  const title = rawTitle.length > MAX_TITLE
    ? `${rawTitle.slice(0, MAX_TITLE - 1).trimEnd()}…`
    : rawTitle || 'Maxpromo Digital'

  const familyParam = searchParams.get('family') ?? ''
  const family: OgFamily = (OG_FAMILIES as readonly string[]).includes(familyParam)
    ? (familyParam as OgFamily)
    : 'company'
  const locale = searchParams.get('locale') === 'en' ? 'en' : 'de'

  const label = BRAND_OG.familyLabel[family][locale]

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: BRAND_OG.black,
          padding: '64px 72px',
        }}
      >
        {/* The wordmark, set as text. There is no image logo and none is needed. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 56, height: 6, background: BRAND_OG.lime }} />
          <div
            style={{
              fontSize: 26,
              letterSpacing: 6,
              color: BRAND_OG.white,
              fontWeight: 700,
            }}
          >
            MAXPROMO DIGITAL
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* The family label. Small, so it orients without competing. */}
          <div
            style={{
              fontSize: 22,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: BRAND_OG.lime,
              fontWeight: 600,
            }}
          >
            {label}
          </div>

          {/* The page's own title, which is what makes this card about a page
              rather than about the company. */}
          <div
            style={{
              fontSize: title.length > 54 ? 56 : 68,
              lineHeight: 1.15,
              color: BRAND_OG.white,
              fontWeight: 600,
              letterSpacing: -1,
            }}
          >
            {title}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: 20,
            color: BRAND_OG.muted,
          }}
        >
          <div>maxpromo.digital</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {/* Three marks, the site's own grammar: process, decision, record. */}
            <div style={{ width: 28, height: 6, background: BRAND_OG.lime }} />
            <div style={{ width: 28, height: 6, background: BRAND_OG.limeDark }} />
            <div style={{ width: 28, height: 6, background: BRAND_OG.muted }} />
          </div>
        </div>
      </div>
    ),
    { width: BRAND_OG.width, height: BRAND_OG.height },
  )
}
