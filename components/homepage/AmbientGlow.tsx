// Server component, purely decorative divs, no client boundary needed

export function AmbientGlow() {
  return (
    <>
      {/* Warm orange glow, sits behind the headline area (left, center-height) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '30%',
          left: '-5%',
          width: '520px',
          height: '520px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
      {/* Cooler white-tinted glow, lower right, creates depth */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '5%',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
    </>
  )
}
