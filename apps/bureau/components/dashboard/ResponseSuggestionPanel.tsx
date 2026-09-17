import { getTranslations } from "next-intl/server";

// Generic panel for a prepared (not sent) response suggestion. Reused across the
// waiting room and document desk to make the "prepared, awaiting approval" state
// visually consistent — and to keep the no-autonomous-send rule obvious.
//
// Both of its words used to be German literals, one of them a default parameter
// value — which is the quietest place in a file for a string to hide, because
// it reads as an API decision rather than as copy. `label` stays overridable;
// it simply falls back to the catalogue instead of to one language.
export async function ResponseSuggestionPanel({
  label,
  text,
}: {
  label?: string;
  text: string;
}) {
  const t = await getTranslations("documents");

  return (
    <div className="rounded-lg border border-hairline bg-surface-subtle p-3">
      {/* Wraps rather than compressing: "Vorgeschlagene Antwort (Entwurf)"
          beside "nicht gesendet" does not fit a 320px card on one row, and
          the two were overlapping before this. */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="font-mono text-label-dense uppercase tracking-[0.14em] text-ink-muted">
          {label ?? t("draftLabel")}
        </p>
        <span className="font-mono text-label-dense uppercase tracking-[0.12em] text-ink-secondary">
          {t("notSent")}
        </span>
      </div>
      <p className="mt-1 text-sm text-ink-secondary">{text}</p>
    </div>
  );
}
