const pool = require('../Database/db');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

const ML_SERVICE_ROOT = process.env.ML_SERVICE_PATH
  ? path.resolve(process.env.ML_SERVICE_PATH)
  : path.resolve(__dirname, '..', '..', 'MLService', 'app');

/**
 * Delete expired models (older than 5 days)
 * Called by BullMQ repeatable job every hour
 */
const deleteExpiredModels = async () => {
  const connection = await pool.getConnection();
  try {
    // Find all expired models
    const [expiredModels] = await connection.execute(
      `SELECT id, model_name, model_path, experiment_id, user_id 
       FROM trained_models 
       WHERE expires_at IS NOT NULL AND expires_at <= NOW()`
    );

    if (expiredModels.length === 0) {
      logger.info('[CLEANUP]', 'No expired models found');
      return { deleted: 0, failed: 0 };
    }

    logger.info('[CLEANUP]', `Found ${expiredModels.length} expired models to delete`);

    let deleted = 0;
    let failed = 0;

    for (const model of expiredModels) {
      try {
        await connection.beginTransaction();

        // Delete model file from storage
        if (model.model_path) {
          const fullPath = path.isAbsolute(model.model_path)
            ? model.model_path
            : path.resolve(ML_SERVICE_ROOT, model.model_path);

          try {
            await fs.unlink(fullPath);
            logger.info('[CLEANUP]', `Deleted model file: ${fullPath}`);
          } catch (fileErr) {
            logger.warn('[CLEANUP]', `Model file not found or already deleted: ${fullPath}`);
          }
        }

        // Delete from database (cascade will delete from model_plots)
        await connection.execute('DELETE FROM trained_models WHERE id = ?', [model.id]);

        await connection.commit();
        deleted++;
        
        logger.info('[CLEANUP]', `Deleted expired model`, {
          id: model.id,
          name: model.model_name,
          experiment_id: model.experiment_id,
        });
      } catch (error) {
        await connection.rollback();
        failed++;
        logger.error('[CLEANUP]', `Failed to delete model ${model.id}`, {
          error: error.message,
          model: model.model_name,
        });
      }
    }

    logger.info('[CLEANUP]', `Cleanup completed: ${deleted} deleted, ${failed} failed`);
    return { deleted, failed, total: expiredModels.length };
  } catch (error) {
    logger.error('[CLEANUP]', 'Cleanup job failed', { error: error.message });
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Get models expiring soon (within 24 hours)
 */
const getExpiringModels = async (userId = null) => {
  let query = `SELECT id, model_name, experiment_id, expires_at 
               FROM trained_models 
               WHERE expires_at IS NOT NULL 
               AND expires_at > NOW() 
               AND expires_at <= DATE_ADD(NOW(), INTERVAL 24 HOUR)`;
  const params = [];
  
  if (userId) {
    query += ' AND user_id = ?';
    params.push(userId);
  }
  
  const [rows] = await pool.execute(query, params);
  return rows;
};

module.exports = {
  deleteExpiredModels,
  getExpiringModels,
};
