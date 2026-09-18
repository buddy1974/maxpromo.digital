import Link from "next/link";
import { getTranslations } from "next-intl/server";

/**
 * app/not-found.tsx — the Agent Bureau 404.
 *
 * There was not one. An unknown path on agents.maxpromo.digital rendered the
 * framework's own default page: black Helvetica on white, "404 | This page
 * could not be found", no navigation, no wordmark, no German. A customer who
 * mistyped a deep link, or followed an old one, left the product entirely
 * without anything on the page suggesting they had not left the internet.
 *
 * Deliberately small. A 404 is a recovery, not a landing page: it says what
 * happened, carries the product's identity so the reader knows where they
 * still are, and offers the two routes back that exist — the public page and
 * the signed-in dashboard. It sells nothing.
 *
 * A server component, so it reads the catalogue like every other surface and
 * follows the same `bureau_locale` cookie. Next returns the correct HTTP 404
 * for this file; nothing here overrides the status.
 */
export default async function NotFound() {
  const t = await getTranslations("notFound");
  const c = await getTranslations("common");

  return (
    <main
      id="content"
      className="flex min-h-dvh flex-col items-center justify-center bg-surface-subtle px-4 py-16 text-center"
    >
      <span className="flex items-center gap-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-accent" />
        <span className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-ink">
          {c("brandWordmark")}
        </span>
      </span>

      <p className="mt-10 font-mono text-label uppercase tracking-[0.2em] text-ink-muted">
        404
      </p>

      <h1 className="mt-3 max-w-[22ch] text-2xl font-semibold tracking-tight text-ink">
        {t("title")}
      </h1>

      <p className="mt-4 max-w-[46ch] text-sm leading-relaxed text-ink-secondary">
        {t("body")}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn-primary">
          {t("toHome")}
        </Link>
        <Link href="/dashboard" className="btn-secondary">
          {t("toDashboard")}
        </Link>
      </div>
    </main>
  );
}
