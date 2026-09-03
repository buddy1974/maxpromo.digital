import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Providers from "@/components/auth/Providers";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
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
