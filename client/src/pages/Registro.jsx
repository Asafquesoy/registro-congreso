import { useState, useRef, useEffect } from 'react'
import './Registro.css'

function DecoLine() {
  return (
    <div className="deco-line">
      <span /><svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/></svg><span />
    </div>
  )
}

function Confetti() {
  const colors = ['#c9962b', '#e8b84b', '#4a9966', '#5cb87a', '#b85c38', '#f0cc6e']
  return (
    <div className="confetti-container" aria-hidden="true">
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            '--x': `${Math.random() * 100}%`,
            '--delay': `${Math.random() * 0.6}s`,
            '--duration': `${1.2 + Math.random() * 1.5}s`,
            '--rotation': `${Math.random() * 720 - 360}deg`,
            '--color': colors[i % colors.length],
            '--size': `${6 + Math.random() * 6}px`,
          }}
        />
      ))}
    </div>
  )
}

export default function Registro() {
  const [pantalla, setPantalla] = useState('bienvenida')
  const [transitioning, setTransitioning] = useState(false)
  const [slideDir, setSlideDir] = useState('') // 'left' or 'right'
  const [form, setForm] = useState({
    nombre: '', apellidos: '', iglesia: '', ciudad: '', telefono: ''
  })
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [confirmacion, setConfirmacion] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [registroAbierto, setRegistroAbierto] = useState(true)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const containerRef = useRef(null)

  useEffect(() => {
    fetch('/api/registro-abierto')
      .then(r => r.json())
      .then(data => setRegistroAbierto(data.abierto))
      .catch(() => {})
      .finally(() => setCheckingStatus(false))
  }, [])

  function navigateTo(screen, direction = 'left') {
    setSlideDir(direction)
    setTransitioning(true)
    setTimeout(() => {
      setPantalla(screen)
      window.scrollTo(0, 0)
      setTransitioning(false)
    }, 400)
  }

  useEffect(() => {
    if (pantalla === 'confirmacion') {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3500)
      return () => clearTimeout(timer)
    }
  }, [pantalla])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setEnviando(true)

    try {
      const res = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al registrar')
        setEnviando(false)
        return
      }

      setConfirmacion({ ...form })
      navigateTo('confirmacion', 'left')
      setForm({ nombre: '', apellidos: '', iglesia: '', ciudad: '', telefono: '' })
    } catch {
      setError('Error de conexión. Intente de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  const transClass = transitioning
    ? `page-exit page-exit--${slideDir}`
    : 'page-enter'

  return (
    <div className="page-wrapper" ref={containerRef}>
      <div className={`page-transition ${transClass}`} key={pantalla}>

        {/* ========== BIENVENIDA ========== */}
        {pantalla === 'bienvenida' && (
          <div className="hero">
            <div className="hero-bg" />
            <div className="hero-radial" />
            <div className="hero-deco-tl" />
            <div className="hero-deco-br" />

            {/* Floating particles */}
            <div className="hero-particles" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="particle" style={{
                  '--px': `${15 + Math.random() * 70}%`,
                  '--py': `${10 + Math.random() * 80}%`,
                  '--d': `${4 + Math.random() * 8}s`,
                  '--s': `${2 + Math.random() * 3}px`,
                }} />
              ))}
            </div>

            <div className="hero-content">
              <div className="hero-logo-wrap stagger stagger-1">
                <img src="/images/logo.png" alt="Logo Convención Betsaida" className="hero-logo" />
                <div className="hero-logo-ring" />
              </div>

              <p className="hero-eyebrow stagger stagger-2">Convención Regional Bautista Betsaida</p>

              <h1 className="hero-title stagger stagger-3">
                Congreso<br />
                <span className="hero-title-accent">Iglesias Sanas</span>
              </h1>

              <div className="hero-year stagger stagger-3">2026</div>

              <div className="hero-poster stagger stagger-4">
                <img src="/images/poster.jpg" alt="Poster del Congreso 2026" />
                <div className="hero-poster-shine" />
              </div>

              <div className="stagger stagger-4"><DecoLine /></div>

              <div className="hero-invitation stagger stagger-5">
                <p>
                  Le invitamos cordialmente a ser parte del{' '}
                  <strong>Congreso Anual Iglesias Sanas 2026</strong>{' '}
                  que se llevará a cabo el{' '}
                  <strong>1 y 2 de Mayo</strong> en <strong>Ciudad Mante</strong>.
                </p>
              </div>

              {!checkingStatus && registroAbierto ? (
                <button className="hero-cta stagger stagger-6" onClick={() => navigateTo('registro', 'left')}>
                  <span className="hero-cta-text">Registrarme Ahora</span>
                  <span className="hero-cta-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </button>
              ) : !checkingStatus ? (
                <div className="hero-closed stagger stagger-6">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                  <span>El registro se encuentra cerrado por el momento</span>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* ========== FORMULARIO ========== */}
        {pantalla === 'registro' && (
          <div className="reg">
            <div className="reg-header">
              <div className="reg-header-bg" />
              <div className="reg-header-content">
                <img src="/images/logo.png" alt="Logo" className="reg-logo stagger stagger-1" />
                <h2 className="reg-header-title stagger stagger-2">Formulario de Registro</h2>
                <p className="reg-header-sub stagger stagger-2">Congreso Iglesias Sanas 2026</p>
              </div>
            </div>

            <div className="reg-body">
              <div className="reg-card stagger stagger-3">
                <div className="reg-card-top">
                  <DecoLine />
                  <h3>Complete sus datos para registrarse</h3>
                </div>

                {error && (
                  <div className="reg-alert" role="alert">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="reg-form">
                  <div className="reg-grid">
                    <div className="field field-anim" style={{ '--fi': 0 }}>
                      <label htmlFor="nombre">Nombre(s)</label>
                      <input type="text" id="nombre" name="nombre" value={form.nombre}
                        onChange={handleChange} placeholder="Escriba su nombre" required autoComplete="given-name" />
                    </div>
                    <div className="field field-anim" style={{ '--fi': 1 }}>
                      <label htmlFor="apellidos">Apellidos</label>
                      <input type="text" id="apellidos" name="apellidos" value={form.apellidos}
                        onChange={handleChange} placeholder="Escriba sus apellidos" required autoComplete="family-name" />
                    </div>
                  </div>

                  <div className="field field-anim" style={{ '--fi': 2 }}>
                    <label htmlFor="iglesia">Iglesia de procedencia</label>
                    <input type="text" id="iglesia" name="iglesia" value={form.iglesia}
                      onChange={handleChange} placeholder="Nombre de su iglesia" required />
                  </div>

                  <div className="field field-anim" style={{ '--fi': 3 }}>
                    <label htmlFor="ciudad">Ciudad de procedencia</label>
                    <input type="text" id="ciudad" name="ciudad" value={form.ciudad}
                      onChange={handleChange} placeholder="Ej: Ciudad Mante" required />
                  </div>

                  <div className="field field-anim" style={{ '--fi': 4 }}>
                    <label htmlFor="telefono">Número de teléfono <span className="field-optional">(opcional)</span></label>
                    <input type="tel" id="telefono" name="telefono" value={form.telefono}
                      onChange={handleChange} placeholder="Ej: 831 123 4567" autoComplete="tel" />
                    <span className="field-hint">Si lo proporciona, escriba su número a 10 dígitos</span>
                  </div>

                  <div className="field-anim" style={{ '--fi': 5 }}>
                    <button type="submit" className="reg-submit" disabled={enviando}>
                      {enviando ? (
                        <><span className="reg-spinner" />Enviando...</>
                      ) : 'Completar Registro'}
                    </button>
                  </div>
                </form>

                <button className="reg-back" onClick={() => navigateTo('bienvenida', 'right')}>
                  ← Volver al inicio
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========== CONFIRMACION ========== */}
        {pantalla === 'confirmacion' && (
          <div className="conf">
            <div className="conf-bg" />
            {showConfetti && <Confetti />}

            <div className="conf-card">
              {/* Branded header */}
              <div className="conf-header stagger stagger-1">
                <div className="conf-header-bg" />
                <div className="conf-header-content">
                  <img src="/images/logo.png" alt="Logo Convención Betsaida" className="conf-header-logo" />
                  <div className="conf-header-text">
                    <span className="conf-header-eyebrow">Convención Regional Bautista Betsaida</span>
                    <span className="conf-header-name">Congreso Iglesias Sanas 2026</span>
                  </div>
                </div>
              </div>

              {/* Animated rings behind check */}
              <div className="conf-rings">
                <div className="conf-ring conf-ring-1" />
                <div className="conf-ring conf-ring-2" />
                <div className="conf-ring conf-ring-3" />
              </div>

              <div className="conf-check stagger stagger-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" className="conf-check-path" />
                </svg>
              </div>

              <h2 className="conf-title stagger stagger-3">¡Registro Exitoso!</h2>
              <p className="conf-subtitle stagger stagger-3">Su lugar ha sido reservado con éxito</p>

              <div className="stagger stagger-4"><DecoLine /></div>

              {confirmacion && (
                <div className="conf-datos stagger stagger-4">
                  {[
                    ['person', 'Nombre', `${confirmacion.nombre} ${confirmacion.apellidos}`],
                    ['church', 'Iglesia', confirmacion.iglesia],
                    ['city', 'Ciudad', confirmacion.ciudad],
                    ...(confirmacion.telefono ? [['phone', 'Teléfono', confirmacion.telefono]] : []),
                  ].map(([iconType, label, value], i) => (
                    <div className="conf-dato conf-dato-anim" key={label} style={{ '--di': i }}>
                      <span className="conf-dato-icon">
                        {iconType === 'person' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                        {iconType === 'church' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
                        {iconType === 'city' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>}
                        {iconType === 'phone' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.11 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>}
                      </span>
                      <div className="conf-dato-text">
                        <span className="conf-dato-label">{label}</span>
                        <span className="conf-dato-value">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="conf-footer stagger stagger-5">
                <div className="conf-event">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  1 y 2 de Mayo de 2026 — Ciudad Mante
                </div>

                <p className="conf-cost">
                  El costo de inscripción es de <strong>$50 MXN</strong> y se paga el día del evento.
                </p>

                <button className="conf-btn" onClick={() => navigateTo('bienvenida', 'right')}>
                  Volver al Inicio
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
