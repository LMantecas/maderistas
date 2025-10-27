// image-optimizer.js - Middleware para optimizar imágenes automáticamente
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Middleware para optimizar imágenes después de subirlas con Multer
 * Redimensiona y comprime automáticamente según el tipo
 */

const optimizeImage = (type) => {
  return async (req, res, next) => {
    if (!req.file) {
      return next();
    }

    try {
      const filePath = req.file.path;
      const extension = path.extname(req.file.originalname).toLowerCase();

      // Solo optimizar imágenes (no PDFs)
      if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension)) {
        return next();
      }

      let config = {};

      // Configuración según tipo de imagen
      switch (type) {
        case 'profile':
          config = {
            width: 400,
            height: 400,
            fit: 'cover',
            quality: 80,
            maxSize: 500 * 1024 // 500 KB
          };
          break;

        case 'banner':
          config = {
            width: 1920,
            height: 400,
            fit: 'cover',
            quality: 80,
            maxSize: 800 * 1024 // 800 KB
          };
          break;

        case 'submission':
          config = {
            width: 1200,
            height: null, // Mantener proporción
            fit: 'inside',
            quality: 85,
            maxSize: 2 * 1024 * 1024 // 2 MB
          };
          break;

        default:
          return next();
      }

      // Procesar imagen
      const sharpInstance = sharp(filePath);
      
      // Redimensionar
      if (config.height) {
        sharpInstance.resize(config.width, config.height, { fit: config.fit });
      } else {
        sharpInstance.resize(config.width, null, { fit: config.fit });
      }

      // Convertir a formato optimizado
      if (extension === '.png') {
        sharpInstance.png({ quality: config.quality, compressionLevel: 9 });
      } else if (extension === '.gif') {
        // GIF se convierte a PNG para mejor compresión
        const newPath = filePath.replace(/\.gif$/i, '.png');
        await sharpInstance
          .png({ quality: config.quality })
          .toFile(newPath);
        
        // Eliminar original y actualizar path
        fs.unlinkSync(filePath);
        req.file.path = newPath;
        req.file.filename = path.basename(newPath);
        return next();
      } else {
        sharpInstance.jpeg({ quality: config.quality, mozjpeg: true });
      }

      // Guardar imagen optimizada
      await sharpInstance.toFile(filePath + '.tmp');

      // Verificar tamaño
      const stats = fs.statSync(filePath + '.tmp');
      
      if (stats.size > config.maxSize) {
        // Si aún es muy grande, reducir más la calidad
        const newQuality = Math.floor(config.quality * (config.maxSize / stats.size));
        
        if (extension === '.png') {
          await sharp(filePath)
            .resize(config.width, config.height, { fit: config.fit })
            .png({ quality: Math.max(newQuality, 50) })
            .toFile(filePath + '.tmp2');
        } else {
          await sharp(filePath)
            .resize(config.width, config.height, { fit: config.fit })
            .jpeg({ quality: Math.max(newQuality, 50), mozjpeg: true })
            .toFile(filePath + '.tmp2');
        }
        
        fs.unlinkSync(filePath + '.tmp');
        fs.renameSync(filePath + '.tmp2', filePath + '.tmp');
      }

      // Reemplazar archivo original con el optimizado
      fs.unlinkSync(filePath);
      fs.renameSync(filePath + '.tmp', filePath);

      // Actualizar información del archivo
      const newStats = fs.statSync(filePath);
      req.file.size = newStats.size;

      console.log(`✅ Imagen optimizada: ${type} - ${(newStats.size / 1024).toFixed(0)} KB`);
      
      next();
    } catch (error) {
      console.error('Error al optimizar imagen:', error);
      // Si falla la optimización, continuar con la imagen original
      next();
    }
  };
};

// Función para limpiar archivos temporales de evidencias aprobadas/rechazadas
const cleanupOldSubmissions = async (pool) => {
  try {
    // Obtener archivos de envíos antiguos (más de 30 días y ya revisados)
    const result = await pool.query(`
      SELECT file_path FROM submissions 
      WHERE status IN ('approved', 'rejected') 
      AND reviewed_at < NOW() - INTERVAL '30 days'
      AND file_path IS NOT NULL
    `);

    let cleaned = 0;
    for (const submission of result.rows) {
      const filePath = path.join(__dirname, submission.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Limpieza automática: ${cleaned} archivos eliminados`);
    }
  } catch (error) {
    console.error('Error en limpieza automática:', error);
  }
};

module.exports = {
  optimizeImage,
  cleanupOldSubmissions
};
