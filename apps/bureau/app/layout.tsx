import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import Providers from "@/components/auth/Providers";
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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Max Agent — Ihr KI-Betriebsteam | Maxpromo Digital",
  description:
    "Kein Chatbot. Ein überwachtes KI-Betriebsteam, das Anfragen, Follow-ups und Abläufe führt — Sie behalten die Kontrolle. Installiert von Maxpromo Digital, Essen.",
  openGraph: {
    title: "Max Agent — Ihr KI-Betriebsteam",
    description:
      "Ein überwachtes KI-Betriebsteam für Ihren Betrieb. Sie genehmigen, die Agenten führen aus. Maxpromo Digital, Essen.",
    type: "website",
    locale: "de_DE",
    url: siteUrl,
    siteName: "Max Agent",
  },
  twitter: {
    card: "summary_large_image",
    title: "Max Agent — Ihr KI-Betriebsteam",
    description:
      "Ein überwachtes KI-Betriebsteam für Ihren Betrieb. Sie genehmigen, die Agenten führen aus.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
