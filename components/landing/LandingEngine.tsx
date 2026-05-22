import { LandingThemeProvider } from './LandingThemeProvider'
import { HeroWorld }   from './sections/HeroWorld'
import { Pain }        from './sections/Pain'
import { BeforeAfter } from './sections/BeforeAfter'
import { HowItWorks }  from './sections/HowItWorks'
import { Features }    from './sections/Features'
import { InAction }    from './sections/InAction'
import { Faq }         from './sections/Faq'
import { Conversion }  from './sections/Conversion'
import type { LandingData } from '@/lib/registry/adapters/landing.adapter'

interface LandingEngineProps {
  data:    LandingData
  bridge?: boolean
}

/**
 * Registry-driven product showcase. One component, 8 sections, zero per-product branching.
 *
 * showcase mode (bridge=false, default):
 *   All sections rendered. Used on dedicated product domains (restaurant-os.de, etc.)
 *
 * bridge mode (bridge=true):
 *   HeroWorld + Conversion only. Pain/flow/proof sections suppressed.
 *   Used on maxpromo.digital/products/[slug] as a compact product summary card.
 *   Conversion secondary CTA points to the product's own domain.
 */
export function LandingEngine({ data, bridge = false }: LandingEngineProps) {
  return (
    <LandingThemeProvider brandColor={data.brandColor} backgroundDark={data.backgroundDark}>

      <HeroWorld
        domainBrand={data.domainBrand}
        headline={data.headline}
        subline={data.subline}
        bullets={data.bullets}
        cardImageSrc={data.cardImageSrc}
        ctaPrimary={data.ctaPrimary}
        ctaSecondary={data.ctaSecondary}
        bookDemoUrl={data.bookDemoUrl}
        demoUrl={data.demoUrl}
        systemUrl={data.systemUrl}
      />

      {!bridge && (
        <Pain
          bullets={data.bullets}
          description={data.description}
          locale={data.locale}
        />
      )}

      {!bridge && (
        <BeforeAfter
          bullets={data.bullets}
          locale={data.locale}
        />
      )}

      {!bridge && (
        <HowItWorks
          workflow={data.workflow}
          locale={data.locale}
        />
      )}

      {!bridge && (
        <Features
          bullets={data.bullets}
          locale={data.locale}
        />
      )}

      {!bridge && (
        <InAction
          workflow={data.workflow}
          cardImageSrc={data.cardImageSrc}
          domainBrand={data.domainBrand}
          locale={data.locale}
        />
      )}

      {/* Faq: show only when data exists and not in bridge mode */}
      {!bridge && data.faq && data.faq.length > 0 && (
        <Faq
          faq={data.faq}
          locale={data.locale}
        />
      )}

      <Conversion
        bookDemoUrl={data.bookDemoUrl}
        demoUrl={data.demoUrl}
        systemUrl={data.systemUrl}
        domain={data.domain}
        ctaPrimary={data.ctaPrimary}
        locale={data.locale}
        bridge={bridge}
      />

    </LandingThemeProvider>
  )
}
