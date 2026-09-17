import type { Metadata } from "next";
import { resolveDomain } from "@maxpromo/config";
import { Inter, Roboto_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import Providers from "@/components/auth/Providers";
import { resolveLocale, HTML_LANG, OG_LOCALE } from "@/lib/i18n/locale";
import "./globals.css";

/**
 * The faces the token package expects, under the names it reads.
 *
 * Until v7.0 this file loaded Inter as `--font-sans` and JetBrains Mono as
 * `--font-mono`, while @maxpromo/design-tokens builds --brand-font-sans from
 * `var(--font-inter)` and --brand-font-mono from `var(--font-roboto-mono)`.
 * Neither of those was ever defined here, so every token reference fell through
 * to the fallback stack: Agent Bureau rendered in Segoe UI and Consolas while
 * maxpromo.digital rendered in Inter and Roboto Mono — one platform, two
 * typefaces — and both of the webfonts this file downloaded went unused.
 *
 * A dangling var() does not warn. It resolves to the fallback and looks
 * deliberate. packages/tooling/check-token-inputs.mjs now fails the build when
 * an application does not define a variable the token package reads.
 */
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/** 700 is loaded because --weight-bold exists for the small mono label. */
const mono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  weight: ["400", "500", "700"],
  display: "swap",
});

/**
 * This property's own address, from the Domain Registry.
 *
 * It used to be `process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"`.
 * A deployment that forgot the variable resolved every OpenGraph URL and every
 * relative image against localhost — silently, because the page still rendered
 * and only a social crawler would ever have noticed. A domain's own address is
 * not configuration; it is the first thing the registry knows about it.
 */
const BUREAU = resolveDomain("agents.maxpromo.digital");
const siteUrl = BUREAU.origin;

/**
 * Metadata in the language of the request.
 *
 * There is no locale in the URL, so there are no `alternates.languages`: both
 * languages are the same address, and telling a crawler otherwise would be
 * declaring two URLs that do not exist. What changes is `og:locale` and the
 * text, which is what a share card actually shows.
 */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    metadataBase: new URL(siteUrl),
    applicationName: BUREAU.siteName,
    manifest: "/manifest.webmanifest",
    // This page emitted no canonical at all. A property with no canonical
    // leaves the choice of address to the crawler, which is the same class of
    // problem as naming the wrong one.
    alternates: { canonical: siteUrl },
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      type: "website",
      locale: OG_LOCALE[locale],
      url: siteUrl,
      // The registry names this property once; "Max Agent" and "Max Agent
      // Bureau" were two names for it in two files.
      siteName: BUREAU.siteName,
      // This page carried no og:image at all, so every share of
      // agents.maxpromo.digital rendered a bare link. The registry declares
      // one; declaring an image nothing emits is a registry that is true and
      // useless.
      images: [{
        url: BUREAU.openGraph.path,
        width: BUREAU.openGraph.width,
        height: BUREAU.openGraph.height,
        alt: BUREAU.product,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("twitterDescription"),
      images: [BUREAU.openGraph.path],
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await resolveLocale();

  return (
    <html lang={HTML_LANG[locale]} className={`${sans.variable} ${mono.variable}`}>
      <body>
        {/* The provider carries the messages to client components — the login
            form, the approval actions, the language control. Server components
            read them directly and never ship them to the browser. */}
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
