// LOCKED business identity. Mandated by the Maxpromo system header.
// The §19 UStG clause is legally required and must NEVER be removed or altered.
export const BUSINESS = {
  legalName: "Marcel Tabit Akwe",
  brand: "Maxpromo Digital",
  product: "Max Agent",
  street: "Körnerstr. 8",
  city: "45143 Essen",
  country: "Deutschland",
  steuernummer: "111/5339/7597",
  finanzamt: "FA Essen-NordOst",
  email: "info@maxpromo.digital",
} as const;

// Required on every commercial surface (Kleinunternehmer § 19 UStG). Do not change.
export const UST_CLAUSE = "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.";
