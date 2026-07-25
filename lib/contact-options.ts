export const CONTACT_PAIN_POINTS = [
  'too-many-emails',
  'too-many-whatsapp-messages',
  'lost-customer-enquiries',
  'slow-response-times',
  'manual-data-entry',
  'excel-chaos',
  'repetitive-tasks',
  'disconnected-systems',
  'slow-reporting',
  'ai-agents',
  'workflow-automation',
  'website',
  'social-media',
  'google-reviews',
  'other',
] as const

export type ContactPainPoint = (typeof CONTACT_PAIN_POINTS)[number]

export const PREFERRED_CONTACT_METHODS = ['email', 'phone', 'whatsapp'] as const

export type PreferredContactMethod = (typeof PREFERRED_CONTACT_METHODS)[number]
