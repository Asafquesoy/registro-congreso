import { useState, useEffect, useCallback, useRef } from 'react'
import './Admin.css'

function PasswordInput({ placeholder, value, onChange, required = true }) {
  const [show, setShow] = useState(false)
  return (
    <>
      <input
        className="password-input"
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
      />
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
    </>
  )
}

function ForgotPasswordModal({ onClose }) {
  const [username, setUsername] = useState('')
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
        body: JSON.stringify({ username, correo })
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
        <p className="modal-desc">Ingrese su nombre de usuario y el correo asociado a su cuenta. Le enviaremos una nueva contraseña temporal.</p>

        {error && <div className="auth-error">{error}</div>}
        {mensaje && <div className="modal-success">{mensaje}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <input type="text" placeholder="Nombre de usuario" value={username}
              onChange={e => setUsername(e.target.value)} required />
          </div>
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
        <div className="auth-icon reveal reveal-1">
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

function LoginForm({ onLogin, title, icon, requiredRole }) {
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
    const allowed = Array.isArray(requiredRole) ? requiredRole : (requiredRole ? [requiredRole] : [])
    if (allowed.length > 0 && !allowed.includes(data.rol)) {
      setError('No tiene permisos para acceder a este panel')
      return
    }
    onLogin(data.debe_cambiar_password, data.rol)
  }

  return (
    <div className="auth">
      <div className="auth-bg" />
      <div className="auth-deco-tl" />
      <div className="auth-deco-br" />

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}

      <div className="auth-card reveal">
        <div className="auth-icon reveal reveal-1">{icon}</div>
        <h2 className="auth-title reveal reveal-2">{title}</h2>
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

function StatCard({ numero, etiqueta, icono, accent }) {
  return (
    <div className="stat" style={{ '--card-accent': accent }}>
      <div className="stat-icon">{icono}</div>
      <div className="stat-body">
        <div className="stat-num">{numero}</div>
        <div className="stat-label">{etiqueta}</div>
      </div>
    </div>
  )
}

function BarChart({ data, labelKey, valueKey, accent, limit = 10 }) {
  if (!data || data.length === 0) return <p className="empty-state">Sin datos aún</p>
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? data : data.slice(0, limit)
  const max = Math.max(...data.map(d => d[valueKey]), 1)

  return (
    <div className="chart">
      {visible.map((d, i) => (
        <div key={i} className="chart-row">
          <span className="chart-label">{d[labelKey]}</span>
          <div className="chart-track">
            <div className="chart-bar" style={{
              width: `${(d[valueKey] / max) * 100}%`,
              background: accent,
              animationDelay: `${i * 0.08}s`
            }}>
              <span>{d[valueKey]}</span>
            </div>
          </div>
        </div>
      ))}
      {data.length > limit && (
        <button className="chart-show-more" onClick={() => setShowAll(v => !v)}>
          {showAll ? 'Ver menos' : `Ver ${data.length - limit} más`}
        </button>
      )}
    </div>
  )
}

function UserManager({ usuarios, onRefresh }) {
  const [showForm, setShowForm] = useState(false)
  const [newUser, setNewUser] = useState({ username: '', rol: 'recepcion', correo: '', enviarCorreo: false })
  const [userError, setUserError] = useState('')
  const [userSuccess, setUserSuccess] = useState('')
  const [generatedPassword, setGeneratedPassword] = useState('')

  async function crearUsuario(e) {
    e.preventDefault()
    setUserError('')
    setUserSuccess('')
    setGeneratedPassword('')

    const res = await fetch('/api/admin/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    })
    const data = await res.json()

    if (!res.ok) { setUserError(data.error); return }

    setGeneratedPassword(data.tempPassword)
    setUserSuccess(`Usuario "${newUser.username}" creado exitosamente`)
    setNewUser({ username: '', rol: 'recepcion', correo: '', enviarCorreo: false })
    setShowForm(false)
    onRefresh()
  }

  async function eliminarUsuario(id, username) {
    if (!window.confirm(`¿Eliminar al usuario "${username}"?`)) return
    const res = await fetch(`/api/admin/usuarios/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { setUserError(data.error); return }
    onRefresh()
  }

  return (
    <section className="card">
      <div className="card-head">
        <h3 className="card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          Gestión de Usuarios
        </h3>
        <button className="btn-add-user" onClick={() => { setShowForm(!showForm); setGeneratedPassword('') }}>
          {showForm ? 'Cancelar' : '+ Nuevo Usuario'}
        </button>
      </div>

      {userError && <div className="user-msg user-msg-error">{userError}</div>}
      {userSuccess && <div className="user-msg user-msg-success">{userSuccess}</div>}

      {generatedPassword && (
        <div className="user-msg user-msg-password">
          <strong>Contraseña temporal generada:</strong>
          <code className="temp-password-code">{generatedPassword}</code>
          <span className="temp-password-hint">El usuario deberá cambiarla al iniciar sesión</span>
        </div>
      )}

      {showForm && (
        <form onSubmit={crearUsuario} className="user-form">
          <div className="user-form-grid">
            <div className="user-field">
              <label>Usuario</label>
              <input type="text" value={newUser.username} placeholder="nombre_usuario"
                onChange={e => setNewUser({ ...newUser, username: e.target.value })} required />
            </div>
            <div className="user-field">
              <label>Rol</label>
              <select value={newUser.rol} onChange={e => setNewUser({ ...newUser, rol: e.target.value })}>
                <option value="recepcion">Recepcionista</option>
                <option value="visor">Visor (Solo Lectura)</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="user-field" style={{ gridColumn: '1 / -1' }}>
              <label>Correo electrónico</label>
              <input type="email" value={newUser.correo} placeholder="correo@ejemplo.com"
                onChange={e => setNewUser({ ...newUser, correo: e.target.value })} />
            </div>
          </div>
          <div className="user-form-actions">
            <label className="user-check">
              <input type="checkbox" checked={newUser.enviarCorreo}
                onChange={e => setNewUser({ ...newUser, enviarCorreo: e.target.checked })} />
              <span>Enviar credenciales por correo</span>
            </label>
            <button type="submit" className="btn-create-user">Crear Usuario</button>
          </div>
          <p className="user-form-note">Se generará una contraseña temporal automáticamente</p>
        </form>
      )}

      <div className="user-list">
        {usuarios.map(u => (
          <div key={u.id} className="user-row">
            <div className="user-avatar">{u.username[0].toUpperCase()}</div>
            <div className="user-info">
              <span className="user-name">{u.username}</span>
              <span className={`user-role ${u.rol === 'admin' ? 'role-admin' : u.rol === 'visor' ? 'role-visor' : 'role-recep'}`}>
                {u.rol === 'admin' ? 'Administrador' : u.rol === 'visor' ? 'Visor' : 'Recepcionista'}
              </span>
              {u.correo && <span className="user-email">{u.correo}</span>}
            </div>
            <button className="btn-del" onClick={() => eliminarUsuario(u.id, u.username)} title="Eliminar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

function RegistroToggle({ abierto, onToggle }) {
  return (
    <div className={`reg-toggle ${abierto ? 'reg-toggle--on' : 'reg-toggle--off'}`}>
      <div className="reg-toggle-info">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {abierto
            ? <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>
            : <><path d="M13.73 21a2 2 0 01-3.46 0M18.63 13A17.89 17.89 0 0118 8"/><path d="M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14"/><line x1="1" y1="1" x2="23" y2="23"/></>
          }
        </svg>
        <div>
          <span className="reg-toggle-label">{abierto ? 'Registro Abierto' : 'Registro Cerrado'}</span>
          <span className="reg-toggle-desc">{abierto ? 'Las personas pueden registrarse' : 'El formulario está deshabilitado'}</span>
        </div>
      </div>
      <button className={`reg-toggle-btn ${abierto ? 'reg-toggle-btn--on' : 'reg-toggle-btn--off'}`} onClick={onToggle}>
        <span className="reg-toggle-knob" />
      </button>
    </div>
  )
}

function HistorialPanel({ historial }) {
  if (!historial || historial.length === 0) return <p className="empty-state">Sin actividad registrada</p>

  return (
    <div className="historial-list">
      {historial.map(h => (
        <div key={h.id} className="historial-row">
          <div className="historial-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div className="historial-body">
            <span className="historial-user">{h.usuario}</span>
            <span className="historial-accion">{h.accion}</span>
            {h.detalle && <span className="historial-detalle">{h.detalle}</span>}
          </div>
          <span className="historial-fecha">{new Date(h.fecha).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      ))}
    </div>
  )
}

export default function Admin() {
  const [autenticado, setAutenticado] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [debeCambiar, setDebeCambiar] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [stats, setStats] = useState(null)
  const [registros, setRegistros] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [historial, setHistorial] = useState([])
  const [registroAbierto, setRegistroAbierto] = useState(true)
  const [cargando, setCargando] = useState(true)
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const intervalRef = useRef(null)

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  // Filters
  const [filtros, setFiltros] = useState({ busqueda: '', pagado: '', asistio: '' })

  const registrosFiltrados = registros.filter(r => {
    if (filtros.busqueda) {
      const q = filtros.busqueda.toLowerCase()
      const match = `${r.nombre} ${r.apellidos} ${r.iglesia} ${r.ciudad || ''} ${r.telefono}`.toLowerCase().includes(q)
      if (!match) return false
    }
    if (filtros.pagado === 'si' && !r.pagado) return false
    if (filtros.pagado === 'no' && r.pagado) return false
    if (filtros.asistio === 'si' && !r.asistio) return false
    if (filtros.asistio === 'no' && r.asistio) return false
    return true
  })

  const isVisor = userRole === 'visor'

  const cargarDatos = useCallback(async () => {
    try {
      const [statsRes, regRes, usersRes, histRes, configRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/registros'),
        fetch('/api/admin/usuarios'),
        fetch('/api/admin/historial'),
        fetch('/api/admin/config/registro')
      ])
      if (statsRes.ok && regRes.ok) {
        setStats(await statsRes.json())
        setRegistros(await regRes.json())
      }
      if (usersRes.ok) setUsuarios(await usersRes.json())
      if (histRes.ok) setHistorial(await histRes.json())
      if (configRes.ok) {
        const cfg = await configRes.json()
        setRegistroAbierto(cfg.abierto)
      }
      setUltimaActualizacion(new Date())
    } catch { /* silent */ }
    finally { setCargando(false) }
  }, [])

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(user => {
        if (user.rol === 'admin' || user.rol === 'visor') {
          setUserRole(user.rol)
          setAutenticado(true)
        } else {
          setCargando(false)
        }
      })
      .catch(() => setCargando(false))
  }, [])

  useEffect(() => { if (autenticado) cargarDatos() }, [autenticado, cargarDatos])

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    if (autenticado && autoRefresh) {
      intervalRef.current = setInterval(cargarDatos, 30000)
      return () => clearInterval(intervalRef.current)
    } else {
      clearInterval(intervalRef.current)
    }
  }, [autenticado, autoRefresh, cargarDatos])

  async function toggleRegistro() {
    const nuevo = !registroAbierto
    const res = await fetch('/api/admin/config/registro', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ abierto: nuevo })
    })
    if (res.ok) {
      setRegistroAbierto(nuevo)
      cargarDatos()
    }
  }

  async function logout() {
    await fetch('/api/logout', { method: 'POST' })
    window.location.reload()
  }

  async function eliminar(id) {
    if (!window.confirm('¿Está seguro de eliminar este registro?')) return
    await fetch(`/api/admin/registro/${id}`, { method: 'DELETE' })
    cargarDatos()
  }

  if (!autenticado) {
    if (cargando) return null
    return (
      <LoginForm
        title="Administración"
        requiredRole={['admin', 'visor']}
        onLogin={(mustChange, rol) => {
          setUserRole(rol)
          if (mustChange) { setDebeCambiar(true) }
          setAutenticado(true)
        }}
        icon={
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        }
      />
    )
  }

  if (debeCambiar) {
    return <CambiarPasswordScreen forzado onDone={() => setDebeCambiar(false)} />
  }

  if (showChangePassword) {
    return <CambiarPasswordScreen forzado={false} onDone={() => setShowChangePassword(false)} />
  }

  return (
    <div className="admin">
      <header className="nav">
        <div className="nav-left">
          <div className="nav-brand">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>{isVisor ? 'Panel de Visor (Solo Lectura)' : 'Panel de Administración'}</span>
          </div>
          <div className="nav-live">
            <button className={`nav-live-btn ${autoRefresh ? 'nav-live-btn--on' : ''}`} onClick={() => setAutoRefresh(!autoRefresh)} title={autoRefresh ? 'Desactivar auto-refresh' : 'Activar auto-refresh'}>
              <span className={`nav-live-dot ${autoRefresh ? 'nav-live-dot--on' : ''}`} />
              {autoRefresh ? 'EN VIVO' : 'PAUSADO'}
            </button>
            {ultimaActualizacion && (
              <span className="nav-live-time">
                {ultimaActualizacion.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
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

      <main className="admin-main">
        {/* Toggle Registro */}
        {isVisor ? (
          <div className={`reg-toggle ${registroAbierto ? 'reg-toggle--on' : 'reg-toggle--off'}`}>
            <div className="reg-toggle-info">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {registroAbierto
                  ? <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>
                  : <><path d="M13.73 21a2 2 0 01-3.46 0M18.63 13A17.89 17.89 0 0118 8"/><path d="M6.26 6.26A5.86 5.86 0 006 8c0 7-3 9-3 9h14"/><line x1="1" y1="1" x2="23" y2="23"/></>
                }
              </svg>
              <div>
                <span className="reg-toggle-label">{registroAbierto ? 'Registro Abierto' : 'Registro Cerrado'}</span>
                <span className="reg-toggle-desc">Solo lectura</span>
              </div>
            </div>
          </div>
        ) : (
          <RegistroToggle abierto={registroAbierto} onToggle={toggleRegistro} />
        )}

        {/* Stats */}
        {stats && (
          <div className="stats-row reveal">
            <StatCard numero={stats.totalRegistros} etiqueta="Registrados" accent="var(--gold-500)"
              icono={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>}
            />
            <StatCard numero={stats.totalPagados} etiqueta="Han Pagado" accent="var(--sage-500)"
              icono={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
            />
            <StatCard numero={stats.totalAsistieron} etiqueta="Asistieron" accent="var(--terra-500)"
              icono={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
            />
          </div>
        )}

        {/* Charts */}
        {stats && (
          <div className="charts-row reveal reveal-2">
            <section className="card">
              <h3 className="card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Registros por Ciudad
              </h3>
              <BarChart data={stats.porCiudad} labelKey="ciudad" valueKey="total" accent="linear-gradient(90deg, var(--gold-500), var(--gold-400))" />
            </section>
            <section className="card">
              <h3 className="card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                Registros por Iglesia
              </h3>
              <BarChart data={stats.porIglesia} labelKey="iglesia" valueKey="total" accent="linear-gradient(90deg, var(--terra-500), var(--terra-400))" />
            </section>
          </div>
        )}

        {/* Table */}
        <section className="card reveal reveal-3">
          <div className="card-head">
            <h3 className="card-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Todos los Registros
            </h3>
            <div className="card-head-actions">
              <a href="/api/admin/descargar" className="btn-csv">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                CSV
              </a>
              <a href="/api/admin/descargar-excel" className="btn-excel">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Excel
              </a>
            </div>
          </div>
          {/* Filter bar */}
          <div className="filter-bar">
            <div className="filter-field" style={{ flex: 2 }}>
              <label>Buscar</label>
              <input type="text" placeholder="Nombre, iglesia, ciudad, teléfono..." value={filtros.busqueda}
                onChange={e => setFiltros({ ...filtros, busqueda: e.target.value })} />
            </div>
            <div className="filter-field">
              <label>Pagado</label>
              <select value={filtros.pagado} onChange={e => setFiltros({ ...filtros, pagado: e.target.value })}>
                <option value="">Todos</option>
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>
            </div>
            <div className="filter-field">
              <label>Asistió</label>
              <select value={filtros.asistio} onChange={e => setFiltros({ ...filtros, asistio: e.target.value })}>
                <option value="">Todos</option>
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>

          {registros.length > 0 && (
            <p className="filter-count">Mostrando <strong>{registrosFiltrados.length}</strong> de {registros.length} registros</p>
          )}

          <div className="table-wrap">
            {registros.length === 0 ? (
              <p className="empty-state">No hay registros aún</p>
            ) : registrosFiltrados.length === 0 ? (
              <p className="empty-state">No se encontraron registros con esos filtros</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Iglesia</th>
                    <th>Ciudad</th>
                    <th>Teléfono</th>
                    <th>Pagado</th>
                    <th>Asistió</th>
                    <th>Fecha</th>
                    {!isVisor && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {registrosFiltrados.map(r => (
                    <tr key={r.id}>
                      <td className="cell-muted">{r.id}</td>
                      <td className="cell-bold">{r.nombre} {r.apellidos}</td>
                      <td>{r.iglesia}</td>
                      <td>{r.ciudad || ''}</td>
                      <td className="cell-mono">{r.telefono || ''}</td>
                      <td><span className={`tag ${r.pagado ? 'tag-yes' : 'tag-no'}`}>{r.pagado ? 'Sí' : 'No'}</span></td>
                      <td><span className={`tag ${r.asistio ? 'tag-yes' : 'tag-no'}`}>{r.asistio ? 'Sí' : 'No'}</span></td>
                      <td className="cell-muted">{new Date(r.fecha_registro).toLocaleDateString('es-MX')}</td>
                      {!isVisor && (
                        <td>
                          <button className="btn-del" onClick={() => eliminar(r.id)} title="Eliminar">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* User Management — admin only */}
        {!isVisor && <UserManager usuarios={usuarios} onRefresh={cargarDatos} />}

        {/* Historial */}
        <section className="card reveal reveal-4">
          <h3 className="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Historial de Actividad
          </h3>
          <HistorialPanel historial={historial} />
        </section>
      </main>
    </div>
  )
}
