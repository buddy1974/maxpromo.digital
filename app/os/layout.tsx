export default function OsRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0A0A0A',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}
