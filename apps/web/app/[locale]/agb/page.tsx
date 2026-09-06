import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AGB / Terms & Conditions',
  description: 'Allgemeine Geschäftsbedingungen der Maxpromo Digital, General Terms and Conditions',
  robots: { index: true, follow: false },
}

function Paragraph({ de, en }: { de: string; en?: string }) {
  return (
    <p style={{ marginBottom: en ? '0.5rem' : 0 }}>
      {de}
      {en && (
        <>
          <br />
          <span style={{ color: 'var(--brand-text-secondary)', fontSize: '14px' }}>{en}</span>
        </>
      )}
    </p>
  )
}

function Section({ para, label, children }: { para: string; label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--brand-surface-subtle)',
        borderLeft: '3px solid var(--brand-primary-edge)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.75rem 2.25rem',
        marginBottom: 'var(--space-5)',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--brand-font-sans)',
          fontSize: '12px',
          color: 'var(--brand-text-secondary)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: 'var(--space-1)',
        }}
      >
        {para}
      </p>
      <p
        style={{
          fontFamily: 'var(--brand-font-body)',
          fontSize: 'var(--text-body)',
          fontWeight: 600,
          color: 'var(--brand-text)',
          marginBottom: 'var(--space-3)',
        }}
      >
        {label}
      </p>
      <div
        style={{
          color: 'var(--brand-text)',
          lineHeight: '1.8',
          fontFamily: 'var(--brand-font-body)',
          fontSize: '16px',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default function AgbPage() {
  return (
    <main style={{ background: 'var(--brand-background)', minHeight: '100vh', paddingTop: 'var(--space-20)', paddingBottom: 'var(--space-20)' }}>
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '0 var(--space-5)' }}>

        <p
          style={{
            fontFamily: 'var(--brand-font-sans)',
            fontSize: 'var(--text-micro)',
            color: 'var(--brand-text-secondary)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginBottom: 'var(--space-3)',
          }}
        >
          Rechtliches / Legal
        </p>
        <h1 style={{ marginBottom: 'var(--space-2)' }}>
          Allgemeine Geschäftsbedingungen
          <span style={{ display: 'block', fontSize: '0.55em', color: 'var(--brand-text-secondary)', fontWeight: 400, marginTop: 'var(--space-1)' }}>
            General Terms &amp; Conditions
          </span>
        </h1>
        <p
          style={{
            fontFamily: 'var(--brand-font-body)',
            fontSize: '16px',
            color: 'var(--brand-text-secondary)',
            marginBottom: 'var(--space-8)',
          }}
        >
          Maxpromo Digital · Marcel Tabit Akwe · Stand: April 2026
        </p>

        <Section para="§1" label="Geltungsbereich / Scope">
          <Paragraph
            de="Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge zwischen Marcel Tabit Akwe (Maxpromo Digital) und Auftraggebern über IT-Dienstleistungen, Softwareentwicklung, KI-Automation und digitale Beratung."
            en="These General Terms and Conditions apply to all contracts between Marcel Tabit Akwe (Maxpromo Digital) and clients for IT services, software development, AI automation, and digital consulting."
          />
          <Paragraph
            de="Abweichende AGB des Auftraggebers werden nicht anerkannt, es sei denn, dies wurde ausdrücklich schriftlich vereinbart."
            en="Client's own terms and conditions are not accepted unless expressly agreed in writing."
          />
        </Section>

        <Section para="§2" label="Vertragsschluss / Contract Formation">
          <Paragraph
            de="Angebote sind freibleibend und unverbindlich. Ein Vertrag kommt erst durch schriftliche Auftragsbestätigung oder Projektvertrag zustande."
            en="Quotes are non-binding. A contract is formed only upon written order confirmation or project agreement."
          />
          <Paragraph
            de="Aufträge mit einem Auftragswert über €500 bedürfen der Schriftform (E-Mail genügt)."
            en="Orders with a value exceeding €500 require written form (email is sufficient)."
          />
        </Section>

        <Section para="§3" label="Leistungsumfang / Scope of Services">
          <Paragraph
            de="Der Leistungsumfang ergibt sich aus der jeweiligen Leistungsbeschreibung oder dem Projektvertrag. Mündliche Nebenabreden bedürfen der schriftlichen Bestätigung."
            en="The scope of services is defined by the service description or project agreement. Verbal side agreements require written confirmation."
          />
          <Paragraph
            de="Änderungs- oder Erweiterungswünsche (Change Requests) bedürfen einer schriftlichen Vereinbarung und können zu Anpassungen von Preis und Liefertermin führen."
            en="Change requests require a written agreement and may result in adjustments to price and delivery schedule."
          />
        </Section>

        <Section para="§4" label="Mitwirkungspflichten / Client Obligations">
          <Paragraph
            de="Der Auftraggeber stellt alle erforderlichen Zugänge, Daten, Inhalte und Informationen rechtzeitig und vollständig zur Verfügung."
            en="The client shall provide all required access credentials, data, content, and information in a timely and complete manner."
          />
          <Paragraph
            de="Verzögerungen, die durch die mangelnde Mitwirkung des Auftraggebers entstehen, verschieben vereinbarte Liefertermine entsprechend. Mehraufwand wird nach Aufwand berechnet."
            en="Delays caused by the client's failure to cooperate will shift agreed delivery dates accordingly. Additional effort will be billed at the applicable hourly rate."
          />
        </Section>

        <Section para="§5" label="Vergütung / Fees">
          <Paragraph
            de="Die Vergütung ergibt sich aus dem jeweiligen Angebot. Zahlungsbedingungen: 50 % bei Auftragserteilung, 50 % bei Abnahme der Leistung."
            en="Fees are as stated in the respective quote. Payment terms: 50% upon order, 50% upon acceptance."
          />
          <Paragraph
            de="Gemäß § 19 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmerregelung)."
            en="VAT exempt per §19 UStG (Kleinunternehmerregelung, small business regulation)."
          />
          <Paragraph
            de="Reise- und Nebenkosten werden nach Aufwand berechnet, sofern nicht anders vereinbart."
            en="Travel and incidental costs are charged at cost unless otherwise agreed."
          />
        </Section>

        <Section para="§6" label="Zahlungsverzug / Late Payment">
          <Paragraph
            de="Rechnungen sind innerhalb von 14 Tagen nach Rechnungsdatum ohne Abzug zahlbar. Bei Zahlungsverzug werden Verzugszinsen in Höhe von 9 Prozentpunkten über dem jeweiligen Basiszinssatz gemäß § 288 BGB berechnet."
            en="Invoices are payable within 14 days of invoice date without deduction. Late payment interest of 9 percentage points above the base rate applies per §288 BGB."
          />
        </Section>

        <Section para="§7" label="Abnahme / Acceptance">
          <Paragraph
            de="Der Auftraggeber ist verpflichtet, die erbrachte Leistung innerhalb von 14 Tagen nach Fertigstellungsmitteilung abzunehmen. Werden innerhalb dieser Frist keine Mängel schriftlich gerügt, gilt die Leistung als abgenommen."
            en="The client must accept the delivered work within 14 days of the completion notice. If no defects are reported in writing within this period, the work is deemed accepted."
          />
        </Section>

        <Section para="§8" label="Gewährleistung / Warranty">
          <Paragraph
            de="Die Gewährleistungsfrist beträgt 12 Monate ab Abnahme. Nacherfüllung (Nachbesserung oder Neulieferung) hat Vorrang vor Minderung oder Rücktritt. Auftragnehmer hat das Recht zu zwei Nachbesserungsversuchen."
            en="The warranty period is 12 months from acceptance. The right to remedy (repair or replacement) takes precedence over price reduction or withdrawal. We are entitled to two attempts at remedy."
          />
        </Section>

        <Section para="§9" label="Haftung / Liability">
          <Paragraph
            de="Die Haftung ist auf Vorsatz und grobe Fahrlässigkeit beschränkt. Die Haftung für mittelbare Schäden, Folgeschäden und entgangenen Gewinn ist ausgeschlossen."
            en="Liability is limited to intent and gross negligence. Liability for indirect damages, consequential damages, and lost profits is excluded."
          />
          <Paragraph
            de="Die Haftungsbeschränkung gilt nicht für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit."
            en="This limitation does not apply to damages resulting from injury to life, body, or health."
          />
        </Section>

        <Section para="§10" label="Urheberrecht / Copyright">
          <Paragraph
            de="Alle im Rahmen des Auftrags erstellten Werke (Code, Designs, Konzepte) bleiben bis zur vollständigen Begleichung der Vergütung Eigentum von Marcel Tabit Akwe."
            en="All works created under the contract (code, designs, concepts) remain the property of Marcel Tabit Akwe until full payment is received."
          />
          <Paragraph
            de="Nach vollständiger Bezahlung erhält der Auftraggeber ein einfaches, nicht übertragbares Nutzungsrecht für den vereinbarten Verwendungszweck."
            en="Upon full payment, the client receives a simple, non-transferable licence for the agreed purpose of use."
          />
        </Section>

        <Section para="§11" label="Vertraulichkeit / Confidentiality">
          <Paragraph
            de="Beide Parteien verpflichten sich, vertrauliche Informationen der jeweils anderen Partei nicht an Dritte weiterzugeben und nur für die Zwecke des jeweiligen Auftrags zu nutzen. Diese Verpflichtung gilt auch nach Beendigung des Vertrags für einen Zeitraum von 3 Jahren."
            en="Both parties undertake to keep confidential information of the other party confidential and to use it only for the purposes of the respective order. This obligation continues for 3 years after contract termination."
          />
        </Section>

        <Section para="§12" label="Datenschutz / Data Protection">
          <Paragraph
            de="Die Verarbeitung personenbezogener Daten erfolgt ausschließlich gemäß unserer Datenschutzerklärung und den Bestimmungen der DSGVO."
            en="Personal data is processed exclusively in accordance with our Privacy Policy and the provisions of the GDPR."
          />
        </Section>

        <Section para="§13" label="Schlussbestimmungen / Final Provisions">
          <Paragraph
            de="Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts."
            en="German law applies, excluding the UN Convention on Contracts for the International Sale of Goods (CISG)."
          />
          <Paragraph
            de="Ausschließlicher Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang mit diesem Vertrag ist Essen, soweit der Auftraggeber Kaufmann ist."
            en="Exclusive place of jurisdiction for all disputes arising from or in connection with this contract is Essen, provided the client is a merchant (Kaufmann)."
          />
          <Paragraph
            de="Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt."
            en="Should individual provisions of these terms be or become invalid, the validity of the remaining provisions remains unaffected."
          />
        </Section>

        <p
          style={{
            fontFamily: 'var(--brand-font-mono)',
            fontSize: 'var(--text-label)',
            color: 'var(--brand-text-secondary)',
            marginTop: 'var(--space-8)',
            textAlign: 'center',
          }}
        >
          Stand / Last updated: April 2026 · Maxpromo Digital · Marcel Tabit Akwe · Essen
        </p>
      </div>
    </main>
  )
}
