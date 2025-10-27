// server.js - Backend del Programa de Lealtad con PostgreSQL
// Instalar dependencias: npm install express pg multer bcrypt jsonwebtoken cors dotenv

const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'tu-secreto-super-seguro-cambialo';

// Configurar PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL',
    version: '1.0.1'
  });
});

// Crear carpetas necesarias
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
if (!fs.existsSync('uploads/profiles')) fs.mkdirSync('uploads/profiles');
if (!fs.existsSync('uploads/submissions')) fs.mkdirSync('uploads/submissions');
if (!fs.existsSync('uploads/banners')) fs.mkdirSync('uploads/banners');

// Configuración de Multer para archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.path.includes('profile') ? 'uploads/profiles' : 
                   req.path.includes('banner') ? 'uploads/banners' : 
                   'uploads/submissions';
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Solo se permiten imágenes (JPEG, PNG, GIF) o PDF'));
  }
});

// Inicializar Base de Datos PostgreSQL
const initDatabase = async () => {
  try {
    console.log('🔄 Inicializando base de datos PostgreSQL...');
    
    // Tabla de usuarios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        photo TEXT,
        points INTEGER DEFAULT 0,
        is_admin BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de recompensas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rewards (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        how_to_redeem TEXT NOT NULL,
        points INTEGER NOT NULL,
        redeem_type TEXT DEFAULT 'unlimited',
        is_active BOOLEAN DEFAULT true,
        is_suspended BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de envíos/submissions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        reward_id INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        rejection_reason TEXT,
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (reward_id) REFERENCES rewards(id)
      )
    `);

    // Tabla de mensajes de contacto
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        subject TEXT NOT NULL,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Tabla de configuración
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // Crear usuario admin por defecto
    const adminPassword = await bcrypt.hash('admin123', 10);
    await pool.query(`
      INSERT INTO users (username, password, name, email, is_admin) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (username) DO NOTHING
    `, ['admin', adminPassword, 'Administrador', 'admin@loyalty.com', true]);

    console.log('✅ Base de datos PostgreSQL inicializada correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar BD:', error.message);
    process.exit(1);
  }
};

initDatabase();

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};

// Middleware para verificar admin
const isAdmin = (req, res, next) => {
  if (!req.user.is_admin) return res.status(403).json({ error: 'Acceso denegado' });
  next();
};

// ==================== RUTAS DE AUTENTICACIÓN ====================

// Registro
app.post('/api/auth/register', upload.single('photo'), async (req, res) => {
  try {
    const { username, password, name, email } = req.body;
    const photo = req.file ? `/uploads/profiles/${req.file.filename}` : null;

    const existing = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Usuario o email ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (username, password, name, email, photo) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [username, hashedPassword, name, email, photo]
    );

    res.json({ message: 'Usuario creado exitosamente', userId: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) return res.status(400).json({ error: 'Email o contraseña incorrectos' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Email o contraseña incorrectos' });

    const token = jwt.sign(
      { id: user.id, username: user.username, is_admin: user.is_admin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        photo: user.photo,
        points: user.points,
        is_admin: user.is_admin
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener perfil del usuario
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, name, email, photo, points, is_admin FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RUTAS DE RECOMPENSAS ====================

// Obtener todas las recompensas activas y no suspendidas
app.get('/api/rewards', async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    let userId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (err) {}
    }

    const result = await pool.query(
      'SELECT * FROM rewards WHERE is_active = true AND is_suspended = false ORDER BY created_at DESC'
    );

    if (!userId) {
      return res.json(result.rows);
    }

    // Incluir estado de usuario
    const rewardsWithStatus = await Promise.all(
      result.rows.map(async (reward) => {
        const submissionResult = await pool.query(
          `SELECT status FROM submissions 
           WHERE user_id = $1 AND reward_id = $2 
           ORDER BY created_at DESC LIMIT 1`,
          [userId, reward.id]
        );
        
        return {
          ...reward,
          userStatus: submissionResult.rows[0]?.status || null
        };
      })
    );

    res.json(rewardsWithStatus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener detalle de una recompensa específica
app.get('/api/rewards/:id', async (req, res) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    let userId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (err) {}
    }

    const rewardResult = await pool.query(
      'SELECT * FROM rewards WHERE id = $1 AND is_active = true',
      [req.params.id]
    );

    if (rewardResult.rows.length === 0) {
      return res.status(404).json({ error: 'Recompensa no encontrada' });
    }

    const reward = rewardResult.rows[0];

    if (!userId) {
      return res.json(reward);
    }

    const submissionResult = await pool.query(
      `SELECT status FROM submissions 
       WHERE user_id = $1 AND reward_id = $2 
       ORDER BY created_at DESC LIMIT 1`,
      [userId, reward.id]
    );

    const submission = submissionResult.rows[0];
    let canRedeem = true;
    let userStatus = submission?.status || null;

    if (reward.redeem_type === 'once' && submission?.status === 'approved') {
      canRedeem = false;
    }

    if (submission?.status === 'pending') {
      canRedeem = false;
    }

    res.json({ ...reward, userStatus, canRedeem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear recompensa (solo admin)
app.post('/api/rewards', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { title, description, how_to_redeem, points, redeem_type } = req.body;
    
    const result = await pool.query(
      'INSERT INTO rewards (title, description, how_to_redeem, points, redeem_type) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [title, description, how_to_redeem, points, redeem_type || 'unlimited']
    );

    res.json({ message: 'Recompensa creada', id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar recompensa (solo admin)
app.put('/api/rewards/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { title, description, how_to_redeem, points, redeem_type } = req.body;
    
    await pool.query(
      'UPDATE rewards SET title = $1, description = $2, how_to_redeem = $3, points = $4, redeem_type = $5 WHERE id = $6',
      [title, description, how_to_redeem, points, redeem_type, req.params.id]
    );

    res.json({ message: 'Recompensa actualizada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar recompensa (solo admin)
app.delete('/api/rewards/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await pool.query('UPDATE rewards SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ message: 'Recompensa eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Suspender/Reactivar recompensa (solo admin)
app.patch('/api/rewards/:id/suspend', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { is_suspended } = req.body;
    
    await pool.query(
      'UPDATE rewards SET is_suspended = $1 WHERE id = $2',
      [is_suspended, req.params.id]
    );

    res.json({ message: is_suspended ? 'Recompensa suspendida' : 'Recompensa reactivada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener todas las recompensas para admin (incluyendo suspendidas)
app.get('/api/rewards/admin/all', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM rewards WHERE is_active = true ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RUTAS DE ENVÍOS/SUBMISSIONS ====================

// Enviar evidencia para una recompensa
app.post('/api/submissions', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { reward_id } = req.body;
    const file_path = `/uploads/submissions/${req.file.filename}`;

    const rewardResult = await pool.query(
      'SELECT redeem_type FROM rewards WHERE id = $1',
      [reward_id]
    );

    if (rewardResult.rows.length === 0) {
      return res.status(404).json({ error: 'Recompensa no encontrada' });
    }

    const reward = rewardResult.rows[0];

    const lastSubmissionResult = await pool.query(
      `SELECT status FROM submissions 
       WHERE user_id = $1 AND reward_id = $2 
       ORDER BY created_at DESC LIMIT 1`,
      [req.user.id, reward_id]
    );

    const lastSubmission = lastSubmissionResult.rows[0];

    if (lastSubmission?.status === 'pending') {
      return res.status(400).json({ error: 'Ya tienes una solicitud pendiente para esta recompensa' });
    }

    if (reward.redeem_type === 'once' && lastSubmission?.status === 'approved') {
      return res.status(400).json({ error: 'Esta recompensa solo se puede redimir una vez y ya la completaste' });
    }

    const result = await pool.query(
      'INSERT INTO submissions (user_id, reward_id, file_path) VALUES ($1, $2, $3) RETURNING id',
      [req.user.id, reward_id, file_path]
    );

    res.json({ message: 'Evidencia enviada para revisión', id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener envíos del usuario
app.get('/api/submissions/my', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, r.title as reward_title, r.points 
       FROM submissions s 
       JOIN rewards r ON s.reward_id = r.id 
       WHERE s.user_id = $1 
       ORDER BY s.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener envíos pendientes (solo admin)
app.get('/api/submissions/pending', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.username, u.name, r.title as reward_title, r.points 
       FROM submissions s 
       JOIN users u ON s.user_id = u.id 
       JOIN rewards r ON s.reward_id = r.id 
       WHERE s.status = 'pending' 
       ORDER BY s.created_at ASC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Aprobar envío (solo admin)
app.post('/api/submissions/:id/approve', authenticateToken, isAdmin, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const submissionResult = await client.query(
      'SELECT * FROM submissions WHERE id = $1',
      [req.params.id]
    );

    if (submissionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Envío no encontrado' });
    }

    const submission = submissionResult.rows[0];

    const rewardResult = await client.query(
      'SELECT points FROM rewards WHERE id = $1',
      [submission.reward_id]
    );

    const reward = rewardResult.rows[0];

    await client.query(
      `UPDATE submissions SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [req.params.id]
    );

    await client.query(
      'UPDATE users SET points = points + $1 WHERE id = $2',
      [reward.points, submission.user_id]
    );

    if (submission.file_path) {
      const filePath = path.join(__dirname, submission.file_path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await client.query('COMMIT');
    res.json({ message: 'Envío aprobado y puntos otorgados' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Rechazar envío (solo admin)
app.post('/api/submissions/:id/reject', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { reason } = req.body;

    const submissionResult = await pool.query(
      'SELECT file_path FROM submissions WHERE id = $1',
      [req.params.id]
    );

    if (submissionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Envío no encontrado' });
    }

    const submission = submissionResult.rows[0];

    await pool.query(
      `UPDATE submissions SET status = 'rejected', rejection_reason = $1, reviewed_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [reason, req.params.id]
    );

    if (submission.file_path) {
      const filePath = path.join(__dirname, submission.file_path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    res.json({ message: 'Envío rechazado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RUTAS DE RANKING ====================

// Obtener ranking de usuarios
app.get('/api/ranking', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, name, photo, points 
       FROM users 
       WHERE is_admin = false 
       ORDER BY points DESC, created_at ASC`
    );

    const ranking = result.rows.map((user, index) => ({
      ...user,
      position: index + 1
    }));

    res.json(ranking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RUTAS DE CONTACTO ====================

// Enviar mensaje de contacto
app.post('/api/contact', authenticateToken, async (req, res) => {
  try {
    const { subject, type, message } = req.body;
    
    const result = await pool.query(
      'INSERT INTO contact_messages (user_id, subject, type, message) VALUES ($1, $2, $3, $4) RETURNING id',
      [req.user.id, subject, type, message]
    );

    res.json({ message: 'Mensaje enviado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener mensajes de contacto (solo admin)
app.get('/api/contact', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.username, u.name, u.email 
       FROM contact_messages c 
       LEFT JOIN users u ON c.user_id = u.id 
       ORDER BY c.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== RUTAS DE CONFIGURACIÓN ====================

// Guardar configuración de colores
app.post('/api/settings/colors', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { primary_color, secondary_color } = req.body;
    
    await pool.query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
      ['primary_color', primary_color]
    );
    
    await pool.query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
      ['secondary_color', secondary_color]
    );

    res.json({ message: 'Colores actualizados' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener configuración de colores
app.get('/api/settings/colors', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT key, value FROM settings WHERE key IN ($1, $2)`,
      ['primary_color', 'secondary_color']
    );

    const colors = {};
    result.rows.forEach(row => colors[row.key] = row.value);
    res.json(colors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Guardar banner
app.post('/api/settings/banner', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const { url } = req.body;
    const image_path = req.file ? `/uploads/banners/${req.file.filename}` : null;
    
    const bannerData = JSON.stringify({ image_path, url });
    
    await pool.query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
      ['banner', bannerData]
    );

    res.json({ message: 'Banner actualizado', image_path });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener banner
app.get('/api/settings/banner', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT value FROM settings WHERE key = $1',
      ['banner']
    );

    res.json(result.rows[0] ? JSON.parse(result.rows[0].value) : null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener lista de usuarios (solo admin)
app.get('/api/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, name, email, points, is_admin, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== INICIAR SERVIDOR ====================

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Base de datos: PostgreSQL`);
  console.log(`👤 Usuario admin: admin@loyalty.com / admin123`);
  console.log(`✅ Listo para recibir peticiones`);
});
