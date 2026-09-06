// Demo waiting-room items. channel: whatsapp|email|phone|website_form|social.
// status: waiting|draft_ready|responded|lost. Suggested actions are PREPARED, never sent.
export const DEMO_WAITING_ROOM = [
  { customerName: "Dr. Anke Vogel", company: "Praxis Vogel", channel: "phone", reason: "Wartet auf Rückruf zur Termin-Automatisierung der Praxis.", waitingFor: "2 Tage", urgency: "high", status: "draft_ready", suggestedAction: "Rückruf-Skript + Terminvorschlag vorbereitet.", assignedAgent: "follow-up-agent" },
  { customerName: "Marco Rossi", company: "Trattoria Bella", channel: "whatsapp", reason: "Wartet auf den RestaurantOS-Demo-Link.", waitingFor: "1 Tag", urgency: "high", status: "draft_ready", suggestedAction: "Antwort mit Demo-Link-Entwurf bereit zur Freigabe.", assignedAgent: "follow-up-agent" },
  { customerName: "Stefan Brandt", company: "Brandt Handwerk GmbH", channel: "email", reason: "Wartet auf Follow-up zum Angebot.", waitingFor: "4 Tage", urgency: "urgent", status: "draft_ready", suggestedAction: "Freundliche Nachfass-Mail mit Terminoptionen vorbereitet.", assignedAgent: "follow-up-agent" },
  { customerName: "Petra Lindemann", company: "Lindemann Steuerkanzlei", channel: "website_form", reason: "TaxKontrol-Interessentin, offene Frage zum Onboarding.", waitingFor: "6 Stunden", urgency: "medium", status: "waiting", suggestedAction: "Onboarding-Erklärung + nächster Schritt vorbereitet.", assignedAgent: "crm-agent" },
  { customerName: "Jonas Weber", company: "Weber Verlag", channel: "email", reason: "Publishing-Kunde wartet auf Dokumenten-Review.", waitingFor: "3 Tage", urgency: "medium", status: "waiting", suggestedAction: "Review-Zusammenfassung vorbereitet, wartet auf Freigabe.", assignedAgent: "document-agent" },
];
