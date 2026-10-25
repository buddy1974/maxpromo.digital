/**
 * Universal Max screen copy, German and English (ADR-0029). English is typed against German.
 * Previews, warnings and results are written by the server in the screen language (lib/max/copy.ts);
 * this module holds the composer, the cards and their buttons.
 */
const de = {
  placeholder: 'Schreib Max, was passiert ist oder was du brauchst …',
  placeholderFile: 'Was soll Max damit tun? (leer lassen = Kontakt erfassen)',
  send: 'Senden', thinking: 'Max liest …', attach: 'Datei anhängen', photo: 'Foto aufnehmen', removeFile: 'Datei entfernen',
  voice: 'Diktieren', voiceStop: 'Aufnahme beenden', voiceListening: 'Hört zu … tippe zum Beenden', voiceTranscribing: 'Wandelt Sprache in Text …',
  voiceDenied: 'Kein Zugriff aufs Mikrofon. Erlaube es in den Browser-Einstellungen — oder tippe einfach.',
  voiceFailed: 'Die Aufnahme hat nicht geklappt. Tippe stattdessen oder versuche es erneut.',
  voiceEmpty: 'Ich habe nichts verstanden. Versuche es noch einmal oder tippe.',
  voiceUnavailable: 'Diktieren ist in diesem Browser nicht verfügbar. Nutze die Diktierfunktion deiner Tastatur oder tippe.',
  voiceReview: 'Text prüfen und bei Bedarf ändern, dann senden.',
  voiceBrowserNote: 'Spracherkennung durch deinen Browser',
  context: 'Bezieht sich auf', contextRemove: 'Bezug entfernen',
  shortcutsLabel: 'Schnell starten',
  shortcuts: [
    { label: 'Kunde aus Dokument', text: '', scan: true },
    { label: 'Kunde anlegen', text: 'Neuer Kunde: ' },
    { label: 'E-Mail entwerfen', text: 'Schreib eine E-Mail an ' },
    { label: 'Rechnung erstellen', text: 'Erstelle eine Rechnung für ' },
    { label: 'Zahlung erfassen', text: 'Zahlung erhalten von ' },
    { label: 'Wiedervorlage', text: 'Erinnere mich am Freitag, ' },
  ],
  questionsLabel: 'Fragen',
  scanTitle: 'Dokument erfassen', scanHint: 'Visitenkarte, Screenshot, Briefkopf oder PDF. Max liest den Kontakt aus — gespeichert wird erst, wenn du bestätigst.',
  scanChoose: 'Datei wählen', scanCamera: 'Foto aufnehmen', scanCancel: 'Abbrechen',
  you: 'Du', max: 'Max', file: 'Datei',
  understood: 'Max hat verstanden', proposals: (n: number) => `${n} Vorschläge`,
  status: {
    proposed: 'Vorschlag', executing: 'Wird ausgeführt …', awaiting_approval: 'Wartet auf deine Freigabe', done: 'Erledigt', failed: 'Fehlgeschlagen',
    refused: 'Nicht möglich', rejected: 'Verworfen', expired: 'Abgelaufen',
  } as Record<string, string>,
  missing: 'Fehlt noch', choose: 'Auswählen', open: 'Öffnen',
  confirm: 'Bestätigen', confirmPayment: 'Zahlung jetzt erfassen', edit: 'Ändern', reject: 'Verwerfen', cancel: 'Abbrechen', apply: 'Übernehmen',
  confirmAll: (n: number) => `Alle ${n} bestätigen`, confirmSelected: (n: number) => `${n} ausgewählte bestätigen`, select: 'Auswählen',
  approvalTitle: 'Bitte prüfen und freigeben', approvalNote: 'Das ist die genaue Buchung. Erst mit deiner Freigabe wird sie erfasst.',
  partial: (done: number, total: number) => `${done} von ${total} Aktionen erledigt`,
  allDone: (n: number) => (n === 1 ? 'Erledigt' : `Alle ${n} Aktionen erledigt`),
  needsAttention: 'Braucht noch deine Angabe',
  errorReply: 'Max ist gerade nicht erreichbar. Nichts wurde geändert — bitte erneut versuchen.',
  sessionExpired: 'Sitzung abgelaufen — bitte neu anmelden.',
  history: 'Frühere Gespräche', facts: 'Belege aus deinen Daten', notes: 'Hinweise',
  fileTooLarge: 'Die Datei ist größer als 4 MB.', fileType: 'Möglich sind PDF, Bilder und Text.',
  changed: 'Seit der Vorschau hat sich etwas geändert. Bitte erneut prüfen.',
  selectedThreads: (n: number) => `${n} ausgewählte Konversation(en)`,
}

type MaxScreenCopy = typeof de

const en: MaxScreenCopy = {
  placeholder: 'Tell Max what happened or what you need …',
  placeholderFile: 'What should Max do with it? (leave empty = capture the contact)',
  send: 'Send', thinking: 'Max is reading …', attach: 'Attach a file', photo: 'Take a photo', removeFile: 'Remove file',
  voice: 'Dictate', voiceStop: 'Stop recording', voiceListening: 'Listening … tap to stop', voiceTranscribing: 'Turning speech into text …',
  voiceDenied: 'No access to the microphone. Allow it in the browser settings — or just type.',
  voiceFailed: 'Recording did not work. Type instead or try again.',
  voiceEmpty: 'I did not catch anything. Try again or type.',
  voiceUnavailable: 'Dictation is not available in this browser. Use your keyboard’s dictation or type.',
  voiceReview: 'Check the text and change it if needed, then send.',
  voiceBrowserNote: 'Speech recognition by your browser',
  context: 'About', contextRemove: 'Remove reference',
  shortcutsLabel: 'Quick start',
  shortcuts: [
    { label: 'Client from document', text: '', scan: true },
    { label: 'New client', text: 'New client: ' },
    { label: 'Draft an email', text: 'Write an email to ' },
    { label: 'Create invoice', text: 'Create an invoice for ' },
    { label: 'Record payment', text: 'Payment received from ' },
    { label: 'Follow-up', text: 'Remind me on Friday to ' },
  ],
  questionsLabel: 'Questions',
  scanTitle: 'Capture a document', scanHint: 'Business card, screenshot, letterhead or PDF. Max reads the contact — nothing is saved until you confirm.',
  scanChoose: 'Choose file', scanCamera: 'Take photo', scanCancel: 'Cancel',
  you: 'You', max: 'Max', file: 'File',
  understood: 'Max understood', proposals: (n: number) => `${n} proposals`,
  status: {
    proposed: 'Proposal', executing: 'Running …', awaiting_approval: 'Waiting for your approval', done: 'Done', failed: 'Failed',
    refused: 'Not possible', rejected: 'Rejected', expired: 'Expired',
  },
  missing: 'Still needed', choose: 'Choose', open: 'Open',
  confirm: 'Confirm', confirmPayment: 'Record payment now', edit: 'Edit', reject: 'Reject', cancel: 'Cancel', apply: 'Apply',
  confirmAll: (n: number) => `Confirm all ${n}`, confirmSelected: (n: number) => `Confirm ${n} selected`, select: 'Select',
  approvalTitle: 'Please check and approve', approvalNote: 'This is the exact booking. It is recorded only when you approve.',
  partial: (done: number, total: number) => `${done} of ${total} actions completed`,
  allDone: (n: number) => (n === 1 ? 'Done' : `All ${n} actions completed`),
  needsAttention: 'Still needs your input',
  errorReply: 'Max is not reachable right now. Nothing was changed — please try again.',
  sessionExpired: 'Session expired — please sign in again.',
  history: 'Earlier conversations', facts: 'Facts from your records', notes: 'Notes',
  fileTooLarge: 'The file is larger than 4 MB.', fileType: 'PDF, images and text are supported.',
  changed: 'Something changed since the preview. Please review again.',
  selectedThreads: (n: number) => `${n} selected conversation(s)`,
}

export const MAX_SCREEN_COPY: Record<'de' | 'en', MaxScreenCopy> = { de, en }
export type { MaxScreenCopy }
