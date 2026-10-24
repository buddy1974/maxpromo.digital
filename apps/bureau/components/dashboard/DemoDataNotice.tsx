import { getTranslations } from "next-intl/server";

/**
 * Said, not implied: this screen shows example content because its real source is not connected
 * yet (known risk 113). Shown above any panel that renders lib/mock data in the signed-in product.
 */
export async function DemoDataNotice() {
  const t = await getTranslations("demoNotice");
  return (
    <p role="note" className="mb-4 rounded-md border border-hairline bg-surface-subtle px-4 py-3 text-xs text-ink-secondary">
      <span className="font-semibold text-ink">{t("label")}</span> {t("body")}
    </p>
  );
}
