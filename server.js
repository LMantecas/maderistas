// server.js - Backend del Programa de Lealtad
// Instalar dependencias: npm install express sqlite3 multer bcrypt jsonwebtoken cors dotenv

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
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

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

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

// Inicializar Base de Datos SQLite
const db = new sqlite3.Database('./loyalty.db', (err) => {
  if (err) console.error('Error al conectar con la BD:', err);
  else console.log('✅ Conectado a SQLite');
});

// Crear tablas
db.serialize(() => {
  // Tabla de usuarios
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    photo TEXT,
    points INTEGER DEFAULT 0,
    is_admin BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tabla de recompensas CON redeem_type y is_suspended
  db.run(`CREATE TABLE IF NOT EXISTS rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    how_to_redeem TEXT NOT NULL,
    points INTEGER NOT NULL,
    redeem_type TEXT DEFAULT 'unlimited',
    is_active BOOLEAN DEFAULT 1,
    is_suspended BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tabla de envíos/submissions
  db.run(`CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    reward_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    rejection_reason TEXT,
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reward_id) REFERENCES rewards(id)
  )`);

  // Tabla de mensajes de contacto
  db.run(`CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    subject TEXT NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // Tabla de configuración (colores, banner, etc)
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`);

  // Crear usuario admin por defecto con EMAIL
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT OR IGNORE INTO users (username, password, name, email, is_admin) 
          VALUES ('admin', ?, 'Administrador', 'admin@loyalty.com', 1)`, [adminPassword]);
});

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

    // Validar que el usuario no exista
    db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], async (err, row) => {
      if (row) return res.status(400).json({ error: 'Usuario o email ya existe' });

      const hashedPassword = await bcrypt.hash(password, 10);
      
      db.run(`INSERT INTO users (username, password, name, email, photo) VALUES (?, ?, ?, ?, ?)`,
        [username, hashedPassword, name, email, photo],
        function(err) {
          if (err) return res.status(500).json({ error: 'Error al crear usuario' });
          res.json({ message: 'Usuario creado exitosamente', userId: this.lastID });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login - CAMBIADO PARA USAR EMAIL
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
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
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener perfil del usuario
app.get('/api/auth/me', authenticateToken, (req, res) => {
  db.get('SELECT id, username, name, email, photo, points, is_admin FROM users WHERE id = ?', 
    [req.user.id], (err, user) => {
      if (err || !user) return res.status(404).json({ error: 'Usuario no encontrado' });
      res.json(user);
    }
  );
});

// ==================== RUTAS DE RECOMPENSAS ====================

// Obtener todas las recompensas activas Y NO SUSPENDIDAS (PÚBLICO)
app.get('/api/rewards', (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  let userId = null;

  // Verificar si hay usuario autenticado
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
    } catch (err) {
      // Token inválido, continuar sin userId
    }
  }

  db.all('SELECT * FROM rewards WHERE is_active = 1 AND is_suspended = 0 ORDER BY created_at DESC', (err, rewards) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (!userId) {
      return res.json(rewards);
    }

    // Si hay usuario, incluir el estado de cada recompensa
    const rewardsWithStatus = [];
    let processed = 0;

    if (rewards.length === 0) {
      return res.json([]);
    }

    rewards.forEach(reward => {
      db.get(`SELECT status FROM submissions 
              WHERE user_id = ? AND reward_id = ? 
              ORDER BY created_at DESC LIMIT 1`,
        [userId, reward.id],
        (err, submission) => {
          rewardsWithStatus.push({
            ...reward,
            userStatus: submission ? submission.status : null
          });
          processed++;
          if (processed === rewards.length) {
            res.json(rewardsWithStatus);
          }
        }
      );
    });
  });
});

// Obtener detalle de una recompensa específica (PÚBLICO CON INFO DE USUARIO)
app.get('/api/rewards/:id', (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  let userId = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
    } catch (err) {
      // Token inválido, continuar sin userId
    }
  }

  db.get('SELECT * FROM rewards WHERE id = ? AND is_active = 1', [req.params.id], (err, reward) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!reward) return res.status(404).json({ error: 'Recompensa no encontrada' });

    if (!userId) {
      return res.json(reward);
    }

    // Si hay usuario, incluir el estado y si puede redimir
    db.get(`SELECT status FROM submissions 
            WHERE user_id = ? AND reward_id = ? 
            ORDER BY created_at DESC LIMIT 1`,
      [userId, reward.id],
      (err, submission) => {
        let canRedeem = true;
        let userStatus = submission ? submission.status : null;

        // Si es de una sola vez y ya fue aprobada, no puede redimir
        if (reward.redeem_type === 'once' && submission && submission.status === 'approved') {
          canRedeem = false;
        }

        // Si hay una solicitud pendiente, no puede redimir hasta que se resuelva
        if (submission && submission.status === 'pending') {
          canRedeem = false;
        }

        res.json({
          ...reward,
          userStatus,
          canRedeem
        });
      }
    );
  });
});

// Crear recompensa (solo admin)
app.post('/api/rewards', authenticateToken, isAdmin, (req, res) => {
  const { title, description, how_to_redeem, points, redeem_type } = req.body;
  
  db.run(`INSERT INTO rewards (title, description, how_to_redeem, points, redeem_type) VALUES (?, ?, ?, ?, ?)`,
    [title, description, how_to_redeem, points, redeem_type || 'unlimited'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Recompensa creada', id: this.lastID });
    }
  );
});

// Actualizar recompensa (solo admin) - SIN RESTRICCIÓN
app.put('/api/rewards/:id', authenticateToken, isAdmin, (req, res) => {
  const { title, description, how_to_redeem, points, redeem_type } = req.body;
  
  db.run(`UPDATE rewards SET title = ?, description = ?, how_to_redeem = ?, points = ?, redeem_type = ? WHERE id = ?`,
    [title, description, how_to_redeem, points, redeem_type, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Recompensa actualizada' });
    }
  );
});

// Eliminar recompensa (solo admin)
app.delete('/api/rewards/:id', authenticateToken, isAdmin, (req, res) => {
  db.run('UPDATE rewards SET is_active = 0 WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Recompensa eliminada' });
  });
});

// Suspender/Reactivar recompensa (solo admin)
app.patch('/api/rewards/:id/suspend', authenticateToken, isAdmin, (req, res) => {
  const { is_suspended } = req.body;
  
  db.run('UPDATE rewards SET is_suspended = ? WHERE id = ?', [is_suspended ? 1 : 0, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: is_suspended ? 'Recompensa suspendida' : 'Recompensa reactivada' });
  });
});

// Obtener todas las recompensas para admin (incluyendo suspendidas)
app.get('/api/rewards/admin/all', authenticateToken, isAdmin, (req, res) => {
  db.all('SELECT * FROM rewards WHERE is_active = 1 ORDER BY created_at DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ==================== RUTAS DE ENVÍOS/SUBMISSIONS ====================

// Enviar evidencia para una recompensa CON VALIDACIÓN DE TIPO
app.post('/api/submissions', authenticateToken, upload.single('file'), (req, res) => {
  const { reward_id } = req.body;
  const file_path = `/uploads/submissions/${req.file.filename}`;

  // Verificar si puede redimir
  db.get('SELECT redeem_type FROM rewards WHERE id = ?', [reward_id], (err, reward) => {
    if (err || !reward) return res.status(404).json({ error: 'Recompensa no encontrada' });

    db.get(`SELECT status FROM submissions 
            WHERE user_id = ? AND reward_id = ? 
            ORDER BY created_at DESC LIMIT 1`,
      [req.user.id, reward_id],
      (err, lastSubmission) => {
        // Verificar si ya tiene una pendiente
        if (lastSubmission && lastSubmission.status === 'pending') {
          return res.status(400).json({ error: 'Ya tienes una solicitud pendiente para esta recompensa' });
        }

        // Verificar si es de una sola vez y ya fue aprobada
        if (reward.redeem_type === 'once' && lastSubmission && lastSubmission.status === 'approved') {
          return res.status(400).json({ error: 'Esta recompensa solo se puede redimir una vez y ya la completaste' });
        }

        // Crear el envío
        db.run(`INSERT INTO submissions (user_id, reward_id, file_path) VALUES (?, ?, ?)`,
          [req.user.id, reward_id, file_path],
          function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Evidencia enviada para revisión', id: this.lastID });
          }
        );
      }
    );
  });
});

// Obtener envíos del usuario
app.get('/api/submissions/my', authenticateToken, (req, res) => {
  db.all(`SELECT s.*, r.title as reward_title, r.points 
          FROM submissions s 
          JOIN rewards r ON s.reward_id = r.id 
          WHERE s.user_id = ? 
          ORDER BY s.created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Obtener envíos pendientes (solo admin)
app.get('/api/submissions/pending', authenticateToken, isAdmin, (req, res) => {
  db.all(`SELECT s.*, u.username, u.name, r.title as reward_title, r.points 
          FROM submissions s 
          JOIN users u ON s.user_id = u.id 
          JOIN rewards r ON s.reward_id = r.id 
          WHERE s.status = 'pending' 
          ORDER BY s.created_at ASC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Aprobar envío (solo admin)
app.post('/api/submissions/:id/approve', authenticateToken, isAdmin, (req, res) => {
  const submissionId = req.params.id;

  db.get('SELECT * FROM submissions WHERE id = ?', [submissionId], (err, submission) => {
    if (!submission) return res.status(404).json({ error: 'Envío no encontrado' });

    db.get('SELECT points FROM rewards WHERE id = ?', [submission.reward_id], (err, reward) => {
      db.run('BEGIN TRANSACTION');
      
      // Actualizar estado del envío
      db.run(`UPDATE submissions SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [submissionId]);
      
      // Añadir puntos al usuario
      db.run('UPDATE users SET points = points + ? WHERE id = ?',
        [reward.points, submission.user_id]);
      
      // Eliminar archivo
      if (submission.file_path) {
        const filePath = path.join(__dirname, submission.file_path);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      db.run('COMMIT', (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Envío aprobado y puntos otorgados' });
      });
    });
  });
});

// Rechazar envío (solo admin)
app.post('/api/submissions/:id/reject', authenticateToken, isAdmin, (req, res) => {
  const { reason } = req.body;
  const submissionId = req.params.id;

  db.get('SELECT file_path FROM submissions WHERE id = ?', [submissionId], (err, submission) => {
    if (!submission) return res.status(404).json({ error: 'Envío no encontrado' });

    db.run(`UPDATE submissions SET status = 'rejected', rejection_reason = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [reason, submissionId], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Eliminar archivo
        if (submission.file_path) {
          const filePath = path.join(__dirname, submission.file_path);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        res.json({ message: 'Envío rechazado' });
      }
    );
  });
});

// ==================== RUTAS DE RANKING ====================

// Obtener ranking de usuarios
app.get('/api/ranking', (req, res) => {
  db.all(`SELECT id, username, name, photo, points 
          FROM users 
          WHERE is_admin = 0 
          ORDER BY points DESC, created_at ASC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const ranking = rows.map((user, index) => ({
        ...user,
        position: index + 1
      }));
      
      res.json(ranking);
    }
  );
});

// ==================== RUTAS DE CONTACTO ====================

// Enviar mensaje de contacto
app.post('/api/contact', authenticateToken, (req, res) => {
  const { subject, type, message } = req.body;
  
  db.run(`INSERT INTO contact_messages (user_id, subject, type, message) VALUES (?, ?, ?, ?)`,
    [req.user.id, subject, type, message],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Mensaje enviado exitosamente' });
    }
  );
});

// Obtener mensajes de contacto (solo admin)
app.get('/api/contact', authenticateToken, isAdmin, (req, res) => {
  db.all(`SELECT c.*, u.username, u.name, u.email 
          FROM contact_messages c 
          LEFT JOIN users u ON c.user_id = u.id 
          ORDER BY c.created_at DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// ==================== RUTAS DE CONFIGURACIÓN ====================

// Guardar configuración de colores
app.post('/api/settings/colors', authenticateToken, isAdmin, (req, res) => {
  const { primary_color, secondary_color } = req.body;
  
  db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', 
    ['primary_color', primary_color]);
  db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', 
    ['secondary_color', secondary_color], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Colores actualizados' });
    }
  );
});

// Obtener configuración de colores
app.get('/api/settings/colors', (req, res) => {
  db.all('SELECT key, value FROM settings WHERE key IN (?, ?)', 
    ['primary_color', 'secondary_color'], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const colors = {};
      rows.forEach(row => colors[row.key] = row.value);
      res.json(colors);
    }
  );
});

// Guardar banner
app.post('/api/settings/banner', authenticateToken, isAdmin, upload.single('image'), (req, res) => {
  const { url } = req.body;
  const image_path = req.file ? `/uploads/banners/${req.file.filename}` : null;
  
  const bannerData = JSON.stringify({ image_path, url });
  
  db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', 
    ['banner', bannerData], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Banner actualizado', image_path });
    }
  );
});

// Obtener banner
app.get('/api/settings/banner', (req, res) => {
  db.get('SELECT value FROM settings WHERE key = ?', ['banner'], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row ? JSON.parse(row.value) : null);
  });
});

// Obtener lista de usuarios (solo admin)
app.get('/api/users', authenticateToken, isAdmin, (req, res) => {
  db.all('SELECT id, username, name, email, points, is_admin, created_at FROM users ORDER BY created_at DESC',
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// ==================== INICIAR SERVIDOR ====================

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Base de datos: SQLite (loyalty.db)`);
  console.log(`👤 Usuario admin por defecto: admin@loyalty.com / admin123`);
  console.log(`✅ VERSIÓN ACTUALIZADA: Con suspender recompensas y saltos de línea`);
});