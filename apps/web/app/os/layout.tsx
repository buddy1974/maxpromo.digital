export default function OsRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--brand-background)',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}
