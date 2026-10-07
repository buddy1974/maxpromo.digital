/**
 * lib/documents/ai-surfaces.ts
 *
 * Every place AI output can enter the OS, named and classified, so the
 * provenance boundary is a governed list rather than a habit.
 *
 * WHY A LIST
 *
 * Risk 62 was the discovery that the boundary existed on one of three screens
 * that offered AI extraction, and that two retired routes could still produce
 * an unguarded commercial document. Nothing had failed; nobody had been told
 * the other doors existed. prove:extraction-integrity now discovers every AI
 * route, every screen that calls one, and every route that persists document
 * line items, and fails on any it cannot find here. Adding a door means adding
 * it to this file, and the class decides which checks it must pass.
 *
 * THE CLASSES
 *
 *   document   produces or edits a quotation or invoice. Routes must run the
 *              provenance guard; screens must keep hold markers, show why a
 *              line is held, offer the deliberate override, refuse to save
 *              while anything is held, and link clients only by the exact rule.
 *   contact    produces a contact record, never a commercial document. Must not
 *              ask the extraction route for a document kind.
 *   assistant  conversational text. Produces neither.
 *
 * Paths are relative to apps/web.
 */

export type AiSurfaceClass = 'document' | 'contact' | 'assistant'

/** Every route under app/api/os/ai. */
export const AI_ROUTES: Readonly<Record<string, AiSurfaceClass>> = {
  'app/api/os/ai/route.ts':                  'assistant',
  'app/api/os/ai/enhance/route.ts':          'document',
  'app/api/os/ai/generate-invoice/route.ts': 'document',
  'app/api/os/ai/scan-invoice/route.ts':     'document',
  'app/api/os/ai/scan-client/route.ts':      'contact',
}

/** Every file that calls an AI route. */
export const AI_SCREENS: Readonly<Record<string, AiSurfaceClass>> = {
  'app/os/(protected)/angebote/new/page.tsx':       'document',
  'app/os/(protected)/angebote/[id]/edit/page.tsx': 'document',
  'app/os/(protected)/invoices/new/page.tsx':       'document',
  /* Quick contact scan (kind: client) and the assistant chat. */
  'app/os/(protected)/layout.tsx':                  'contact',
  'app/os/(protected)/clients/page.tsx':            'contact',
}

/**
 * Every route — or server module — that stores or sends commercial-document
 * line items. The commercial service (ADR-0018) writes documents from the
 * mobile layer; it is a door like any route and is held to the same guard.
 */
export const LINE_ITEM_ROUTES: readonly string[] = [
  'app/api/os/angebote/route.ts',
  'app/api/os/invoices/route.ts',
  'app/api/os/send-invoice/route.ts',
  'lib/commercial/capabilities/documents.ts',
]
