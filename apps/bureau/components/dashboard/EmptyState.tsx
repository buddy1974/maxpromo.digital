import { Icon, type IconName } from "@maxpromo/ui";

/**
 * The state a table is in before anyone has done anything.
 *
 * An empty region that renders nothing reads as a bug. This says what would be
 * here, which reads as a system working correctly and waiting.
 *
 * `icon` replaced a free-text `glyph` prop that call sites filled with whatever
 * Unicode mark seemed apt — ten screens, eight different marks, two of which
 * meant something else in the sibling application's navigation.
 */
export function EmptyState({
  title,
  hint,
  icon = "empty",
}: {
  title: string;
  hint?: string;
  icon?: IconName;
}) {
  return (
    <div className="empty-state">
      <div className="flex justify-center text-ink-muted">
        <Icon name={icon} size="lg" />
      </div>
      <p className="empty-state-title mt-3 text-sm font-medium">{title}</p>
      {hint && <p className="empty-state-body mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
