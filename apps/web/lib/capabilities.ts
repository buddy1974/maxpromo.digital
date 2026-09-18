import type { IconName } from '@maxpromo/ui'

/**
 * lib/capabilities.ts
 *
 * The five concrete things a visitor arrives looking for.
 *
 * WHY THIS EXISTS BESIDE THE SOLUTION FAMILIES
 * `lib/solutions.ts` holds the operating view: how the work is grouped once
 * somebody understands what Maxpromo is. That view is correct and stays. It is
 * also useless to a person searching for a web developer, because nobody
 * searches for "business operating systems".
 *
 * So there are two levels, and one serves the other. These five are what the
 * work is called when a business asks for it. The operating families explain
 * how they fit together once the visitor is interested. Two taxonomies only
 * become a problem when they compete; here the concrete one is the door and
 * the abstract one is the room behind it.
 *
 * One source of truth: the home page rail, the home page hub diagram, the
 * Solutions sections and the contact context all read from here. The scenes
 * and their labels are checked against each other in both locales by
 * packages/tooling/check-capabilities.mjs.
 */

export interface Capability {
  /** Stable id. Used as the contact page's `?capability=` context. */
  readonly id: string
  readonly icon: IconName
  /** Message key under the `capabilities` namespace. */
  readonly key: string
  /**
   * One icon per step of this capability's mini-scene, in order. The labels
   * are the `<key>Scene` array in the message catalogue; the two must be the
   * same length, which `npm run check:capabilities` asserts in both locales
   * rather than leaving a scene to render short in German only.
   */
  readonly scene: readonly IconName[]
  /** Index into `scene` of the step a person performs. Omitted where none is. */
  readonly humanAt?: number
}

export const CAPABILITIES: readonly Capability[] = [
  {
    id: 'workflow-automation', icon: 'agents', key: 'c1',
    /* Request · Capture · Route · Approve · Record */
    scene: ['inbox', 'documents', 'agents', 'approvals', 'system'], humanAt: 3,
  },
  {
    id: 'custom-applications', icon: 'dashboard', key: 'c2',
    /* Your process · Application · People and record. No human step: this
       scene is an architecture, not a route, and marking one node as the
       decision would say something about the product that is not true. */
    scene: ['operatingModel', 'dashboard', 'clients'],
  },
  {
    /* 'leads', not 'external': the external glyph is this site's "opens in a
       new tab" mark (app/os layout), and a capability is not a link off the
       site. The funnel is what a business website is for here — a visitor
       arriving and becoming an enquiry, which is this capability's scene. */
    id: 'web-development', icon: 'leads', key: 'c3',
    /* Visitor · Website · Enquiry · Workflow · Follow-up */
    scene: ['user', 'leads', 'inbox', 'agents', 'send'],
  },
  {
    id: 'content-operations', icon: 'newsletter', key: 'c4',
    /* Idea · Prepare · Approve · Publish */
    scene: ['research', 'briefing', 'approvals', 'newsletter'], humanAt: 2,
  },
  {
    id: 'product-operations', icon: 'system', key: 'c5',
    /* Data · Content · Assets · Product record · Channels. The last is the
       three-column glyph rather than the external-link one: these channels are
       fed from the record, not linked to. */
    scene: ['memory', 'documents', 'playbooks', 'system', 'projects'],
  },
]

export function getCapability(id: string): Capability | undefined {
  return CAPABILITIES.find((c) => c.id === id)
}

/**
 * Tools Maxpromo actually works with.
 *
 * Set in type, with a mark from this platform's own icon set — never the
 * vendor's logo. A wall of trademarks implies partnership or certification,
 * and this company has neither with any of them. Naming a tool you integrate
 * is a statement of fact; reproducing its mark is a statement about a
 * relationship. The copy beside the rail says so in words as well.
 *
 * The icon says what kind of thing the tool is — mail, calendar, message,
 * workflow, payment, table — so the row reads at a glance while it moves,
 * without anyone mistaking it for a partner directory.
 */
export interface Integration {
  readonly name: string
  readonly icon: IconName
  /**
   * Set only where `name` is not a product name.
   *
   * Every other entry in this rail is a mark — Gmail, Slack, n8n — and a mark
   * is the same word in every language. "Web forms" is not a mark; it is an
   * English noun phrase that sat untranslated in the German rail between
   * eleven proper nouns, where it read as one more product nobody had heard
   * of. Translated through the catalogue when this key is present.
   */
  readonly nameKey?: string
}

export const INTEGRATIONS: readonly Integration[] = [
  { name: 'Web forms',       icon: 'documents', nameKey: 'webForms' },
  { name: 'Gmail',           icon: 'newsletter' },
  { name: 'Google Calendar', icon: 'calendar' },
  { name: 'Outlook',         icon: 'newsletter' },
  { name: 'WhatsApp',        icon: 'message' },
  { name: 'Telegram',        icon: 'send' },
  { name: 'Slack',           icon: 'message' },
  { name: 'n8n',             icon: 'agents' },
  { name: 'HubSpot',         icon: 'clients' },
  { name: 'Stripe',          icon: 'invoice' },
  { name: 'Notion',          icon: 'playbooks' },
  { name: 'Google Sheets',   icon: 'projects' },
]
