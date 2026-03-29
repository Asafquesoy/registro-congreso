require('dotenv').config();
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const ExcelJS = require('exceljs');
const path = require('path');
const { initDB, queryAll, queryOne, execute, lastInsertId } = require('./db');

// Configurar transporte de correo (Zoho)
let mailTransporter = null;
if (process.env.ZOHO_EMAIL && process.env.ZOHO_PASSWORD) {
  mailTransporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.ZOHO_EMAIL,
      pass: process.env.ZOHO_PASSWORD
    }
  });
}

async function enviarCorreo(to, subject, html) {
  if (!mailTransporter) return false;
  try {
    await mailTransporter.sendMail({
      from: `"Congreso Iglesias Sanas" <${process.env.ZOHO_EMAIL}>`,
      to,
      subject,
      html
    });
    return true;
  } catch (err) {
    console.error('Error enviando correo:', err.message);
    return false;
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline styles/scripts from React build
  crossOriginEmbedderPolicy: false
}));

// Trust proxy (for Digital Ocean / nginx reverse proxy)
app.set('trust proxy', 1);

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intente de nuevo en unos minutos.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Intente de nuevo en 15 minutos.' }
});

const registroLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados registros desde esta dirección. Intente de nuevo más tarde.' }
});

app.use('/api/', generalLimiter);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Servir imágenes
app.use('/images', express.static(path.resolve(__dirname, 'images')));

// Servir el build de React (producción)
const reactBuild = path.resolve(__dirname, 'public_react');
app.use(express.static(reactBuild));

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  console.error('ERROR: SESSION_SECRET no está configurado. Defínalo en el archivo .env antes de iniciar en producción.');
  process.exit(1);
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-only-secret-no-usar-en-produccion',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 8 * 60 * 60 * 1000, // 8 horas
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Middleware de autenticación
function requireAuth(...allowedRoles) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.session.user.rol)) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    next();
  };
}

// Helper: registrar en historial
function registrarHistorial(usuario, accion, detalle = '') {
  execute('INSERT INTO historial (usuario, accion, detalle) VALUES (?, ?, ?)', [usuario, accion, detalle]);
}

// ==================== ESTADO DEL REGISTRO (público) ====================

app.get('/api/registro-abierto', (req, res) => {
  const config = queryOne("SELECT valor FROM configuracion WHERE clave = 'registro_abierto'");
  res.json({ abierto: config ? config.valor === '1' : true });
});

// ==================== AUTH ====================

app.post('/api/login', authLimiter, (req, res) => {
  const { username, password } = req.body;
  const user = queryOne('SELECT * FROM usuarios WHERE username = ?', [username]);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }

  req.session.user = { id: user.id, username: user.username, rol: user.rol };
  res.json({ ok: true, rol: user.rol, debe_cambiar_password: !!user.debe_cambiar_password });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'No autorizado' });
  res.json(req.session.user);
});

// ==================== REGISTRO PÚBLICO ====================

app.post('/api/registro', registroLimiter, (req, res) => {
  const config = queryOne("SELECT valor FROM configuracion WHERE clave = 'registro_abierto'");
  if (config && config.valor !== '1') {
    return res.status(403).json({ error: 'El registro está cerrado por el momento' });
  }

  const { nombre, apellidos, iglesia, ciudad, telefono } = req.body;

  if (!nombre || !apellidos || !iglesia || !ciudad) {
    return res.status(400).json({ error: 'Nombre, apellidos, iglesia y ciudad son obligatorios' });
  }

  const existePersona = queryOne(
    'SELECT id FROM registros WHERE LOWER(nombre) = LOWER(?) AND LOWER(apellidos) = LOWER(?)',
    [nombre.trim(), apellidos.trim()]
  );
  if (existePersona) {
    return res.status(409).json({ error: 'Ya existe una persona registrada con ese nombre y apellidos' });
  }

  let telefonoLimpio = '';
  if (telefono && telefono.trim()) {
    telefonoLimpio = telefono.replace(/\D/g, '');
    if (telefonoLimpio.length < 10) {
      return res.status(400).json({ error: 'El número de teléfono debe tener al menos 10 dígitos' });
    }

    const existeTelefono = queryOne("SELECT id FROM registros WHERE telefono = ? AND telefono != ''", [telefonoLimpio]);
    if (existeTelefono) {
      return res.status(409).json({ error: 'Ya existe un registro con este número de teléfono' });
    }
  }

  try {
    execute(
      'INSERT INTO registros (nombre, apellidos, iglesia, ciudad, telefono) VALUES (?, ?, ?, ?, ?)',
      [nombre.trim(), apellidos.trim(), iglesia.trim(), ciudad.trim(), telefonoLimpio]
    );

    const id = lastInsertId();
    res.json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar el registro. Es posible que ya esté registrado.' });
  }
});

// ==================== ADMIN ====================

app.get('/api/admin/stats', requireAuth('admin', 'visor'), (req, res) => {
  const total = queryOne('SELECT COUNT(*) as total FROM registros');
  const pagados = queryOne('SELECT COUNT(*) as total FROM registros WHERE pagado = 1');
  const asistieron = queryOne('SELECT COUNT(*) as total FROM registros WHERE asistio = 1');
  const porTaller = queryAll("SELECT taller, COUNT(*) as total FROM registros WHERE taller != '' GROUP BY taller ORDER BY total DESC");
  const porIglesia = queryAll('SELECT iglesia, COUNT(*) as total FROM registros GROUP BY iglesia ORDER BY total DESC');
  const porCiudad = queryAll("SELECT ciudad, COUNT(*) as total FROM registros WHERE ciudad != '' GROUP BY ciudad ORDER BY total DESC");

  res.json({
    totalRegistros: total.total,
    totalPagados: pagados.total,
    totalAsistieron: asistieron.total,
    porTaller,
    porIglesia,
    porCiudad
  });
});

app.get('/api/admin/registros', requireAuth('admin', 'visor'), (req, res) => {
  const registros = queryAll('SELECT * FROM registros ORDER BY fecha_registro DESC');
  res.json(registros);
});

app.get('/api/admin/descargar', requireAuth('admin', 'visor'), (req, res) => {
  const registros = queryAll('SELECT * FROM registros ORDER BY fecha_registro DESC');

  const headers = ['ID', 'Nombre', 'Apellidos', 'Iglesia', 'Ciudad', 'Teléfono', 'Fecha Registro', 'Pagado', 'Asistió'];

  const csvRows = [headers.join(',')];
  for (const r of registros) {
    csvRows.push([
      r.id,
      `"${r.nombre}"`,
      `"${r.apellidos}"`,
      `"${r.iglesia}"`,
      `"${r.ciudad || ''}"`,
      r.telefono || '',
      r.fecha_registro,
      r.pagado ? 'Sí' : 'No',
      r.asistio ? 'Sí' : 'No'
    ].join(','));
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=registros-congreso.csv');
  res.send('\uFEFF' + csvRows.join('\n'));
});

app.delete('/api/admin/registro/:id', requireAuth('admin'), (req, res) => {
  const registro = queryOne('SELECT nombre, apellidos FROM registros WHERE id = ?', [Number(req.params.id)]);
  execute('DELETE FROM registros WHERE id = ?', [Number(req.params.id)]);
  registrarHistorial(req.session.user.username, 'Eliminó registro', registro ? `${registro.nombre} ${registro.apellidos}` : `ID ${req.params.id}`);
  res.json({ ok: true });
});

// ==================== GESTIÓN DE USUARIOS ====================

app.get('/api/admin/usuarios', requireAuth('admin', 'visor'), (req, res) => {
  const usuarios = queryAll('SELECT id, username, rol, correo FROM usuarios ORDER BY rol, username');
  res.json(usuarios);
});

app.post('/api/admin/usuarios', requireAuth('admin'), (req, res) => {
  const { username, rol, correo, enviarCorreo: enviar } = req.body;

  if (!username || !rol) {
    return res.status(400).json({ error: 'Usuario y rol son obligatorios' });
  }

  if (!['admin', 'recepcion', 'visor'].includes(rol)) {
    return res.status(400).json({ error: 'El rol debe ser admin, recepcion o visor' });
  }

  const existe = queryOne('SELECT id FROM usuarios WHERE username = ?', [username.trim()]);
  if (existe) {
    return res.status(409).json({ error: 'Ya existe un usuario con ese nombre' });
  }

  // Auto-generar contraseña temporal
  const tempPassword = crypto.randomBytes(4).toString('hex');
  const hash = bcrypt.hashSync(tempPassword, 10);
  execute('INSERT INTO usuarios (username, password, rol, correo, debe_cambiar_password) VALUES (?, ?, ?, ?, 1)',
    [username.trim(), hash, rol, (correo || '').trim()]);

  registrarHistorial(req.session.user.username, 'Creó usuario', `${username.trim()} (${rol})`);

  // Enviar credenciales por correo si se solicitó
  if (enviar && correo) {
    const rolTexto = rol === 'admin' ? 'Administrador' : rol === 'visor' ? 'Visor' : 'Recepcionista';
    const panelUrl = rol === 'recepcion' ? '/recepcion' : '/admin';

    enviarCorreo(correo.trim(), `Credenciales de acceso - Congreso Iglesias Sanas 2026`, `
      <div style="max-width:600px;margin:0 auto;font-family:Georgia,serif;background:#faf6f0;padding:0;">
        <div style="background:#0f1729;padding:32px 24px;text-align:center;">
          <h1 style="color:#e8b84b;font-size:24px;margin:0;">Congreso Iglesias Sanas</h1>
          <p style="color:#c9962b;font-size:13px;letter-spacing:2px;margin:8px 0 0;text-transform:uppercase;">Panel de ${rolTexto}</p>
        </div>
        <div style="padding:32px 28px;">
          <p style="color:#3a332c;font-size:15px;line-height:1.6;">
            Se le ha creado una cuenta de <strong>${rolTexto}</strong> para el sistema de registro del Congreso Iglesias Sanas 2026.
          </p>
          <div style="background:white;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #e5dace;">
            <table style="width:100%;font-size:14px;color:#3a332c;">
              <tr><td style="padding:8px 0;color:#a09182;font-weight:600;">Usuario</td><td style="padding:8px 0;font-weight:700;">${username.trim()}</td></tr>
              <tr><td style="padding:8px 0;color:#a09182;font-weight:600;">Contraseña temporal</td><td style="padding:8px 0;font-weight:700;font-family:monospace;font-size:16px;color:#b8860b;">${tempPassword}</td></tr>
              <tr><td style="padding:8px 0;color:#a09182;font-weight:600;">Panel</td><td style="padding:8px 0;">${panelUrl}</td></tr>
            </table>
          </div>
          <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:12px;margin:16px 0;">
            <p style="margin:0;color:#856404;font-size:13px;font-weight:600;">⚠️ Deberá cambiar su contraseña al iniciar sesión por primera vez.</p>
          </div>
          <p style="color:#a09182;font-size:12px;text-align:center;">Si no encuentra este correo en su bandeja de entrada, revise la carpeta de spam o correo no deseado.</p>
        </div>
      </div>
    `);
  }

  res.json({ ok: true, tempPassword });
});

app.delete('/api/admin/usuarios/:id', requireAuth('admin'), (req, res) => {
  const id = Number(req.params.id);
  // No permitir eliminar al propio usuario
  if (req.session.user.id === id) {
    return res.status(400).json({ error: 'No puede eliminarse a sí mismo' });
  }
  execute('DELETE FROM usuarios WHERE id = ?', [id]);
  res.json({ ok: true });
});

// ==================== ADMIN: TOGGLE REGISTRO ====================

app.get('/api/admin/config/registro', requireAuth('admin', 'visor'), (req, res) => {
  const config = queryOne("SELECT valor FROM configuracion WHERE clave = 'registro_abierto'");
  res.json({ abierto: config ? config.valor === '1' : true });
});

app.put('/api/admin/config/registro', requireAuth('admin'), (req, res) => {
  const { abierto } = req.body;
  execute("UPDATE configuracion SET valor = ? WHERE clave = 'registro_abierto'", [abierto ? '1' : '0']);
  registrarHistorial(req.session.user.username, abierto ? 'Abrió el registro' : 'Cerró el registro');
  res.json({ ok: true, abierto });
});

// ==================== ADMIN: EXPORTAR EXCEL ====================

app.get('/api/admin/descargar-excel', requireAuth('admin', 'visor'), async (req, res) => {
  const registros = queryAll('SELECT * FROM registros ORDER BY fecha_registro DESC');

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Congreso Iglesias Sanas';
  const sheet = workbook.addWorksheet('Registros');

  // Estilos de encabezado
  sheet.columns = [
    { header: 'ID', key: 'id', width: 6 },
    { header: 'Nombre', key: 'nombre', width: 18 },
    { header: 'Apellidos', key: 'apellidos', width: 20 },
    { header: 'Iglesia', key: 'iglesia', width: 25 },
    { header: 'Ciudad', key: 'ciudad', width: 20 },
    { header: 'Teléfono', key: 'telefono', width: 15 },
    { header: 'Fecha Registro', key: 'fecha_registro', width: 20 },
    { header: 'Pagado', key: 'pagado', width: 10 },
    { header: 'Asistió', key: 'asistio', width: 10 },
  ];

  // Estilo encabezado
  sheet.getRow(1).eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F1729' } };
    cell.font = { bold: true, color: { argb: 'FFE8B84B' }, size: 11 };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFC9962B' } } };
  });
  sheet.getRow(1).height = 28;

  for (const r of registros) {
    sheet.addRow({
      id: r.id,
      nombre: r.nombre,
      apellidos: r.apellidos,
      iglesia: r.iglesia,
      ciudad: r.ciudad || '',
      telefono: r.telefono || '',
      fecha_registro: r.fecha_registro,
      pagado: r.pagado ? 'Sí' : 'No',
      asistio: r.asistio ? 'Sí' : 'No',
    });
  }

  // Colorear filas alternas
  sheet.eachRow((row, num) => {
    if (num > 1 && num % 2 === 0) {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAF6F0' } };
      });
    }
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=registros-congreso.xlsx');
  await workbook.xlsx.write(res);
  res.end();
});

// ==================== ADMIN: HISTORIAL ====================

app.get('/api/admin/historial', requireAuth('admin', 'visor'), (req, res) => {
  const historial = queryAll('SELECT * FROM historial ORDER BY fecha DESC LIMIT 100');
  res.json(historial);
});

// ==================== RECEPCIÓN ====================

app.get('/api/recepcion/buscar', requireAuth('admin', 'recepcion'), (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.json([]);
  }

  const busqueda = `%${q.trim()}%`;
  const registros = queryAll(
    'SELECT * FROM registros WHERE nombre LIKE ? OR apellidos LIKE ? OR telefono LIKE ? OR iglesia LIKE ? OR ciudad LIKE ? ORDER BY apellidos, nombre',
    [busqueda, busqueda, busqueda, busqueda, busqueda]
  );

  res.json(registros);
});

app.put('/api/recepcion/pago/:id', requireAuth('admin', 'recepcion'), (req, res) => {
  const { pagado, soloAsistencia, pagoYAsistencia } = req.body;
  const registro = queryOne('SELECT nombre, apellidos FROM registros WHERE id = ?', [Number(req.params.id)]);
  const nombre = registro ? `${registro.nombre} ${registro.apellidos}` : `ID ${req.params.id}`;

  if (pagoYAsistencia) {
    execute('UPDATE registros SET pagado = 1, asistio = 1 WHERE id = ?', [Number(req.params.id)]);
    registrarHistorial(req.session.user.username, 'Registró pago y asistencia', nombre);
  } else if (soloAsistencia !== undefined) {
    execute('UPDATE registros SET asistio = ? WHERE id = ?', [soloAsistencia ? 1 : 0, Number(req.params.id)]);
    registrarHistorial(req.session.user.username, soloAsistencia ? 'Marcó asistencia' : 'Desmarcó asistencia', nombre);
  } else if (pagado !== undefined) {
    if (pagado) {
      execute('UPDATE registros SET pagado = 1 WHERE id = ?', [Number(req.params.id)]);
      registrarHistorial(req.session.user.username, 'Registró pago', nombre);
    } else {
      execute('UPDATE registros SET pagado = 0 WHERE id = ?', [Number(req.params.id)]);
      registrarHistorial(req.session.user.username, 'Canceló pago', nombre);
    }
  }
  res.json({ ok: true });
});

app.put('/api/recepcion/asistencia/:id', requireAuth('admin', 'recepcion'), (req, res) => {
  const { asistio } = req.body;
  const registro = queryOne('SELECT nombre, apellidos FROM registros WHERE id = ?', [Number(req.params.id)]);
  execute('UPDATE registros SET asistio = ? WHERE id = ?', [asistio ? 1 : 0, Number(req.params.id)]);
  registrarHistorial(req.session.user.username, asistio ? 'Marcó asistencia' : 'Desmarcó asistencia', registro ? `${registro.nombre} ${registro.apellidos}` : `ID ${req.params.id}`);
  res.json({ ok: true });
});

// ==================== RECEPCIÓN: REGISTRO EN SITIO ====================

app.post('/api/recepcion/registro-sitio', requireAuth('admin', 'recepcion'), (req, res) => {
  const { nombre, apellidos, iglesia, ciudad, telefono } = req.body;

  if (!nombre || !apellidos || !iglesia || !ciudad) {
    return res.status(400).json({ error: 'Nombre, apellidos, iglesia y ciudad son obligatorios' });
  }

  const telefonoLimpio = telefono ? telefono.replace(/\D/g, '') : '';

  if (telefonoLimpio) {
    const existeTelefono = queryOne("SELECT id FROM registros WHERE telefono = ? AND telefono != ''", [telefonoLimpio]);
    if (existeTelefono) {
      return res.status(409).json({ error: 'Ya existe un registro con este número de teléfono' });
    }
  }

  try {
    execute(
      'INSERT INTO registros (nombre, apellidos, iglesia, ciudad, telefono, pagado, asistio) VALUES (?, ?, ?, ?, ?, 1, 1)',
      [nombre.trim(), apellidos.trim(), iglesia.trim(), ciudad.trim(), telefonoLimpio]
    );
    const id = lastInsertId();
    registrarHistorial(req.session.user.username, 'Registro en sitio', `${nombre.trim()} ${apellidos.trim()} - ${iglesia.trim()}`);
    res.json({ ok: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar el registro' });
  }
});

// ==================== CAMBIAR CONTRASEÑA ====================

app.put('/api/cambiar-password', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { passwordActual, passwordNueva } = req.body;

  if (!passwordNueva || passwordNueva.length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
  }

  const user = queryOne('SELECT * FROM usuarios WHERE id = ?', [req.session.user.id]);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  // Si no es cambio forzado, verificar contraseña actual
  if (!user.debe_cambiar_password) {
    if (!passwordActual || !bcrypt.compareSync(passwordActual, user.password)) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
    }
  }

  const hash = bcrypt.hashSync(passwordNueva, 10);
  execute('UPDATE usuarios SET password = ?, debe_cambiar_password = 0 WHERE id = ?', [hash, user.id]);
  registrarHistorial(user.username, 'Cambió su contraseña');

  res.json({ ok: true });
});

// ==================== RECUPERAR CONTRASEÑA ====================

app.post('/api/recuperar-password', async (req, res) => {
  const { username, correo } = req.body;

  if (!username || !correo) {
    return res.status(400).json({ error: 'Debe proporcionar el nombre de usuario y el correo electrónico' });
  }

  const user = queryOne('SELECT * FROM usuarios WHERE username = ? AND correo = ?', [username.trim(), correo.trim().toLowerCase()]);
  if (!user) {
    return res.status(404).json({ error: 'No se encontró ninguna cuenta con ese usuario y correo' });
  }

  // Generar nueva contraseña temporal
  const tempPassword = crypto.randomBytes(4).toString('hex');
  const hash = bcrypt.hashSync(tempPassword, 10);
  execute('UPDATE usuarios SET password = ?, debe_cambiar_password = 1 WHERE id = ?', [hash, user.id]);
  registrarHistorial(user.username, 'Recuperó contraseña por correo');

  const rolTexto = user.rol === 'admin' ? 'Administrador' : user.rol === 'visor' ? 'Visor' : 'Recepcionista';

  await enviarCorreo(correo.trim(), 'Recuperación de contraseña - Congreso Iglesias Sanas 2026', `
    <div style="max-width:600px;margin:0 auto;font-family:Georgia,serif;background:#faf6f0;padding:0;">
      <div style="background:#0f1729;padding:32px 24px;text-align:center;">
        <h1 style="color:#e8b84b;font-size:24px;margin:0;">Congreso Iglesias Sanas</h1>
        <p style="color:#c9962b;font-size:13px;letter-spacing:2px;margin:8px 0 0;text-transform:uppercase;">Recuperación de Contraseña</p>
      </div>
      <div style="padding:32px 28px;">
        <p style="color:#3a332c;font-size:15px;line-height:1.6;">
          Se ha solicitado la recuperación de contraseña para la cuenta <strong>${user.username}</strong> (${rolTexto}).
        </p>
        <div style="background:white;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #e5dace;text-align:center;">
          <p style="color:#a09182;font-size:13px;margin:0 0 8px;">Su nueva contraseña temporal es:</p>
          <p style="font-family:monospace;font-size:24px;font-weight:700;color:#b8860b;margin:0;letter-spacing:2px;">${tempPassword}</p>
        </div>
        <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:12px;margin:16px 0;">
          <p style="margin:0;color:#856404;font-size:13px;font-weight:600;">⚠️ Deberá cambiar su contraseña al iniciar sesión.</p>
        </div>
        <p style="color:#a09182;font-size:12px;text-align:center;">Si usted no solicitó este cambio, contacte al administrador del sistema.</p>
      </div>
    </div>
  `);

  res.json({ ok: true, message: 'Si el correo está registrado, recibirá una nueva contraseña' });
});

// ==================== SPA FALLBACK ====================
// Para React Router: cualquier ruta que no sea /api/* devuelve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(reactBuild, 'index.html'));
});

// Iniciar servidor
initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  Servidor corriendo en http://localhost:${PORT}`);
    console.log(`  Panel de registro:   http://localhost:${PORT}`);
    console.log(`  Panel de admin:      http://localhost:${PORT}/admin`);
    console.log(`  Panel de recepción:  http://localhost:${PORT}/recepcion`);
    console.log('');
    console.log('  Usuarios por defecto:');
    console.log('    Admin     -> usuario: admin      | contraseña: admin123');
    console.log('    Recepción -> usuario: recepcion  | contraseña: recepcion123');
    console.log('    (Crear usuarios Visor desde el panel de admin)\n');
  });
}).catch(err => {
  console.error('Error al inicializar la base de datos:', err);
  process.exit(1);
});
