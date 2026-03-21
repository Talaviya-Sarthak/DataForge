/**
 * Structured logger — replaces console.log spam.
 * Usage: logger.info('[QUEUE]', 'Job added', { jobId })
 */

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LEVELS[LOG_LEVEL] ?? LEVELS.info;

const fmt = (level, tag, msg, meta) => {
    const ts = new Date().toISOString();
    const base = `${ts} [${level.toUpperCase()}] ${tag} ${msg}`;
    return meta ? `${base} ${JSON.stringify(meta)}` : base;
};

const logger = {
    error: (tag, msg, meta) => {
        if (currentLevel >= LEVELS.error) console.error(fmt('error', tag, msg, meta));
    },
    warn: (tag, msg, meta) => {
        if (currentLevel >= LEVELS.warn) console.warn(fmt('warn', tag, msg, meta));
    },
    info: (tag, msg, meta) => {
        if (currentLevel >= LEVELS.info) console.log(fmt('info', tag, msg, meta));
    },
    debug: (tag, msg, meta) => {
        if (currentLevel >= LEVELS.debug) console.log(fmt('debug', tag, msg, meta));
    },
};

module.exports = logger;
