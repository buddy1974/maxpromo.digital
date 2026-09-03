// Stable identifier for the single demo workspace (Sprint 4).
// The `businesses` table has no `key` column, so we identify the demo business
// by its NAME — chosen deliberately to avoid a schema change. When auth lands
// (Sprint 5), business context will come from the session instead of this name.
export const DEMO_BUSINESS_KEY = "maxpromo-demo-operations";
export const DEMO_BUSINESS_NAME = "Maxpromo Demo Operations";
export const DEMO_OWNER_EMAIL = "info@maxpromo.digital";
