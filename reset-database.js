// reset-database.js - Limpia y recrea todas las tablas
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function resetDatabase() {
  try {
    console.log('🔄 Eliminando tablas antiguas...');
    
    // Eliminar tablas en orden (por las foreign keys)
    await pool.query('DROP TABLE IF EXISTS submissions CASCADE');
    await pool.query('DROP TABLE IF EXISTS contact_messages CASCADE');
    await pool.query('DROP TABLE IF EXISTS settings CASCADE');
    await pool.query('DROP TABLE IF EXISTS rewards CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');
    
    console.log('✅ Tablas eliminadas');
    console.log('🔄 Creando tablas nuevas...');
    
    // Crear tabla de usuarios
    await pool.query(`
      CREATE TABLE users (
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
    
    // Crear tabla de recompensas
    await pool.query(`
      CREATE TABLE rewards (
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
    
    // Crear tabla de envíos
    await pool.query(`
      CREATE TABLE submissions (
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
    
    // Crear tabla de mensajes
    await pool.query(`
      CREATE TABLE contact_messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        subject TEXT NOT NULL,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    
    // Crear tabla de configuración
    await pool.query(`
      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
    
    console.log('✅ Tablas creadas correctamente');
    
    // Crear usuario admin
    const bcrypt = require('bcrypt');
    const adminPassword = await bcrypt.hash('admin123', 10);
    await pool.query(`
      INSERT INTO users (username, password, name, email, is_admin) 
      VALUES ($1, $2, $3, $4, $5)
    `, ['admin', adminPassword, 'Administrador', 'admin@loyalty.com', true]);
    
    console.log('✅ Usuario admin creado: admin@loyalty.com / admin123');
    console.log('');
    console.log('🎉 Base de datos reiniciada exitosamente');
    console.log('');
    console.log('Ahora ejecuta: npm start');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

resetDatabase();
