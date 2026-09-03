/**
 * @maxpromo/ui
 *
 * Components and style maps shared by every Maxpromo application.
 *
 * The rule is simple: if two applications need the same thing, it lives here
 * and neither keeps a copy. Consolidation ran both ways — Agent Bureau
 * contributed the severity map and the dashboard shell; the web application
 * contributed the section header. Each had solved something the other had not.
 *
 * Everything here depends on @maxpromo/design-tokens and nothing else. A
 * shared component that reaches into an application's own modules is not
 * shared, it is borrowed.
 */

export { TONE_TEXT, TONE_BADGE, toneMap } from './status/tone'
export type { Tone } from './status/tone'

export { SectionHeader } from './primitives/SectionHeader'
