import type { ManualDeliveryNote } from "@/types/operating-model";

// Manual/concierge delivery notes — value delivered by hand while the platform
// grows. These feed the systemization stage (repeatable workflows).
export const MOCK_MANUAL_DELIVERY_NOTES: ManualDeliveryNote[] = [
  {
    id: "md-1",
    clientName: "Trattoria Bella Essen",
    observation: "Reservierungsanfragen kommen über 3 Kanäle und werden nachts nicht beantwortet.",
    proposedWorkflow: "Warteraum + Follow-Up-Agent bereiten Antworten vor; Inhaberin gibt morgens frei.",
    status: "proposed",
  },
  {
    id: "md-2",
    clientName: "Druck & Design Ruhr GmbH",
    observation: "Angebote werden manuell in Word erstellt, dauern Stunden.",
    proposedWorkflow: "Document-Agent erstellt Angebotsentwürfe aus Vorlage; Geschäftsführer prüft.",
    status: "captured",
  },
  {
    id: "md-3",
    clientName: "Nordlicht Logistik",
    observation: "Rechnungszyklus dauert 3 Tage durch manuelle Datenübertragung.",
    proposedWorkflow: "Operations-Agent bündelt Daten; freigegebene Schritte verkürzen den Zyklus.",
    status: "approved",
  },
];
