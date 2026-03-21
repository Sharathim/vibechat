interface VibeEndPopupProps {
  partnerName: string
  onClose: () => void
  onContinueAlone: () => void
}

export default function VibeEndPopup({
  partnerName,
  onClose,
  onContinueAlone,
}: VibeEndPopupProps) {
  return (
    <>
      <div style={{
        position: 'fixed', inset: 0,
        background: 'var(--overlay)',
        backdropFilter: 'blur(4px)',
        zIndex: 200,
      }} />
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-color)',
        borderRadius: 24, padding: '32px 24px',
        width: 'min(320px, 90vw)',
        zIndex: 201,
        textAlign: 'center',
        animation: 'scaleIn 0.25s ease',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🎵</div>
        <h3 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 18, fontWeight: 700,
          color: 'var(--text-primary)', marginBottom: 8,
        }}>
          {partnerName} stopped vibing
        </h3>
        <p style={{
          fontSize: 14, color: 'var(--text-secondary)',
          marginBottom: 24,
        }}>
          What would you like to do?
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ flex: 1, height: 44, fontSize: 14 }}
          >
            Close Vibe
          </button>
          <button
            onClick={onContinueAlone}
            className="btn btn-primary"
            style={{ flex: 1, height: 44, fontSize: 14 }}
          >
            Continue Alone
          </button>
        </div>
      </div>
    </>
  )
}