/**
 * Dataset buffer cache backed by Redis.
 * Shared across server and worker processes via the existing Redis instance.
 * Key: "dataset:u{userId}_d{datasetId}" → base64-encoded CSV buffer
 * TTL: 24 hours (matches a typical session lifetime)
 */
const { connection } = require('../config/redis.config');

const TTL_SECONDS = 24 * 60 * 60;
const _key = (userId, datasetId) => `dataset:u${userId}_d${datasetId}`;

const set = async (userId, datasetId, file) => {
  const payload = JSON.stringify({
    buffer: file.buffer.toString('base64'),
    originalname: file.originalname,
    mimetype: file.mimetype,
  });
  await connection.set(_key(userId, datasetId), payload, 'EX', TTL_SECONDS);
};

const get = async (userId, datasetId) => {
  const raw = await connection.get(_key(userId, datasetId));
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  return {
    buffer: Buffer.from(parsed.buffer, 'base64'),
    originalname: parsed.originalname,
    mimetype: parsed.mimetype,
  };
};

const remove = async (userId, datasetId) => {
  await connection.del(_key(userId, datasetId));
};

module.exports = { set, get, remove };
