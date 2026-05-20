/**
 * components/systems/SystemCard/SystemCardAdmin.tsx
 *
 * Admin card variant — /os/systems registry table row.
 * Surfaces all internal fields including status, maturity, priority_score,
 * featured flag, and action buttons for managing each product.
 *
 * This variant is NEVER rendered on public pages.
 * It is only used inside the protected /os/ routes.
 *
 * Consumer:
 *   app/os/systems/page.tsx — registry management table
 *   Rendered by SystemCard with variant='admin'
 *
 * TODO: connect /os/systems page consumer
 * TODO: add inline status dropdown (live | demo-ready | beta | internal)
 * TODO: add featured toggle (write to Supabase products table)
 * TODO: add health indicator from system_health table
 */

import type { ProductEntry } from '@/lib/registry/types'
import type { SystemCardProps } from './SystemCard'

// =============================================================================
// PROPS
// =============================================================================

/** Admin variant props — locale optional, no showBadge/showDomain/showCTA needed. */
export interface SystemCardAdminProps
  extends Pick<SystemCardProps, 'product' | 'locale'> {}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * SystemCardAdmin — /os/systems registry row.
 *
 * Renders all internal product fields as a management row.
 * Includes action buttons: open system, open landing, open domain, book demo.
 *
 * @example
 * <SystemCard product={p} variant="admin" />
 */
export function SystemCardAdmin({ product, locale = 'de' }: SystemCardAdminProps) {

  return (
    <div
      data-slug={product.slug}
      data-variant="admin"
      data-track={product.track}
      data-visibility={product.visibility}
      role="row"
      style={{ display: 'flex', alignItems: 'center' }}
    >
      {/* ── Product identity */}
      <div data-field="identity">
        <span data-field="name">{product.name}</span>
        <span data-field="domain">{product.domain}</span>
        <span data-field="category">{product.category}</span>
      </div>

      {/* ── Classification — internal fields */}
      <div data-field="classification">
        {/* Status — TODO: replace with inline dropdown (live | demo-ready | beta | internal) */}
        <span data-field="status">{product.status}</span>

        {/* Maturity — TODO: replace with inline dropdown */}
        <span data-field="maturity">{product.maturity}</span>

        {/* Priority score — TODO: replace with editable number input */}
        <span data-field="priority-score">
          {product.priority_score !== null ? product.priority_score : '—'}
        </span>

        {/* Featured — TODO: replace with toggle switch (writes to Supabase) */}
        <span data-field="featured">{product.featured ? 'yes' : 'no'}</span>

        {/* Track */}
        <span data-field="track">{product.track}</span>
      </div>

      {/* ── Links */}
      <div data-field="links">
        {/* Demo URL — TODO: add health indicator dot from system_health table */}
        <span data-field="demo-url">
          {product.demoUrl ?? '—'}
        </span>
      </div>

      {/* ── Action buttons */}
      <div data-field="actions" role="group" aria-label={`Actions for ${product.name}`}>
        {/* Open system (demo URL) */}
        {product.demoUrl && (
          <a
            href={product.demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-action="open-system"
          >
            {/* TODO: style as small action button */}
            Open system →
          </a>
        )}

        {/* Open landing page (internal) */}
        <a
          href={product.landingUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-action="open-landing"
        >
          Open landing →
        </a>

        {/* Open branded domain */}
        <a
          href={product.systemUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-action="open-domain"
        >
          Open domain →
        </a>

        {/* Book demo — links to contact with pre-filled system slug */}
        {product.track !== 'internal' && (
          <a
            href={product.bookDemoUrl}
            data-action="book-demo"
          >
            Book demo →
          </a>
        )}
      </div>
    </div>
  )
}
