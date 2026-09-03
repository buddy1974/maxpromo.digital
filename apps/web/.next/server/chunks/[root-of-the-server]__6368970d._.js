module.exports=[18622,(e,t,n)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,n)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,n)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,n)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},70406,(e,t,n)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},93695,(e,t,n)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},58788,39749,e=>{"use strict";let t="#111111",n="#FFFFFF",r="#F4F4F5",a="#F7FEE7",o={background:n,surface:n,surfaceSubtle:"#FAFAFA",surfaceSunken:r,surfaceAccent:a,surfaceInverted:t,border:"#E4E4E7",borderStrong:"#D4D4D8",text:t,textSecondary:"#52525B",textMuted:"#71717A",textInverted:r,primary:"#A3E635",primaryHover:"#84CC16",primaryDark:"#65A30D",primaryText:"#4D7C0F",primarySoft:a,onPrimary:t,success:"#047857",successSoft:"#ECFDF5",warning:"#B45309",warningSoft:"#FFFBEB",danger:"#B91C1C",dangerSoft:"#FEF2F2",info:"#1D4ED8",infoSoft:"#EFF6FF"};async function i(e){let t=process.env.RESEND_API_KEY;if(!t)return console.error("[email] delivery unavailable: RESEND_API_KEY is not configured"),{success:!1,error:"email_not_configured"};let n=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${t}`,"Content-Type":"application/json"},body:JSON.stringify({from:e.from,to:Array.isArray(e.to)?e.to:[e.to],subject:e.subject,html:e.html,reply_to:e.replyTo,...e.bcc?.length?{bcc:e.bcc}:{}})});return n.ok?{success:!0,id:(await n.json()).id}:(console.error("[email] Resend API error:",await n.text()),{success:!1,error:`Resend error ${n.status}`})}function s(e){let t=e.system?`<tr>
        <td style="padding: 8px 0; font-weight: bold; color: ${o.primaryText}; width: 160px; vertical-align: top;">System:</td>
        <td style="padding: 8px 0; color: ${o.text}; font-weight: bold;">${l(e.system)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold; color: ${o.textSecondary}; width: 160px; vertical-align: top;">Source:</td>
        <td style="padding: 8px 0; color: ${o.text};">${l(e.system)}_consultation_request</td>
      </tr>`:"",n=e.phone?`<tr>
        <td style="padding: 8px 0; font-weight: bold; color: ${o.textSecondary};">Phone:</td>
        <td style="padding: 8px 0; color: ${o.text};">${l(e.phone)}</td>
      </tr>`:"",r=e.painPoints.length?`<tr>
        <td style="padding: 8px 0; font-weight: bold; color: ${o.textSecondary}; vertical-align: top;">Help requested:</td>
        <td style="padding: 8px 0; color: ${o.text};">${e.painPoints.map(l).join("<br>")}</td>
      </tr>`:"",a=e.system?`Consultation Request — ${l(e.system)}`:"New Enquiry — Maxpromo Digital";return`
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: ${o.surface};">
      <div style="background: ${o.text}; padding: 24px; border-bottom: 3px solid ${o.primary};">
        <h2 style="color: ${o.surface}; margin: 0; font-size: 20px; font-weight: 700;">
          ${a}
        </h2>
        <p style="color: ${o.textMuted}; margin: 4px 0 0; font-size: 13px;">
          Submitted: ${new Date().toLocaleString("en-GB",{timeZone:"Europe/London"})}
        </p>
      </div>
      <div style="padding: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          ${t}
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: ${o.textSecondary}; width: 160px;">Name:</td>
            <td style="padding: 8px 0; color: ${o.text};">${l(e.name)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: ${o.textSecondary};">Email:</td>
            <td style="padding: 8px 0; color: ${o.text};">
              <a href="mailto:${l(e.email)}" style="color: ${o.primaryText};">${l(e.email)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: ${o.textSecondary};">Organisation:</td>
            <td style="padding: 8px 0; color: ${o.text};">${l(e.company)}</td>
          </tr>
          ${n}
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: ${o.textSecondary};">Preferred contact:</td>
            <td style="padding: 8px 0; color: ${o.text};">${l(e.preferredContactMethod)}</td>
          </tr>
          ${r}
        </table>
        <div style="margin-top: 20px; border-top: 1px solid ${o.border}; padding-top: 20px;">
          <p style="font-weight: bold; color: ${o.textSecondary}; margin-bottom: 10px;">Message:</p>
          <div style="background: ${o.surfaceSubtle}; border-left: 4px solid ${o.primary}; padding: 16px; color: ${o.text}; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">
            ${l(e.message)}
          </div>
        </div>
        <p style="margin-top: 24px; font-size: 12px; color: ${o.textMuted}; border-top: 1px solid ${o.border}; padding-top: 16px;">
          Sent via Maxpromo Digital contact form \xb7 maxpromo.digital
        </p>
      </div>
    </div>
  `}function l(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}e.s(["token",0,o],39749),e.s(["buildContactEmailHtml",()=>s,"sendEmail",()=>i],58788)},45132,85057,72166,13571,e=>{"use strict";var t=e.i(39749);let n={legalName:"Marcel Tabit Akwe",brand:"MAXPROMO",brandFull:"MAXPROMO DIGITAL",website:"maxpromo.digital",addressLine1:"Körnerstr. 8",addressLine2:"45143 Essen",country:"Germany",email:"info@maxpromo.digital",phone:"+49 173 3645698",steuernummer:"111/5339/7597",finanzamt:"Essen-NordOst",vatClause:{de:"Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.",en:"No VAT is charged pursuant to § 19 UStG."}},r={ink:t.token.text,accent:t.token.primary,accentText:t.token.primaryText,accentSoft:t.token.primarySoft,onAccent:t.token.onPrimary,muted:t.token.textSecondary,faint:t.token.textMuted,border:t.token.border,borderStrong:t.token.borderStrong,surfaceSubtle:t.token.surfaceSubtle,white:t.token.surface},a={beneficiary:"Marcel Tabit Akwe",iban:"DE03 1001 0178 3648 4449 24",bic:"REVODEB2",bank:"Revolut Ltd"},o={EUR:"de-DE",GBP:"en-GB"};e.s(["BANK_TRANSFER",0,a,"BRAND_COLORS",0,r,"BUSINESS",0,n,"CURRENCY_LOCALE",0,o,"DEFAULT_CURRENCY",0,"EUR"],85057);let i={de:"de-DE",en:"en-GB"};function s(e,t){let n=t??"EUR";return new Intl.NumberFormat(o[n],{style:"currency",currency:n}).format(e)}function l(e,t,n){let r=n??"EUR",a=t>0?t:1,i=e/a,s=Math.abs(i*a-e)>.005||Math.abs(i-Math.round(100*i)/100)>1e-4?4:2;return new Intl.NumberFormat(o[r],{style:"currency",currency:r,minimumFractionDigits:2,maximumFractionDigits:s}).format(i)}function d(e,t){if(!e)return"—";let n=new Date(e.length>10?e:e+"T12:00:00");if(isNaN(n.getTime()))return"—";let r=i[t??"de"];return n.toLocaleDateString(r,{day:"2-digit",month:"en"===t?"short":"2-digit",year:"numeric"})}function c(e){let t=e.indexOf(" — ");return t<0?{name:e.trim(),company:""}:{name:e.slice(0,t).trim(),company:e.slice(t+3).trim()}}e.s(["fmtCurrency",()=>s,"fmtDocDate",()=>d,"fmtUnitPrice",()=>l,"splitClientName",()=>c],45132);let p={de:{invoiceTitle:"RECHNUNG",quoteTitle:"ANGEBOT",from:"Von",to:"An",invoiceDetailsHeading:"Rechnungsdetails",quoteDetailsHeading:"Angebotsdetails",invoiceNumber:"Rechnungsnummer",quoteNumber:"Angebotsnummer",invoiceDate:"Rechnungsdatum",quoteDate:"Angebotsdatum",dueDate:"Fällig bis",validUntil:"Gültig bis",currency:"Währung",servicesHeading:"Leistungen",colPos:"Pos",colDescription:"Beschreibung",colQuantity:"Menge",colUnitPrice:"Einzelpreis",colAmount:"Betrag",subtotal:"Zwischensumme",deposit:"Anzahlung",remainingBalance:"Restbetrag",totalDue:"Gesamtbetrag",quoteTotal:"Angebotssumme",paymentSectionTitle:"Zahlung",paymentDetailsHeading:"Zahlungsdetails",bankTransfer:"Banküberweisung",accountHolder:"Kontoinhaber",paymentReference:"Verwendungszweck",momoScanToPay:"Zum Bezahlen scannen",dearSirMadam:"Sehr geehrte Damen und Herren,",dear:e=>`Sehr geehrte/r ${e},`,quoteIntro:(e,t)=>`vielen Dank f\xfcr Ihre Anfrage. Anbei erhalten Sie mein Angebot Nr. ${e} vom ${t} mit folgenden Leistungen (Scope & Deliverables):`,includedFree:"Inklusive (kostenlos)",paymentTerms:"Zahlungsbedingungen",quoteValidUntilNote:e=>`Angebot g\xfcltig bis ${e}.`,closing:"Mit freundlichen Grüßen",quoteAcceptanceHeading:"Annahme des Angebots",quoteAcceptanceBody:"Mit Unterschrift bestätigen Sie die Annahme dieses Angebots zu den oben genannten Konditionen.",placeDate:"Ort, Datum",namePrinted:"Name (Druckschrift)",signature:"Unterschrift",depositThanks:(e,t)=>`Vielen Dank f\xfcr Ihre Anzahlung von ${e} am ${t}.`,taxNumberLabel:"Steuernummer",taxOfficeLabel:"Finanzamt",filenamePrefixInvoice:"Rechnung",filenamePrefixQuote:"Angebot",emailSubjectInvoice:e=>`Rechnung Nr. ${e} — Maxpromo Digital`,emailSubjectQuote:e=>`Angebot Nr. ${e} — Maxpromo Digital`},en:{invoiceTitle:"INVOICE",quoteTitle:"QUOTE",from:"From",to:"To",invoiceDetailsHeading:"Invoice Details",quoteDetailsHeading:"Quote Details",invoiceNumber:"Invoice Number",quoteNumber:"Quote Number",invoiceDate:"Invoice Date",quoteDate:"Quote Date",dueDate:"Due Date",validUntil:"Valid Until",currency:"Currency",servicesHeading:"Services",colPos:"Pos",colDescription:"Description",colQuantity:"Quantity",colUnitPrice:"Unit Price",colAmount:"Amount",subtotal:"Subtotal",deposit:"Deposit",remainingBalance:"Remaining Balance",totalDue:"Total Due",quoteTotal:"Quote Total",paymentSectionTitle:"Payment",paymentDetailsHeading:"Payment Details",bankTransfer:"Bank Transfer",accountHolder:"Account Holder",paymentReference:"Payment Reference",momoScanToPay:"Scan to pay",dearSirMadam:"Dear Sir or Madam,",dear:e=>`Dear ${e},`,quoteIntro:(e,t)=>`thank you for your enquiry. Please find enclosed my quote No. ${e} dated ${t} covering the following services (scope & deliverables):`,includedFree:"Included (free)",paymentTerms:"Payment Terms",quoteValidUntilNote:e=>`Quote valid until ${e}.`,closing:"Kind regards",quoteAcceptanceHeading:"Quote Acceptance",quoteAcceptanceBody:"By signing below you confirm acceptance of this quote under the terms stated above.",placeDate:"Place, Date",namePrinted:"Name (printed)",signature:"Signature",depositThanks:(e,t)=>`Thank you for your deposit of ${e} on ${t}.`,taxNumberLabel:"Tax No.",taxOfficeLabel:"Tax Office",filenamePrefixInvoice:"Invoice",filenamePrefixQuote:"Quote",emailSubjectInvoice:e=>`Invoice No. ${e} — Maxpromo Digital`,emailSubjectQuote:e=>`Quote No. ${e} — Maxpromo Digital`}};function m(e){return p[e??"de"]}e.s(["getLabels",()=>m],72166);let u=r.ink,x=r.accent;function g(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function f(e,t,n){let r=m(n);return t?r.dearSirMadam:r.dear(g(e.split(" ")[0]))}function y(e){let t=e.secondaryDateLabel?`<p style="font-family:monospace;font-size:11px;color:var(--brand-text-secondary);margin:0;">${g(e.secondaryDateLabel)}: ${g(e.secondaryDate??"—")}</p>`:"";return`
      <div style="background:${u};padding:28px 32px;border-bottom:4px solid ${x};">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <p style="font-family:monospace;font-size:14px;font-weight:700;color:var(--brand-surface);margin:0 0 6px;letter-spacing:0.05em;">${g(n.brandFull)}</p>
            <p style="font-family:monospace;font-size:11px;color:var(--brand-text-secondary);margin:0 0 2px;">${g(n.legalName)}</p>
            <p style="font-family:monospace;font-size:11px;color:var(--brand-text-secondary);margin:0 0 2px;">${g(n.addressLine1)}, ${g(n.addressLine2)}</p>
            <p style="font-family:monospace;font-size:11px;color:var(--brand-text-secondary);margin:0 0 2px;">${g(n.email)}</p>
            <p style="font-family:monospace;font-size:11px;color:var(--brand-text-secondary);margin:0;">${g(n.phone)}</p>
          </div>
          <div style="text-align:right;">
            <p style="font-family:monospace;font-size:18px;font-weight:700;color:var(--brand-text-inverted);margin:0 0 6px;letter-spacing:0.1em;">${g(e.docTypeLabel)}</p>
            <p style="font-family:monospace;font-size:12px;color:${x};margin:0 0 2px;">${g(e.numberLabel)}: ${g(e.number)}</p>
            <p style="font-family:monospace;font-size:11px;color:var(--brand-text-secondary);margin:0 0 2px;">${g(e.dateLabel)}: ${g(e.date)}</p>
            ${t}
          </div>
        </div>
      </div>`}function b(e){let t=m(e.language),n=[`<p style="color:var(--brand-text);font-size:15px;margin:0 0 2px;font-weight:600;">${g(e.nameOnly)}</p>`,e.company?`<p style="color:var(--brand-text-muted);font-size:13px;margin:0 0 2px;">${g(e.company)}</p>`:"",e.address?`<p style="color:var(--brand-text-muted);font-size:13px;margin:0;">${g(e.address)}</p>`:""].filter(Boolean).join("");return`
      <div style="padding:20px 32px;background:${r.surfaceSubtle};border-bottom:1px solid var(--brand-border);">
        <p style="color:var(--brand-text-secondary);font-size:10px;margin:0 0 8px;font-family:monospace;text-transform:uppercase;letter-spacing:0.12em;">${g(t.to)}</p>
        ${n}
      </div>`}function $(e){let t=m(e);return`
          <tr style="background:${r.surfaceSubtle};">
            <th style="padding:8px 10px;font-family:monospace;font-size:10px;color:var(--brand-text-secondary);text-transform:uppercase;letter-spacing:0.08em;text-align:left;">${g(t.colPos)}</th>
            <th style="padding:8px 10px;font-family:monospace;font-size:10px;color:var(--brand-text-secondary);text-transform:uppercase;letter-spacing:0.08em;text-align:left;">${g(t.colDescription)}</th>
            <th style="padding:8px 10px;font-family:monospace;font-size:10px;color:var(--brand-text-secondary);text-transform:uppercase;letter-spacing:0.08em;text-align:right;">${g(t.colQuantity)}</th>
            <th style="padding:8px 10px;font-family:monospace;font-size:10px;color:var(--brand-text-secondary);text-transform:uppercase;letter-spacing:0.08em;text-align:right;">${g(t.colUnitPrice)}</th>
            <th style="padding:8px 10px;font-family:monospace;font-size:10px;color:var(--brand-text-secondary);text-transform:uppercase;letter-spacing:0.08em;text-align:right;">${g(t.colAmount)}</th>
          </tr>`}function v(e,t){let n=m(t);return`
        <div style="background:${r.surfaceSubtle};border-left:3px solid ${x};padding:16px 20px;margin-bottom:28px;">
          <p style="font-family:monospace;font-size:10px;color:${x};text-transform:uppercase;letter-spacing:0.12em;margin:0 0 8px;">${g(n.bankTransfer)}</p>
          <p style="font-family:monospace;font-size:13px;color:var(--brand-surface-subtle);margin:0 0 3px;">${g(n.accountHolder)}: ${g(a.beneficiary)}</p>
          <p style="font-family:monospace;font-size:13px;color:var(--brand-surface-subtle);margin:0 0 3px;">IBAN: ${g(a.iban)}</p>
          <p style="font-family:monospace;font-size:13px;color:var(--brand-surface-subtle);margin:0 0 3px;">BIC: ${g(a.bic)}</p>
          <p style="font-family:monospace;font-size:13px;color:var(--brand-surface-subtle);margin:0;">${g(n.paymentReference)}: ${g(e)}</p>
        </div>`}function h(e){let t=m(e);return`
      <div style="background:${u};padding:20px 32px;">
        <p style="font-family:monospace;font-size:11px;color:var(--brand-text-muted);margin:0 0 4px;">
          ${g(t.taxNumberLabel)}: ${g(n.steuernummer)} &nbsp;\xb7&nbsp; ${g(t.taxOfficeLabel)}: ${g(n.finanzamt)}
        </p>
        <p style="font-family:monospace;font-size:10px;color:${r.muted};margin:0;">
          ${g(n.brandFull)} &nbsp;\xb7&nbsp; ${g(n.addressLine1)} &nbsp;\xb7&nbsp; ${g(n.addressLine2)} &nbsp;\xb7&nbsp; ${g(n.email)} &nbsp;\xb7&nbsp; ${g(n.phone)}
        </p>
      </div>`}function D(e,t){let r=n.vatClause[e??"de"],a=t?` ${g(t)}`:"";return`<p style="font-family:monospace;font-size:11px;color:var(--brand-text-secondary);margin:12px 0 20px;">${g(r)}${a}</p>`}e.s(["buildEmailAddressBlockHtml",()=>b,"buildEmailBankBlockHtml",()=>v,"buildEmailFooterHtml",()=>h,"buildEmailHeaderHtml",()=>y,"buildEmailTableHeaderHtml",()=>$,"buildEmailVatClauseHtml",()=>D,"emailSalutation",()=>f,"escHtml",()=>g],13571)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__6368970d._.js.map