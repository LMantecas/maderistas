// image-optimizer.js - Optimiza automáticamente cualquier imagen
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const optimizeImage = (type) => {
  return async (req, res, next) => {
    if (!req.file) return next();

    try {
      const filePath = req.file.path;
      const extension = path.extname(req.file.originalname).toLowerCase();

      // Solo optimizar imágenes (no PDFs)
      if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension)) {
        return next();
      }

      let config = {};

      switch (type) {
        case 'profile':
          config = { width: 400, height: 400, fit: 'cover', quality: 85 };
          break;
        case 'banner':
          config = { width: 1920, height: 400, fit: 'cover', quality: 85 };
          break;
        case 'submission':
          config = { width: 1200, height: null, fit: 'inside', quality: 85 };
          break;
        default:
          return next();
      }

      const sharpInstance = sharp(filePath);
      
      if (config.height) {
        sharpInstance.resize(config.width, config.height, { fit: config.fit });
      } else {
        sharpInstance.resize(config.width, null, { fit: config.fit });
      }

      if (extension === '.png') {
        sharpInstance.png({ quality: config.quality, compressionLevel: 9 });
      } else if (extension === '.gif') {
        const newPath = filePath.replace(/\.gif$/i, '.png');
        await sharpInstance.png({ quality: config.quality }).toFile(newPath);
        fs.unlinkSync(filePath);
        req.file.path = newPath;
        req.file.filename = path.basename(newPath);
        return next();
      } else {
        sharpInstance.jpeg({ quality: config.quality, mozjpeg: true });
      }

      await sharpInstance.toFile(filePath + '.tmp');
      fs.unlinkSync(filePath);
      fs.renameSync(filePath + '.tmp', filePath);

      const newStats = fs.statSync(filePath);
      req.file.size = newStats.size;

      console.log(`✅ Optimizada: ${type} - ${(newStats.size / 1024).toFixed(0)} KB`);
      next();
    } catch (error) {
      console.error('Error optimizando:', error);
      next();
    }
  };
};

const cleanupOldSubmissions = async (pool) => {
  try {
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
      console.log(`🧹 ${cleaned} archivos eliminados`);
    }
  } catch (error) {
    console.error('Error limpieza:', error);
  }
};

module.exports = { optimizeImage, cleanupOldSubmissions };
