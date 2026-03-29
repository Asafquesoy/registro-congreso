const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, 'data', 'congreso.db')
  : path.join(__dirname, 'congreso.db');

let db;

async function initDB() {
  const SQL = await initSqlJs();

  // Cargar base de datos existente o crear nueva
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Crear tablas
  db.run(`
    CREATE TABLE IF NOT EXISTS registros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      apellidos TEXT NOT NULL,
      iglesia TEXT NOT NULL,
      telefono TEXT DEFAULT '',
      correo TEXT DEFAULT '',
      taller TEXT DEFAULT '',
      ciudad TEXT DEFAULT '',
      fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
      pagado INTEGER DEFAULT 0,
      asistio INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      rol TEXT NOT NULL,
      correo TEXT DEFAULT '',
      debe_cambiar_password INTEGER DEFAULT 0
    )
  `);

  // Migrar tabla usuarios si faltan columnas
  try {
    db.run("ALTER TABLE usuarios ADD COLUMN correo TEXT DEFAULT ''");
  } catch (e) { /* columna ya existe */ }
  try {
    db.run("ALTER TABLE usuarios ADD COLUMN debe_cambiar_password INTEGER DEFAULT 0");
  } catch (e) { /* columna ya existe */ }

  // Migrar tabla registros: agregar columna ciudad
  try {
    db.run("ALTER TABLE registros ADD COLUMN ciudad TEXT DEFAULT ''");
  } catch (e) { /* columna ya existe */ }

  // Migrar tabla registros: relajar constraints (correo/taller/telefono opcionales)
  // SQLite no permite ALTER constraints, así que recreamos la tabla si tiene constraints UNIQUE en correo
  try {
    const tableInfo = db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='registros'");
    if (tableInfo.length > 0 && tableInfo[0].values[0][0].includes('correo TEXT NOT NULL UNIQUE')) {
      db.run(`CREATE TABLE IF NOT EXISTS registros_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        apellidos TEXT NOT NULL,
        iglesia TEXT NOT NULL,
        telefono TEXT DEFAULT '',
        correo TEXT DEFAULT '',
        taller TEXT DEFAULT '',
        ciudad TEXT DEFAULT '',
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        pagado INTEGER DEFAULT 0,
        asistio INTEGER DEFAULT 0
      )`);
      db.run(`INSERT INTO registros_new (id, nombre, apellidos, iglesia, telefono, correo, taller, ciudad, fecha_registro, pagado, asistio)
        SELECT id, nombre, apellidos, iglesia, telefono, correo, taller, COALESCE(ciudad, ''), fecha_registro, pagado, asistio FROM registros`);
      db.run('DROP TABLE registros');
      db.run('ALTER TABLE registros_new RENAME TO registros');
    }
  } catch (e) { console.error('Migration error:', e.message); }

  db.run(`
    CREATE TABLE IF NOT EXISTS configuracion (
      clave TEXT PRIMARY KEY,
      valor TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS historial (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT NOT NULL,
      accion TEXT NOT NULL,
      detalle TEXT,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Configuracion por defecto
  const regAbierto = db.exec("SELECT clave FROM configuracion WHERE clave = 'registro_abierto'");
  if (regAbierto.length === 0) {
    db.run("INSERT INTO configuracion (clave, valor) VALUES ('registro_abierto', '1')");
  }

  guardar();

  // Crear usuarios por defecto si no existen
  const adminCheck = db.exec("SELECT id FROM usuarios WHERE username = 'admin'");
  if (adminCheck.length === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.run("INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)", ['admin', hash, 'admin']);
  }

  const recepcionCheck = db.exec("SELECT id FROM usuarios WHERE username = 'recepcion'");
  if (recepcionCheck.length === 0) {
    const hash = bcrypt.hashSync('recepcion123', 10);
    db.run("INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)", ['recepcion', hash, 'recepcion']);
  }

  guardar();
  return db;
}

function guardar() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Helper: ejecutar SELECT y devolver array de objetos
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// Helper: ejecutar SELECT y devolver un solo objeto
function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

// Helper: ejecutar INSERT/UPDATE/DELETE
function execute(sql, params = []) {
  db.run(sql, params);
  guardar();
}

// Helper: obtener último ID insertado
function lastInsertId() {
  const result = db.exec("SELECT last_insert_rowid() as id");
  return result[0].values[0][0];
}

module.exports = { initDB, queryAll, queryOne, execute, lastInsertId, guardar };
