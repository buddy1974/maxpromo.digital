module.exports=[18622,(e,t,n)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,n)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,n)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,n)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},70406,(e,t,n)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},93695,(e,t,n)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},57407,e=>{"use strict";var t=e.i(6699);function n(){if(!(process.env.NEON_DATABASE_URL??process.env.DATABASE_URL))throw Error("[db] DATABASE_URL is not configured");return(0,t.neon)(process.env.NEON_DATABASE_URL??process.env.DATABASE_URL)}e.s(["getDb",()=>n])},58788,39749,e=>{"use strict";let t="#111111",n="#FFFFFF",r="#F4F4F5",a="#F7FEE7",o={background:n,surface:n,surfaceSubtle:"#FAFAFA",surfaceSunken:r,surfaceAccent:a,surfaceInverted:t,border:"#E4E4E7",borderStrong:"#D4D4D8",text:t,textSecondary:"#52525B",textMuted:"#71717A",textInverted:r,primary:"#A3E635",primaryHover:"#84CC16",primaryDark:"#65A30D",primaryText:"#4D7C0F",primarySoft:a,onPrimary:t,success:"#047857",successSoft:"#ECFDF5",warning:"#B45309",warningSoft:"#FFFBEB",danger:"#B91C1C",dangerSoft:"#FEF2F2",info:"#1D4ED8",infoSoft:"#EFF6FF"};async function i(e){let t=process.env.RESEND_API_KEY;if(!t)return console.error("[email] delivery unavailable: RESEND_API_KEY is not configured"),{success:!1,error:"email_not_configured"};let n=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${t}`,"Content-Type":"application/json"},body:JSON.stringify({from:e.from,to:Array.isArray(e.to)?e.to:[e.to],subject:e.subject,html:e.html,reply_to:e.replyTo,...e.bcc?.length?{bcc:e.bcc}:{}})});return n.ok?{success:!0,id:(await n.json()).id}:(console.error("[email] Resend API error:",await n.text()),{success:!1,error:`Resend error ${n.status}`})}function s(e){let t=e.system?`<tr>
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
  `}function l(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}e.s(["token",0,o],39749),e.s(["buildContactEmailHtml",()=>s,"sendEmail",()=>i],58788)},45132,85057,72166,13571,e=>{"use strict";var t=e.i(39749);let n={legalName:"Marcel Tabit Akwe",brand:"MAXPROMO",brandFull:"MAXPROMO DIGITAL",website:"maxpromo.digital",addressLine1:"Körnerstr. 8",addressLine2:"45143 Essen",country:"Germany",email:"info@maxpromo.digital",phone:"+49 173 3645698",steuernummer:"111/5339/7597",finanzamt:"Essen-NordOst",vatClause:{de:"Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.",en:"No VAT is charged pursuant to § 19 UStG."}},r={ink:t.token.text,accent:t.token.primary,accentText:t.token.primaryText,accentSoft:t.token.primarySoft,onAccent:t.token.onPrimary,muted:t.token.textSecondary,faint:t.token.textMuted,border:t.token.border,borderStrong:t.token.borderStrong,surfaceSubtle:t.token.surfaceSubtle,white:t.token.surface},a={beneficiary:"Marcel Tabit Akwe",iban:"DE03 1001 0178 3648 4449 24",bic:"REVODEB2",bank:"Revolut Ltd"},o={EUR:"de-DE",GBP:"en-GB"};e.s(["BANK_TRANSFER",0,a,"BRAND_COLORS",0,r,"BUSINESS",0,n,"CURRENCY_LOCALE",0,o,"DEFAULT_CURRENCY",0,"EUR"],85057);let i={de:"de-DE",en:"en-GB"};function s(e,t){let n=t??"EUR";return new Intl.NumberFormat(o[n],{style:"currency",currency:n}).format(e)}function l(e,t,n){let r=n??"EUR",a=t>0?t:1,i=e/a,s=Math.abs(i*a-e)>.005||Math.abs(i-Math.round(100*i)/100)>1e-4?4:2;return new Intl.NumberFormat(o[r],{style:"currency",currency:r,minimumFractionDigits:2,maximumFractionDigits:s}).format(i)}function d(e,t){if(!e)return"—";let n=new Date(e.length>10?e:e+"T12:00:00");if(isNaN(n.getTime()))return"—";let r=i[t??"de"];return n.toLocaleDateString(r,{day:"2-digit",month:"en"===t?"short":"2-digit",year:"numeric"})}function p(e){let t=e.indexOf(" — ");return t<0?{name:e.trim(),company:""}:{name:e.slice(0,t).trim(),company:e.slice(t+3).trim()}}e.s(["fmtCurrency",()=>s,"fmtDocDate",()=>d,"fmtUnitPrice",()=>l,"splitClientName",()=>p],45132);let c={de:{invoiceTitle:"RECHNUNG",quoteTitle:"ANGEBOT",from:"Von",to:"An",invoiceDetailsHeading:"Rechnungsdetails",quoteDetailsHeading:"Angebotsdetails",invoiceNumber:"Rechnungsnummer",quoteNumber:"Angebotsnummer",invoiceDate:"Rechnungsdatum",quoteDate:"Angebotsdatum",dueDate:"Fällig bis",validUntil:"Gültig bis",currency:"Währung",servicesHeading:"Leistungen",colPos:"Pos",colDescription:"Beschreibung",colQuantity:"Menge",colUnitPrice:"Einzelpreis",colAmount:"Betrag",subtotal:"Zwischensumme",deposit:"Anzahlung",remainingBalance:"Restbetrag",totalDue:"Gesamtbetrag",quoteTotal:"Angebotssumme",paymentSectionTitle:"Zahlung",paymentDetailsHeading:"Zahlungsdetails",bankTransfer:"Banküberweisung",accountHolder:"Kontoinhaber",paymentReference:"Verwendungszweck",momoScanToPay:"Zum Bezahlen scannen",dearSirMadam:"Sehr geehrte Damen und Herren,",dear:e=>`Sehr geehrte/r ${e},`,quoteIntro:(e,t)=>`vielen Dank f\xfcr Ihre Anfrage. Anbei erhalten Sie mein Angebot Nr. ${e} vom ${t} mit folgenden Leistungen (Scope & Deliverables):`,includedFree:"Inklusive (kostenlos)",paymentTerms:"Zahlungsbedingungen",quoteValidUntilNote:e=>`Angebot g\xfcltig bis ${e}.`,closing:"Mit freundlichen Grüßen",quoteAcceptanceHeading:"Annahme des Angebots",quoteAcceptanceBody:"Mit Unterschrift bestätigen Sie die Annahme dieses Angebots zu den oben genannten Konditionen.",placeDate:"Ort, Datum",namePrinted:"Name (Druckschrift)",signature:"Unterschrift",depositThanks:(e,t)=>`Vielen Dank f\xfcr Ihre Anzahlung von ${e} am ${t}.`,taxNumberLabel:"Steuernummer",taxOfficeLabel:"Finanzamt",filenamePrefixInvoice:"Rechnung",filenamePrefixQuote:"Angebot",emailSubjectInvoice:e=>`Rechnung Nr. ${e} — Maxpromo Digital`,emailSubjectQuote:e=>`Angebot Nr. ${e} — Maxpromo Digital`},en:{invoiceTitle:"INVOICE",quoteTitle:"QUOTE",from:"From",to:"To",invoiceDetailsHeading:"Invoice Details",quoteDetailsHeading:"Quote Details",invoiceNumber:"Invoice Number",quoteNumber:"Quote Number",invoiceDate:"Invoice Date",quoteDate:"Quote Date",dueDate:"Due Date",validUntil:"Valid Until",currency:"Currency",servicesHeading:"Services",colPos:"Pos",colDescription:"Description",colQuantity:"Quantity",colUnitPrice:"Unit Price",colAmount:"Amount",subtotal:"Subtotal",deposit:"Deposit",remainingBalance:"Remaining Balance",totalDue:"Total Due",quoteTotal:"Quote Total",paymentSectionTitle:"Payment",paymentDetailsHeading:"Payment Details",bankTransfer:"Bank Transfer",accountHolder:"Account Holder",paymentReference:"Payment Reference",momoScanToPay:"Scan to pay",dearSirMadam:"Dear Sir or Madam,",dear:e=>`Dear ${e},`,quoteIntro:(e,t)=>`thank you for your enquiry. Please find enclosed my quote No. ${e} dated ${t} covering the following services (scope & deliverables):`,includedFree:"Included (free)",paymentTerms:"Payment Terms",quoteValidUntilNote:e=>`Quote valid until ${e}.`,closing:"Kind regards",quoteAcceptanceHeading:"Quote Acceptance",quoteAcceptanceBody:"By signing below you confirm acceptance of this quote under the terms stated above.",placeDate:"Place, Date",namePrinted:"Name (printed)",signature:"Signature",depositThanks:(e,t)=>`Thank you for your deposit of ${e} on ${t}.`,taxNumberLabel:"Tax No.",taxOfficeLabel:"Tax Office",filenamePrefixInvoice:"Invoice",filenamePrefixQuote:"Quote",emailSubjectInvoice:e=>`Invoice No. ${e} — Maxpromo Digital`,emailSubjectQuote:e=>`Quote No. ${e} — Maxpromo Digital`}};function u(e){return c[e??"de"]}e.s(["getLabels",()=>u],72166);let m=r.ink,g=r.accent;function x(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function f(e,t,n){let r=u(n);return t?r.dearSirMadam:r.dear(x(e.split(" ")[0]))}function b(e){let t=e.secondaryDateLabel?`<p style="font-family:monospace;font-size:11px;color:var(--brand-text-secondary);margin:0;">${x(e.secondaryDateLabel)}: ${x(e.secondaryDate??"—")}</p>`:"";return`
      <div style="background:${m};padding:28px 32px;border-bottom:4px solid ${g};">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <p style="font-family:monospace;font-size:14px;font-weight:700;color:var(--brand-surface);margin:0 0 6px;letter-spacing:0.05em;">${x(n.brandFull)}</p>
            <p style="font-family:monospace;font-size:11px;color:var(--brand-text-secondary);margin:0 0 2px;">${x(n.legalName)}</p>
            <p style="font-family:monospace;font-size:11px;color:var(--brand-text-secondary);margin:0 0 2px;">${x(n.addressLine1)}, ${x(n.addressLine2)}</p>
            <p style="font-family:monospace;font-size:11px;color:var(--brand-text-secondary);margin:0 0 2px;">${x(n.email)}</p>
            <p style="font-family:monospace;font-size:11px;color:var(--brand-text-secondary);margin:0;">${x(n.phone)}</p>
          </div>
          <div style="text-align:right;">
            <p style="font-family:monospace;font-size:18px;font-weight:700;color:var(--brand-text-inverted);margin:0 0 6px;letter-spacing:0.1em;">${x(e.docTypeLabel)}</p>
            <p style="font-family:monospace;font-size:12px;color:${g};margin:0 0 2px;">${x(e.numberLabel)}: ${x(e.number)}</p>
            <p style="font-family:monospace;font-size:11px;color:var(--brand-text-secondary);margin:0 0 2px;">${x(e.dateLabel)}: ${x(e.date)}</p>
            ${t}
          </div>
        </div>
      </div>`}function y(e){let t=u(e.language),n=[`<p style="color:var(--brand-text);font-size:15px;margin:0 0 2px;font-weight:600;">${x(e.nameOnly)}</p>`,e.company?`<p style="color:var(--brand-text-muted);font-size:13px;margin:0 0 2px;">${x(e.company)}</p>`:"",e.address?`<p style="color:var(--brand-text-muted);font-size:13px;margin:0;">${x(e.address)}</p>`:""].filter(Boolean).join("");return`
      <div style="padding:20px 32px;background:${r.surfaceSubtle};border-bottom:1px solid var(--brand-border);">
        <p style="color:var(--brand-text-secondary);font-size:10px;margin:0 0 8px;font-family:monospace;text-transform:uppercase;letter-spacing:0.12em;">${x(t.to)}</p>
        ${n}
      </div>`}function h(e){let t=u(e);return`
          <tr style="background:${r.surfaceSubtle};">
            <th style="padding:8px 10px;font-family:monospace;font-size:10px;color:var(--brand-text-secondary);text-transform:uppercase;letter-spacing:0.08em;text-align:left;">${x(t.colPos)}</th>
            <th style="padding:8px 10px;font-family:monospace;font-size:10px;color:var(--brand-text-secondary);text-transform:uppercase;letter-spacing:0.08em;text-align:left;">${x(t.colDescription)}</th>
            <th style="padding:8px 10px;font-family:monospace;font-size:10px;color:var(--brand-text-secondary);text-transform:uppercase;letter-spacing:0.08em;text-align:right;">${x(t.colQuantity)}</th>
            <th style="padding:8px 10px;font-family:monospace;font-size:10px;color:var(--brand-text-secondary);text-transform:uppercase;letter-spacing:0.08em;text-align:right;">${x(t.colUnitPrice)}</th>
            <th style="padding:8px 10px;font-family:monospace;font-size:10px;color:var(--brand-text-secondary);text-transform:uppercase;letter-spacing:0.08em;text-align:right;">${x(t.colAmount)}</th>
          </tr>`}function v(e,t){let n=u(t);return`
        <div style="background:${r.surfaceSubtle};border-left:3px solid ${g};padding:16px 20px;margin-bottom:28px;">
          <p style="font-family:monospace;font-size:10px;color:${g};text-transform:uppercase;letter-spacing:0.12em;margin:0 0 8px;">${x(n.bankTransfer)}</p>
          <p style="font-family:monospace;font-size:13px;color:var(--brand-surface-subtle);margin:0 0 3px;">${x(n.accountHolder)}: ${x(a.beneficiary)}</p>
          <p style="font-family:monospace;font-size:13px;color:var(--brand-surface-subtle);margin:0 0 3px;">IBAN: ${x(a.iban)}</p>
          <p style="font-family:monospace;font-size:13px;color:var(--brand-surface-subtle);margin:0 0 3px;">BIC: ${x(a.bic)}</p>
          <p style="font-family:monospace;font-size:13px;color:var(--brand-surface-subtle);margin:0;">${x(n.paymentReference)}: ${x(e)}</p>
        </div>`}function $(e){let t=u(e);return`
      <div style="background:${m};padding:20px 32px;">
        <p style="font-family:monospace;font-size:11px;color:var(--brand-text-muted);margin:0 0 4px;">
          ${x(t.taxNumberLabel)}: ${x(n.steuernummer)} &nbsp;\xb7&nbsp; ${x(t.taxOfficeLabel)}: ${x(n.finanzamt)}
        </p>
        <p style="font-family:monospace;font-size:10px;color:${r.muted};margin:0;">
          ${x(n.brandFull)} &nbsp;\xb7&nbsp; ${x(n.addressLine1)} &nbsp;\xb7&nbsp; ${x(n.addressLine2)} &nbsp;\xb7&nbsp; ${x(n.email)} &nbsp;\xb7&nbsp; ${x(n.phone)}
        </p>
      </div>`}function E(e,t){let r=n.vatClause[e??"de"],a=t?` ${x(t)}`:"";return`<p style="font-family:monospace;font-size:11px;color:var(--brand-text-secondary);margin:12px 0 20px;">${x(r)}${a}</p>`}e.s(["buildEmailAddressBlockHtml",()=>y,"buildEmailBankBlockHtml",()=>v,"buildEmailFooterHtml",()=>$,"buildEmailHeaderHtml",()=>b,"buildEmailTableHeaderHtml",()=>h,"buildEmailVatClauseHtml",()=>E,"emailSalutation",()=>f,"escHtml",()=>x],13571)},22451,e=>{"use strict";var t=e.i(22254),n=e.i(44),r=e.i(71405),a=e.i(49842),o=e.i(46656),i=e.i(20165),s=e.i(48640),l=e.i(86089),d=e.i(66079),p=e.i(86101),c=e.i(48050),u=e.i(84962),m=e.i(4088),g=e.i(99181),x=e.i(97605),f=e.i(93695);e.i(65405);var b=e.i(79953),y=e.i(39749),h=e.i(17484),v=e.i(58788),$=e.i(57407),E=e.i(45132),A=e.i(72166),R=e.i(13571);let S=process.env.RESEND_FROM_EMAIL??"MAXPROMO DIGITAL <info@maxpromo.digital>";async function D(e){if(!process.env.RESEND_API_KEY)return h.NextResponse.json({error:"Email not configured",detail:"RESEND_API_KEY environment variable is missing"},{status:503});if(!(process.env.NEON_DATABASE_URL??process.env.DATABASE_URL))return h.NextResponse.json({error:"Database not configured",detail:"NEON_DATABASE_URL is missing"},{status:503});try{let t=await e.json();if(!t.angebot_id)return h.NextResponse.json({error:"angebot_id required"},{status:400});let n=(0,$.getDb)(),r=await n`SELECT * FROM os_angebote WHERE id = ${t.angebot_id}`;if(0===r.length)return h.NextResponse.json({error:"Angebot not found"},{status:404});let a=r[0],o=t.clientEmails?.length?t.clientEmails:a.client_email?[a.client_email]:[];if(0===o.length)return h.NextResponse.json({error:"No client email on this Angebot"},{status:400});let i=function(e){let t=e.language??"de",n=(0,A.getLabels)(t),{name:r,company:a}=(0,E.splitClientName)(e.client_name),o=(0,R.emailSalutation)(r,a,t),i=e.currency??"EUR",s=e=>(0,E.fmtCurrency)(e,i),l=e=>(0,E.fmtDocDate)(e,t),d=Number(e.subtotal??e.total),p=Number(e.total),c=Number(e.anzahlung??0),u=c>0,m=(Array.isArray(e.line_items)?e.line_items:[]).map((e,t)=>{let n=e.isFixedPrice?1:Number(e.qty||1),r=Number(e.total)||0;return`
    <tr>
      <td style="padding:6px 10px;border-bottom:1px solid ${y.token.border};color:${y.token.primaryText};font-family:monospace;font-size:11px;font-weight:700;vertical-align:top;">${String(t+1).padStart(2,"0")}</td>
      <td style="padding:6px 10px;border-bottom:1px solid ${y.token.border};color:var(--brand-text);font-size:13px;line-height:1.5;white-space:pre-wrap;vertical-align:top;">${(0,R.escHtml)(e.description)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid ${y.token.border};color:var(--brand-text-muted);text-align:right;font-family:monospace;font-size:12px;vertical-align:top;">${n}</td>
      <td style="padding:6px 10px;border-bottom:1px solid ${y.token.border};color:var(--brand-text-muted);text-align:right;font-family:monospace;font-size:12px;vertical-align:top;">${(0,E.fmtUnitPrice)(r,n,i)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid ${y.token.border};color:var(--brand-text);text-align:right;font-family:monospace;font-size:13px;font-weight:700;vertical-align:top;">${s(r)}</td>
    </tr>`}).join(""),g=u?`
    <tr>
      <td colspan="4" style="padding:10px 10px 4px;font-family:monospace;font-size:12px;color:var(--brand-text-muted);text-align:right;">${(0,R.escHtml)(n.subtotal)}</td>
      <td style="padding:10px 10px 4px;font-family:monospace;font-size:12px;color:var(--brand-text-muted);text-align:right;">${s(d)}</td>
    </tr>
    <tr>
      <td colspan="4" style="padding:4px 10px 10px;font-family:monospace;font-size:12px;color:var(--brand-text-muted);text-align:right;">${(0,R.escHtml)(n.deposit)} (${(0,R.escHtml)(e.anzahlung_method??n.bankTransfer)})</td>
      <td style="padding:4px 10px 10px;font-family:monospace;font-size:12px;color:var(--brand-text-muted);text-align:right;">−${s(c)}</td>
    </tr>
    <tr style="background:${y.token.primary};">
      <td colspan="4" style="padding:12px 10px;font-family:monospace;font-size:12px;font-weight:700;color:var(--brand-surface-inverted);text-transform:uppercase;letter-spacing:0.06em;">${(0,R.escHtml)(n.remainingBalance)}</td>
      <td style="padding:12px 10px;font-family:monospace;font-size:16px;font-weight:700;color:var(--brand-surface-inverted);text-align:right;">${s(u?p-c:p)}</td>
    </tr>`:`
    <tr style="background:${y.token.primary};">
      <td colspan="4" style="padding:12px 10px;font-family:monospace;font-size:12px;font-weight:700;color:var(--brand-surface-inverted);text-transform:uppercase;letter-spacing:0.06em;">${(0,R.escHtml)(n.quoteTotal)}</td>
      <td style="padding:12px 10px;font-family:monospace;font-size:16px;font-weight:700;color:var(--brand-surface-inverted);text-align:right;">${s(p)}</td>
    </tr>`,x=e.payment_terms?`<p style="font-size:12px;color:var(--brand-text-secondary);margin:0 0 8px;"><strong>${(0,R.escHtml)(n.paymentTerms)}:</strong> ${(0,R.escHtml)(e.payment_terms)}</p>`:"",f="en"===t?`thank you for your enquiry. Please find enclosed my Quote No. <strong>${(0,R.escHtml)(e.angebot_number)}</strong> dated ${l(e.created_at)} covering the following services:`:`vielen Dank f\xfcr Ihre Anfrage. Anbei erhalten Sie mein Angebot Nr. <strong>${(0,R.escHtml)(e.angebot_number)}</strong> vom ${l(e.created_at)} mit folgenden Leistungen:`;return`
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:${y.token.surface};">

      ${(0,R.buildEmailHeaderHtml)({docTypeLabel:n.quoteTitle,numberLabel:n.quoteNumber,number:e.angebot_number,dateLabel:n.quoteDate,date:l(e.created_at),secondaryDateLabel:n.validUntil,secondaryDate:l(e.valid_until)})}

      ${(0,R.buildEmailAddressBlockHtml)({nameOnly:r,company:a,address:e.client_address,language:t})}

      <div style="padding:24px 32px;">
        <p style="color:var(--brand-text-secondary);font-size:13px;margin:0 0 16px;font-family:monospace;">${o}</p>
        <p style="color:var(--brand-text-secondary);font-size:14px;margin:0 0 20px;line-height:1.7;">
          ${f}
        </p>

        <table style="width:100%;border-collapse:collapse;border:1px solid var(--brand-border);margin-bottom:4px;">
          ${(0,R.buildEmailTableHeaderHtml)(t)}
          ${m}
          ${g}
        </table>

        ${x}

        ${(0,R.buildEmailVatClauseHtml)(t,n.quoteValidUntilNote(l(e.valid_until)))}

        <p style="color:var(--brand-text-secondary);font-size:13px;line-height:1.5;margin:0 0 16px;">
          ${(0,R.escHtml)(n.closing)}<br>
          <strong>Marcel Tabit Akwe</strong>
        </p>
      </div>

      ${(0,R.buildEmailFooterHtml)(t)}
    </div>`}(a),s=!1!==t.sendCopyToMarcel?["info@maxpromo.digital"]:[],l=(0,A.getLabels)(a.language??"de"),d=await (0,v.sendEmail)({to:o,from:S,replyTo:"info@maxpromo.digital",subject:l.emailSubjectQuote(a.angebot_number),html:i,bcc:s});if(!d.success)return h.NextResponse.json({error:"Email send failed",detail:d.error},{status:502});return await n`
      UPDATE os_angebote
      SET status = 'sent', sent_at = NOW()
      WHERE id = ${a.id}`,h.NextResponse.json({success:!0,id:d.id})}catch(t){let e=t instanceof Error?t.message:String(t);return console.error("[/api/os/send-angebot]",e),h.NextResponse.json({error:"Failed to send angebot",detail:e},{status:500})}}e.s(["POST",()=>D],10235);var w=e.i(10235);let N=new t.AppRouteRouteModule({definition:{kind:n.RouteKind.APP_ROUTE,page:"/api/os/send-angebot/route",pathname:"/api/os/send-angebot",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/projects/maxpromo.digital/apps/web/app/api/os/send-angebot/route.ts",nextConfigOutput:"",userland:w}),{workAsyncStorage:T,workUnitAsyncStorage:k,serverHooks:_}=N;function P(){return(0,r.patchFetch)({workAsyncStorage:T,workUnitAsyncStorage:k})}async function C(e,t,r){N.isDev&&(0,a.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let y="/api/os/send-angebot/route";y=y.replace(/\/index$/,"")||"/";let h=await N.prepare(e,t,{srcPage:y,multiZoneDraftMode:!1});if(!h)return t.statusCode=400,t.end("Bad Request"),null==r.waitUntil||r.waitUntil.call(r,Promise.resolve()),null;let{buildId:v,params:$,nextConfig:E,parsedUrl:A,isDraftMode:R,prerenderManifest:S,routerServerContext:D,isOnDemandRevalidate:w,revalidateOnlyGenerated:T,resolvedPathname:k,clientReferenceManifest:_,serverActionsManifest:P}=h,C=(0,s.normalizeAppPath)(y),H=!!(S.dynamicRoutes[C]||S.routes[k]),z=async()=>((null==D?void 0:D.render404)?await D.render404(e,t,A,!1):t.end("This page could not be found"),null);if(H&&!R){let e=!!S.routes[k],t=S.dynamicRoutes[C];if(t&&!1===t.fallback&&!e){if(E.experimental.adapterPath)return await z();throw new f.NoFallbackError}}let q=null;!H||N.isDev||R||(q="/index"===(q=k)?"/":q);let F=!0===N.isDev||!H,U=H&&!F;P&&_&&(0,i.setManifestsSingleton)({page:y,clientReferenceManifest:_,serverActionsManifest:P});let O=e.method||"GET",L=(0,o.getTracer)(),I=L.getActiveScopeSpan(),B={params:$,prerenderManifest:S,renderOpts:{experimental:{authInterrupts:!!E.experimental.authInterrupts},cacheComponents:!!E.cacheComponents,supportsDynamicResponse:F,incrementalCache:(0,a.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:E.cacheLife,waitUntil:r.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,n,r,a)=>N.onRequestError(e,t,r,a,D)},sharedContext:{buildId:v}},M=new l.NodeNextRequest(e),j=new l.NodeNextResponse(t),Q=d.NextRequestAdapter.fromNodeNextRequest(M,(0,d.signalFromNodeResponse)(t));try{let i=async e=>N.handle(Q,B).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let n=L.getRootSpanAttributes();if(!n)return;if(n.get("next.span_type")!==p.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${n.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let r=n.get("next.route");if(r){let t=`${O} ${r}`;e.setAttributes({"next.route":r,"http.route":r,"next.span_name":t}),e.updateName(t)}else e.updateName(`${O} ${y}`)}),s=!!(0,a.getRequestMeta)(e,"minimalMode"),l=async a=>{var o,l;let d=async({previousCacheEntry:n})=>{try{if(!s&&w&&T&&!n)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let o=await i(a);e.fetchMetrics=B.renderOpts.fetchMetrics;let l=B.renderOpts.pendingWaitUntil;l&&r.waitUntil&&(r.waitUntil(l),l=void 0);let d=B.renderOpts.collectedTags;if(!H)return await (0,u.sendResponse)(M,j,o,B.renderOpts.pendingWaitUntil),null;{let e=await o.blob(),t=(0,m.toNodeOutgoingHttpHeaders)(o.headers);d&&(t[x.NEXT_CACHE_TAGS_HEADER]=d),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let n=void 0!==B.renderOpts.collectedRevalidate&&!(B.renderOpts.collectedRevalidate>=x.INFINITE_CACHE)&&B.renderOpts.collectedRevalidate,r=void 0===B.renderOpts.collectedExpire||B.renderOpts.collectedExpire>=x.INFINITE_CACHE?void 0:B.renderOpts.collectedExpire;return{value:{kind:b.CachedRouteKind.APP_ROUTE,status:o.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:n,expire:r}}}}catch(t){throw(null==n?void 0:n.isStale)&&await N.onRequestError(e,t,{routerKind:"App Router",routePath:y,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:U,isOnDemandRevalidate:w})},!1,D),t}},p=await N.handleResponse({req:e,nextConfig:E,cacheKey:q,routeKind:n.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:S,isRoutePPREnabled:!1,isOnDemandRevalidate:w,revalidateOnlyGenerated:T,responseGenerator:d,waitUntil:r.waitUntil,isMinimalMode:s});if(!H)return null;if((null==p||null==(o=p.value)?void 0:o.kind)!==b.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==p||null==(l=p.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});s||t.setHeader("x-nextjs-cache",w?"REVALIDATED":p.isMiss?"MISS":p.isStale?"STALE":"HIT"),R&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let f=(0,m.fromNodeOutgoingHttpHeaders)(p.value.headers);return s&&H||f.delete(x.NEXT_CACHE_TAGS_HEADER),!p.cacheControl||t.getHeader("Cache-Control")||f.get("Cache-Control")||f.set("Cache-Control",(0,g.getCacheControlHeader)(p.cacheControl)),await (0,u.sendResponse)(M,j,new Response(p.value.body,{headers:f,status:p.value.status||200})),null};I?await l(I):await L.withPropagatedContext(e.headers,()=>L.trace(p.BaseServerSpan.handleRequest,{spanName:`${O} ${y}`,kind:o.SpanKind.SERVER,attributes:{"http.method":O,"http.target":e.url}},l))}catch(t){if(t instanceof f.NoFallbackError||await N.onRequestError(e,t,{routerKind:"App Router",routePath:C,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:U,isOnDemandRevalidate:w})},!1,D),H)throw t;return await (0,u.sendResponse)(M,j,new Response(null,{status:500})),null}}e.s(["handler",()=>C,"patchFetch",()=>P,"routeModule",()=>N,"serverHooks",()=>_,"workAsyncStorage",()=>T,"workUnitAsyncStorage",()=>k],22451)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__af27dba1._.js.map