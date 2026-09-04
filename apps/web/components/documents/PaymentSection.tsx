/**
 * components/documents/PaymentSection.tsx
 *
 * Renders the configured payment method(s) for a document — Bank
 * Transfer, MTN MoMo, or both — sourced entirely from
 * lib/documents/config.ts. Nothing here is hardcoded per-document;
 * only the section's framing text differs between an Invoice ("pay
 * this account") and an Angebot ("this is how you'll pay once you
 * accept" — no "due" wording on a quotation, per spec).
 */

import { BANK_TRANSFER, BRAND_COLORS, BUSINESS, MTN_MOMO, type DocumentLanguage, type PaymentMethodId } from '@/lib/documents/config'
import { getLabels } from '@/lib/documents/labels'
import { MomoQrCode } from './MomoQrCode'

const mono = { fontFamily: 'monospace' } as const
const subLabel = { ...mono, fontSize: 'var(--text-label-dense)', fontWeight: 700, color: BRAND_COLORS.accentText, textTransform: 'uppercase' as const, letterSpacing: '0.1em', margin: '0 0 10px' }

interface PaymentSectionProps {
  method: PaymentMethodId
  /** 'invoice' shows the bank heading as the payable account; 'angebot' frames it as informational. */
  variant: 'invoice' | 'angebot'
  /** Document language — independent of the OS interface language. */
  language?: DocumentLanguage | null
  /** Invoice/Angebot number, shown as the payment reference (Verwendungszweck). */
  reference: string
}

export function PaymentSection({ method, language, reference }: PaymentSectionProps) {
  const t = getLabels(language)
  const showBank = method === 'bank' || method === 'both'
  const showMomo = method === 'momo' || method === 'both'

  const bankHeading = t.bankTransfer
  const momoHeading = 'MTN Mobile Money'

  return (
    <div>
      {/* Dark caption bar — mirrors the Midas reference's "PAYMENT DETAILS" header */}
      <div style={{ background: BRAND_COLORS.ink, padding: '9px 16px', marginBottom: '18px' }}>
        <span style={{ fontFamily: 'Arial,sans-serif', fontSize: 'var(--text-label)', fontWeight: 700, color: 'var(--brand-text-inverted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {t.paymentDetailsHeading}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '28px' }}>
        {showBank && (
          <div style={{ flex: '1 1 260px', minWidth: '220px' }}>
            <p style={subLabel}>{bankHeading}</p>
            <p style={{ ...mono, fontSize: 'var(--text-micro)', color: 'var(--brand-text)', margin: '0 0 3px' }}>{t.accountHolder}: {BANK_TRANSFER.beneficiary}</p>
            <p style={{ ...mono, fontSize: 'var(--text-micro)', color: 'var(--brand-text)', margin: '0 0 3px' }}>IBAN: {BANK_TRANSFER.iban}</p>
            <p style={{ ...mono, fontSize: 'var(--text-micro)', color: 'var(--brand-text)', margin: '0 0 3px' }}>BIC: {BANK_TRANSFER.bic}</p>
            <p style={{ ...mono, fontSize: 'var(--text-micro)', color: 'var(--brand-text)', margin: '0 0 3px' }}>{t.paymentReference}: {reference}</p>
            <p style={{ ...mono, fontSize: '12px', color: 'var(--brand-text-secondary)', margin: 0 }}>{BANK_TRANSFER.bank}</p>
          </div>
        )}

        {showMomo && (
          <div style={{ flex: '1 1 220px', minWidth: '200px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <MomoQrCode value={MTN_MOMO.url} size={92} />
            <div>
              <p style={subLabel}>{momoHeading}</p>
              <p style={{ ...mono, fontSize: 'var(--text-micro)', color: 'var(--brand-text)', margin: '0 0 3px' }}>{BUSINESS.legalName}</p>
              <p style={{ ...mono, fontSize: 'var(--text-micro)', color: 'var(--brand-text)', margin: '0 0 3px' }}>{MTN_MOMO.number}</p>
              <p style={{ ...mono, fontSize: 'var(--text-label-dense)', color: 'var(--brand-text-secondary)', margin: 0 }}>
                {t.momoScanToPay}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
