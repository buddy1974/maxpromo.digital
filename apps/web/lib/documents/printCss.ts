import { token } from '@maxpromo/design-tokens'

/**
 * lib/documents/printCss.ts
 *
 * The one shared @media print stylesheet for the whole document system.
 * Previously this exact block (including the `:has()` selector hacks
 * that strip the app's global Navbar/Footer/OS layout wrapper during
 * print) was pasted independently into both the invoice and angebot
 * print pages. It now lives here once.
 *
 * Design notes for print correctness:
 *  - `thead` is NOT given `display: table-header-group` explicitly
 *    because it already is one by default — browsers repeat a real
 *    <thead> on every printed page a <table> spans automatically. The
 *    line-items table in DocumentTable.tsx relies on this: header
 *    repeats, individual rows never split (`tr { break-inside: avoid }`).
 *  - The totals block is rendered OUTSIDE the <table> (a plain <div>)
 *    specifically so it can carry `break-inside: avoid` as a single
 *    unit and never be split across a page boundary — a <tfoot> would
 *    either repeat on every page (wrong) or still be splittable
 *    row-by-row depending on browser (unreliable).
 *  - `window.print()` has no header/footer-template API (that's a
 *    Puppeteer-only feature), so the compact top strip and footer in
 *    DocumentPage.tsx are pinned with `position: fixed` under
 *    `@media print` below — the standard technique browsers use to
 *    repeat an element on every printed page. `[data-print-body]`
 *    reserves matching top/bottom padding so flowing content never
 *    renders underneath the fixed strips.
 */
export const DOCUMENT_PRINT_CSS = `
  body { background: ${token.surfaceSunken}; }
  * { box-sizing: border-box; }

  @media print {
    /* Force Chrome/Safari/Firefox to print background colors — without
       this the dark letterhead and orange totals row print as plain white. */
    *, *::before, *::after {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: var(--brand-surface) !important;
      height: auto !important;
      min-height: 0 !important;
      overflow: visible !important;
    }

    /* Hide every body child whose subtree does NOT contain the document
       — kills the global Navbar/Footer/ChatAgent/CookieBanner from
       app/layout.tsx without needing to touch them. */
    body > *:not(:has([data-print-doc])) {
      display: none !important;
    }

    /* The OS root layout wraps pages in a fixed-position div that
       browsers would otherwise clip at viewport height and repeat on
       every printed page. Reset it so the document flows naturally. */
    body > *:has([data-print-doc]) {
      position: static !important;
      inset: auto !important;
      height: auto !important;
      min-height: 0 !important;
      overflow: visible !important;
      background: transparent !important;
      z-index: auto !important;
      display: block !important;
    }

    .no-print { display: none !important; }

    [data-print-doc] {
      box-shadow: none !important;
      margin: 0 auto !important;
      max-width: none !important;
    }

    @page { size: A4; margin: 18mm 16mm; }

    /* Individual rows never split mid-row across a page break; the
       table itself is still allowed to flow across pages so a long
       service list doesn't waste a whole page waiting to fit as one block. */
    tr { page-break-inside: avoid; break-inside: avoid; }

    /* Totals block (see design note above) never splits. */
    [data-keep-together] { page-break-inside: avoid; break-inside: avoid; }

    /* Repeating top strip + footer (see design note above) — pinned to
       the page box so Chrome/Firefox/Safari redraw them on every
       printed page, matching the Midas reference's per-page header/footer. */
    [data-print-topstrip] {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1;
    }
    [data-print-footer] {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 1;
    }
    /* Reserves space so flowing content never renders under the fixed
       strips above — sized generously above the strips' actual ~28px
       rendered height for safety margin. */
    [data-print-body] {
      padding-top: 42px;
      padding-bottom: 42px;
    }
  }
`
