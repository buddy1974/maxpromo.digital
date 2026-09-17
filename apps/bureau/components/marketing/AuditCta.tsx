import { LeadForm } from "./LeadForm";
import { Icon } from "@maxpromo/ui";
import { getTranslations } from "next-intl/server";

// The primary conversion section. Two columns: the offer + the form.
export async function AuditCta() {
  const t = await getTranslations("auditCta");

  return (
    <section id="audit" className="bg-grid border-b border-hairline">
      <div className="mx-auto grid max-w-content gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
        <div>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 className="mt-4 text-section-title text-ink">
            {t("title")}
          </h2>
          <p className="mt-5 max-w-md text-lg text-ink-secondary">
            {t("lede")}
          </p>
          <ul className="mt-8 space-y-3 text-ink-secondary">
            {[t("b1"), t("b2"), t("b3")].map((p) => (
              <li key={p} className="flex gap-3">
                <span className="mt-0.5 text-ink-secondary"><Icon name="check" size="sm" /></span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <LeadForm />
        </div>
      </div>
    </section>
  );
}
