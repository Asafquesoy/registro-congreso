import { useState, useEffect } from 'react'
import './Admin.css'
import './Recepcion.css'

function PasswordInput({ placeholder, value, onChange, required = true }) {
  const [show, setShow] = useState(false)
  return (
    <div className="auth-field-password-wrap">
      <input type={show ? 'text' : 'password'} placeholder={placeholder} value={value}
        onChange={onChange} required={required} />
      <button type="button" className="password-toggle" onClick={() => setShow(!show)} tabIndex={-1} title={show ? 'Ocultar' : 'Mostrar'}>
        {show ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
        )}
      </button>
    </div>
  )
}

function ForgotPasswordModal({ onClose }) {
  const [correo, setCorreo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMensaje('')
    setEnviando(true)

    try {
      const res = await fetch('/api/recuperar-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setMensaje(data.message)
    } catch {
      setError('Error de conexión')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3 className="modal-title">Recuperar Contraseña</h3>
        <p className="modal-desc">Ingrese el correo electrónico asociado a su cuenta. Le enviaremos una nueva contraseña temporal.</p>

        {error && <div className="auth-error">{error}</div>}
        {mensaje && <div className="modal-success">{mensaje}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <input type="email" placeholder="correo@ejemplo.com" value={correo}
              onChange={e => setCorreo(e.target.value)} required />
          </div>
          <button type="submit" className="auth-btn" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Enviar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}

function CambiarPasswordScreen({ forzado, onDone }) {
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (passwordNueva.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    if (passwordNueva !== passwordConfirm) {
      setError('Las contraseñas no coinciden')
      return
    }

    setEnviando(true)
    try {
      const res = await fetch('/api/cambiar-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passwordActual: forzado ? '' : passwordActual, passwordNueva })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setEnviando(false); return }
      onDone()
    } catch {
      setError('Error de conexión')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth-bg" />
      <div className="auth-deco-tl" />
      <div className="auth-deco-br" />

      <div className="auth-card reveal">
        <div className="auth-icon auth-icon--recep reveal reveal-1">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        </div>
        <h2 className="auth-title reveal reveal-2">Cambiar Contraseña</h2>
        <p className="auth-sub reveal reveal-2">
          {forzado ? 'Debe cambiar su contraseña temporal para continuar' : 'Ingrese su nueva contraseña'}
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!forzado && (
            <div className="auth-field reveal reveal-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              <PasswordInput placeholder="Contraseña actual" value={passwordActual}
                onChange={e => setPasswordActual(e.target.value)} />
            </div>
          )}
          <div className="auth-field reveal reveal-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            <PasswordInput placeholder="Nueva contraseña (mín. 6 caracteres)" value={passwordNueva}
              onChange={e => setPasswordNueva(e.target.value)} />
          </div>
          <div className="auth-field reveal reveal-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            <PasswordInput placeholder="Confirmar nueva contraseña" value={passwordConfirm}
              onChange={e => setPasswordConfirm(e.target.value)} />
          </div>
          <button type="submit" className="auth-btn reveal reveal-4" disabled={enviando}>
            {enviando ? 'Guardando...' : 'Guardar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showForgot, setShowForgot] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    const data = await res.json()

    if (!res.ok) { setError(data.error); return }
    onLogin(data.debe_cambiar_password)
  }

  return (
    <div className="auth">
      <div className="auth-bg" />
      <div className="auth-deco-tl" />
      <div className="auth-deco-br" />

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      <div className="auth-card reveal">
        <div className="auth-icon auth-icon--recep reveal reveal-1">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>
          </svg>
        </div>
        <h2 className="auth-title reveal reveal-2">Recepción</h2>
        <p className="auth-sub reveal reveal-2">Congreso Iglesias Sanas 2026</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field reveal reveal-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <input type="text" placeholder="Usuario" value={username}
              onChange={e => setUsername(e.target.value)} required />
          </div>
          <div className="auth-field reveal reveal-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            <PasswordInput placeholder="Contraseña" value={password}
              onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="auth-btn reveal reveal-4">Iniciar Sesión</button>
        </form>

        <button className="auth-forgot reveal reveal-4" onClick={() => setShowForgot(true)}>
          ¿Olvidó su contraseña?
        </button>
      </div>
    </div>
  )
}

function PersonaCard({ persona, onAccion }) {
  const initials = (persona.nombre[0] || '') + (persona.apellidos[0] || '')

  return (
    <div className={`persona ${persona.pagado && persona.asistio ? 'persona--paid' : ''} reveal`}>
      <div className="persona-head">
        <div className="persona-avatar">{initials}</div>
        <div className="persona-identity">
          <h3>{persona.nombre} {persona.apellidos}</h3>
          <span>{persona.iglesia}{persona.ciudad ? ` — ${persona.ciudad}` : ''}</span>
        </div>
        {persona.pagado && persona.asistio && (
          <div className="persona-stamp">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        )}
      </div>

      <div className="persona-grid">
        {persona.telefono && persona.telefono !== '' && (
          <div className="persona-info">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
            <span>{persona.telefono}</span>
          </div>
        )}
        {persona.ciudad && persona.ciudad !== '' && (
          <div className="persona-info">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>{persona.ciudad}</span>
          </div>
        )}
        <div className="persona-info">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span>{new Date(persona.fecha_registro).toLocaleDateString('es-MX')}</span>
        </div>
      </div>

      <div className="persona-actions">
        {/* Status pills */}
        <div className="persona-status-row">
          <div className={`status-pill ${persona.pagado ? 'status-paid' : 'status-pending'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {persona.pagado ? <polyline points="20 6 9 17 4 12"/> : <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}
            </svg>
            {persona.pagado ? 'Pagado' : 'Sin pagar'}
          </div>
          <div className={`status-pill ${persona.asistio ? 'status-attend-yes' : 'status-attend-no'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {persona.asistio ? <polyline points="20 6 9 17 4 12"/> : <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}
            </svg>
            {persona.asistio ? 'Asistió' : 'Sin asistencia'}
          </div>
        </div>

        {/* Action buttons */}
        <div className="persona-btn-row">
          {!persona.pagado && (
            <button className="btn-action btn-action--pago" onClick={() => onAccion(persona.id, 'pago')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              Pago
            </button>
          )}
          {!persona.asistio && (
            <button className="btn-action btn-action--asistio" onClick={() => onAccion(persona.id, 'asistencia')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Asistió
            </button>
          )}
          {(!persona.pagado || !persona.asistio) && (
            <button className="btn-pay" onClick={() => onAccion(persona.id, 'pagoYAsistencia')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Pago y Asistencia
            </button>
          )}
          {persona.pagado && (
            <button className="btn-undo" onClick={() => onAccion(persona.id, 'cancelarPago')}>
              Cancelar Pago
            </button>
          )}
          {persona.asistio && (
            <button className="btn-undo" onClick={() => onAccion(persona.id, 'cancelarAsistencia')}>
              Cancelar Asistencia
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function RegistroSitio({ onRegistrado }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ nombre: '', apellidos: '', iglesia: '', ciudad: '', telefono: '' })
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [enviando, setEnviando] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setExito('')
    setEnviando(true)

    try {
      const res = await fetch('/api/recepcion/registro-sitio', {
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

      setExito(`${form.nombre} ${form.apellidos} registrado exitosamente`)
      setForm({ nombre: '', apellidos: '', iglesia: '', ciudad: '', telefono: '' })
      if (onRegistrado) onRegistrado()
      setTimeout(() => setExito(''), 4000)
    } catch {
      setError('Error de conexión')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="sitio-card reveal">
      <button className="sitio-toggle" onClick={() => setOpen(!open)}>
        <div className="sitio-toggle-left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          <span>Registro en Sitio</span>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <form className="sitio-form" onSubmit={handleSubmit}>
          <p className="sitio-desc">Registre personas que llegan sin registro previo. Se marcan automáticamente como pagados y con asistencia.</p>

          {error && <div className="sitio-error">{error}</div>}
          {exito && <div className="sitio-exito">{exito}</div>}

          <div className="sitio-grid">
            <input name="nombre" placeholder="Nombre *" value={form.nombre} onChange={handleChange} required />
            <input name="apellidos" placeholder="Apellidos *" value={form.apellidos} onChange={handleChange} required />
            <input name="iglesia" placeholder="Iglesia *" value={form.iglesia} onChange={handleChange} required />
            <input name="ciudad" placeholder="Ciudad *" value={form.ciudad} onChange={handleChange} required />
            <input name="telefono" placeholder="Teléfono (opcional)" value={form.telefono} onChange={handleChange} />
          </div>

          <button type="submit" className="sitio-submit" disabled={enviando}>
            {enviando ? 'Registrando...' : 'Registrar Persona'}
          </button>
        </form>
      )}
    </div>
  )
}

export default function Recepcion() {
  const [autenticado, setAutenticado] = useState(false)
  const [debeCambiar, setDebeCambiar] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState(null)

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => setAutenticado(true))
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  async function buscar() {
    if (busqueda.trim().length < 2) return
    const res = await fetch(`/api/recepcion/buscar?q=${encodeURIComponent(busqueda.trim())}`)
    setResultados(await res.json())
  }

  async function ejecutarAccion(id, tipo) {
    const mensajes = {
      pago: 'registrar el pago',
      asistencia: 'marcar la asistencia',
      pagoYAsistencia: 'registrar el pago y asistencia',
      cancelarPago: 'cancelar el pago',
      cancelarAsistencia: 'cancelar la asistencia'
    }
    if (!window.confirm(`¿Está seguro de ${mensajes[tipo]} de esta persona?`)) return

    const body = {}
    if (tipo === 'pago') body.pagado = true
    else if (tipo === 'asistencia') body.soloAsistencia = true
    else if (tipo === 'pagoYAsistencia') body.pagoYAsistencia = true
    else if (tipo === 'cancelarPago') body.pagado = false
    else if (tipo === 'cancelarAsistencia') body.soloAsistencia = false

    await fetch(`/api/recepcion/pago/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    buscar()
  }

  async function logout() {
    await fetch('/api/logout', { method: 'POST' })
    window.location.reload()
  }

  if (!autenticado) {
    if (cargando) return null
    return <LoginForm onLogin={(mustChange) => {
      if (mustChange) { setDebeCambiar(true) }
      setAutenticado(true)
    }} />
  }

  if (debeCambiar) {
    return <CambiarPasswordScreen forzado onDone={() => setDebeCambiar(false)} />
  }

  if (showChangePassword) {
    return <CambiarPasswordScreen forzado={false} onDone={() => setShowChangePassword(false)} />
  }

  return (
    <div className="recep">
      <header className="nav">
        <div className="nav-left">
          <div className="nav-brand">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>
            </svg>
            <span>Recepción — Día del Evento</span>
          </div>
        </div>
        <div className="nav-actions">
          <button className="nav-theme-toggle" onClick={() => setDarkMode(!darkMode)} title={darkMode ? 'Modo claro' : 'Modo oscuro'}>
            {darkMode ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
            )}
          </button>
          <button className="nav-change-pwd" onClick={() => setShowChangePassword(true)} title="Cambiar contraseña">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </button>
          <button className="nav-logout" onClick={logout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Salir
          </button>
        </div>
      </header>

      <main className="recep-main">
        {/* Search */}
        <div className="search-card reveal">
          <h3 className="search-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Buscar Persona Registrada
          </h3>
          <div className="search-row">
            <div className="search-input">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                placeholder="Nombre, apellido, teléfono o correo..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscar()}
              />
            </div>
            <button className="search-btn" onClick={buscar}>Buscar</button>
          </div>
          <p className="search-hint">Escriba al menos 2 caracteres</p>
        </div>

        {/* Registro en Sitio */}
        <RegistroSitio onRegistrado={buscar} />

        {/* Results */}
        <div className="results">
          {resultados !== null && resultados.length === 0 && (
            <div className="no-results reveal">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
              <p>No se encontraron personas con esa búsqueda</p>
            </div>
          )}

          {resultados && resultados.map(p => (
            <PersonaCard key={p.id} persona={p} onAccion={ejecutarAccion} />
          ))}
        </div>
      </main>
    </div>
  )
}
