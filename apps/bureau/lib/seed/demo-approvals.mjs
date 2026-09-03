// Demo agent proposals (the approval queue). risk_level: low|medium|high|critical.
// status stays 'pending' — nothing is executed. One approval_event is seeded per
// proposal by the orchestrator to populate the audit trail.
export const DEMO_PROPOSALS = [
  { agentKey: "follow-up-agent", title: "Follow-up an Brandt Handwerk vorbereiten", businessContext: "Kunde wartet seit 4 Tagen auf Angebots-Follow-up.", proposedAction: "Freundliche Nachfass-E-Mail mit Terminoptionen (Entwurf, nicht gesendet).", expectedOutcome: "Reaktiviertes Gespräch.", riskLevel: "high" },
  { agentKey: "document-agent", title: "Steuerberater-Schreiben zusammenfassen", businessContext: "Schreiben fordert Unterlagen zur USt-Voranmeldung.", proposedAction: "Zusammenfassung + Unterlagenliste erstellen.", expectedOutcome: "Klare nächste Schritte, Frist eingehalten.", riskLevel: "medium" },
  { agentKey: "lead-agent", title: "Eingehende Anfrage qualifizieren", businessContext: "Neue Anfrage aus dem Webformular.", proposedAction: "Lead bewerten und in die Pipeline aufnehmen.", expectedOutcome: "Strukturierte Nachverfolgung.", riskLevel: "low" },
  { agentKey: "crm-agent", title: "Deal-Status aktualisieren", businessContext: "Praxis Vogel ist im Gespräch fortgeschritten.", proposedAction: "CRM-Status auf 'qualifiziert' vorschlagen.", expectedOutcome: "Aktuelle Pipeline.", riskLevel: "low" },
  { agentKey: "calendar-agent", title: "Erinnerung für Rückruf planen", businessContext: "Rückruf an Dr. Vogel zugesagt.", proposedAction: "Erinnerung + Zeitfenster vorschlagen.", expectedOutcome: "Kein verpasster Rückruf.", riskLevel: "low" },
  { agentKey: "follow-up-agent", title: "Wartenden Kunden eskalieren", businessContext: "Brandt Handwerk wartet ungewöhnlich lange.", proposedAction: "Als dringend markieren und dem Owner vorlegen.", expectedOutcome: "Schnellere Reaktion.", riskLevel: "medium" },
  { agentKey: "chief-of-staff", title: "Nächsten Audit-Schritt empfehlen", businessContext: "Audit zeigt hohe Priorität bei Follow-ups und Tools.", proposedAction: "Empfehlung: mit Warteraum + CRM-Anbindung starten.", expectedOutcome: "Klarer Implementierungs-Startpunkt.", riskLevel: "low" },
];
