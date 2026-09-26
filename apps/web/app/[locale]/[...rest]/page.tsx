import { notFound } from 'next/navigation'

/**
 * The localised catch-all. Renders 404.
 *
 * Deliberately has no `generateMetadata`. An earlier attempt added one and it
 * did nothing: `notFound()` throws, Next renders `not-found.tsx` instead, and
 * metadata exported here never applies to that render. The title is set in
 * `not-found.tsx`, which is the component the visitor actually receives.
 */
export default function LocalizedCatchAllPage(): never {
  notFound()
}
