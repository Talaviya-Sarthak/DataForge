const axios = require('axios');
const logger = require('../utils/logger');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL;

// ── Shared helper: timed axios call with structured logs ──────────────────────
async function mlCall(tag, method, url, data, config = {}) {
    logger.info('[ML]', `→ ${method.toUpperCase()} ${url}`, data
        ? { payload_keys: Object.keys(data) }
        : undefined
    );
    const start = Date.now();
    try {
        const response = method === 'get'
            ? await axios.get(url, config)
            : await axios.post(url, data, { headers: { 'Content-Type': 'application/json' }, ...config });
        logger.info('[ML]', `← ${method.toUpperCase()} ${url} — ${Date.now() - start}ms [${response.status}]`);
        return response;
    } catch (error) {
        logger.error('[ML]', `✗ ${method.toUpperCase()} ${url} — ${Date.now() - start}ms`, {
            status: error.response?.status,
            error:  error.response?.data?.detail || error.message,
            code:   error.code,
        });
        if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
            throw new Error(`ML Service not reachable at ${ML_SERVICE_URL}. Please ensure it's running.`);
        }
        throw new Error(error.response?.data?.detail || error.message);
    }
}

// ── 1. UPLOAD ─────────────────────────────────────────────────────────────────
exports.uploadDataset = async (file, userId, datasetId = 0) => {
    if (!ML_SERVICE_URL) throw new Error('ML_SERVICE_URL not configured in environment variables');

    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', file.buffer, file.originalname);
    formData.append('user_id', String(userId));
    formData.append('dataset_id', String(datasetId));

    const url = `${ML_SERVICE_URL}/api/data/upload`;
    logger.info('[ML]', `→ POST ${url}`, { user_id: userId, dataset_id: datasetId, file: file.originalname });
    const start = Date.now();
    try {
        const response = await axios.post(url, formData, { headers: formData.getHeaders() });
        logger.info('[ML]', `← POST ${url} — ${Date.now() - start}ms [${response.status}]`);
        const data = response.data;
        data.numerical_columns  = Array.isArray(data.numerical_columns)  ? data.numerical_columns  : [];
        data.categorical_columns = Array.isArray(data.categorical_columns) ? data.categorical_columns : [];
        return data;
    } catch (error) {
        logger.error('[ML]', `✗ POST ${url} — ${Date.now() - start}ms`, { error: error.message });
        if (error.code === 'ECONNREFUSED') throw new Error(`ML Service not reachable at ${ML_SERVICE_URL}.`);
        throw new Error(error.response?.data?.detail || error.message);
    }
};

// ── 2. PREPROCESS ─────────────────────────────────────────────────────────────
exports.preprocessDataset = async (payload, userId) => {
    payload.user_id = userId;
    if (payload.steps && Array.isArray(payload.steps)) {
        payload.steps = payload.steps.map((step, index) => {
            if (typeof step === 'string') step = JSON.parse(step);
            if (!step || typeof step !== 'object') throw new Error(`Step ${index}: Must be an object`);
            if (step.params && typeof step.params === 'string') step.params = JSON.parse(step.params);
            return step;
        });
    }
    const response = await mlCall('preprocess', 'post', `${ML_SERVICE_URL}/api/data/preprocess`, payload);
    const data = response.data;
    data.numerical_columns  = Array.isArray(data.numerical_columns)  ? data.numerical_columns  : [];
    data.categorical_columns = Array.isArray(data.categorical_columns) ? data.categorical_columns : [];
    return data;
};

// ── 3. FINALIZE ───────────────────────────────────────────────────────────────
exports.finalizeDataset = async (payload) => {
    const response = await mlCall('finalize', 'post', `${ML_SERVICE_URL}/api/data/finalize`, payload);
    const data = response.data;
    data.numerical_columns  = Array.isArray(data.numerical_columns)  ? data.numerical_columns  : [];
    data.categorical_columns = Array.isArray(data.categorical_columns) ? data.categorical_columns : [];
    return data;
};

// ── 4. FINALIZE PIPELINE ──────────────────────────────────────────────────────
exports.finalizePipeline = async (payload) => {
    const response = await mlCall('finalizePipeline', 'post', `${ML_SERVICE_URL}/api/pipeline/finalize`, payload);
    return response.data;
};

// ── 5. TRAIN (legacy) ─────────────────────────────────────────────────────────
exports.trainPipeline = async (payload) => {
    logger.info('[ML]', '🚀 Legacy train pipeline starting', {
        pipeline_id:   payload.pipeline_id,
        task_type:     payload.task_type,
        target_column: payload.target_column,
    });
    const response = await mlCall('train', 'post', `${ML_SERVICE_URL}/api/train`, payload);
    return response.data;
};

// ── 6. DOWNLOAD ───────────────────────────────────────────────────────────────
exports.downloadDataset = async (userId, datasetId, steps = []) => {
    if (steps && steps.length > 0) {
        const response = await axios.post(
            `${ML_SERVICE_URL}/api/data/download`,
            { user_id: userId, dataset_id: datasetId, steps },
            { headers: { 'Content-Type': 'application/json' }, responseType: 'stream' }
        );
        return response.data;
    }
    const response = await axios.get(
        `${ML_SERVICE_URL}/api/data/download`,
        { params: { user_id: userId, dataset_id: datasetId }, responseType: 'stream' }
    );
    return response.data;
};

// ── 7. GET AVAILABLE MODELS ───────────────────────────────────────────────────
exports.getAvailableModels = async (taskType) => {
    const response = await mlCall('getModels', 'get',
        `${ML_SERVICE_URL}/api/models/available`,
        null,
        { params: { task_type: taskType } }
    );
    return response.data;
};

// ── 8. EXPERIMENT TRAIN ───────────────────────────────────────────────────────
exports.experimentTrain = async (payload) => {
    logger.info('[ML]', '🚀 Sending experiment train request to ML Service', {
        user_id:       payload.user_id,
        task_type:     payload.task_type,
        target_column: payload.target_column,
        models:        payload.selected_models,
        total_models:  payload.selected_models?.length,
        dataset_id:    payload.dataset_id,
        pipeline_id:   payload.pipeline_id,
        steps_count:   payload.preprocessing_steps?.length ?? 0,
    });
    const response = await mlCall('experimentTrain', 'post', `${ML_SERVICE_URL}/api/experiment/train`, payload);
    const result = response.data;
    logger.info('[ML]', '📦 ML Service accepted experiment train', {
        ml_experiment_id: result.experiment_id,
        status:           result.status,
    });
    return result;
};


exports.getExperiment = async (experimentId) => {
    const url = `${ML_SERVICE_URL}/api/experiment/${experimentId}`;
    logger.debug('[ML]', `→ GET ${url}`);
    const start = Date.now();
    try {
        const response = await axios.get(url, { timeout: 10000 });
        logger.debug('[ML]', `← GET ${url} — ${Date.now() - start}ms [${response.status}]`);
        return response.data;
    } catch (error) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
            throw new Error(`ML Service not reachable at ${ML_SERVICE_URL}.`);
        }
        if (error.response?.status === 404) return null;
        logger.error('[ML]', `✗ GET ${url}`, { error: error.message });
        throw new Error(error.response?.data?.detail || error.message);
    }
};

// ── 11. GET EXPERIMENT PLOTS ──────────────────────────────────────────────────
exports.getExperimentPlots = async (experimentId, modelName) => {
    const url = `${ML_SERVICE_URL}/api/experiment/${experimentId}/plots/${modelName}`;
    logger.debug('[ML]', `→ GET ${url}`);
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        if (error.response?.status === 404) return null;
        logger.error('[ML]', `✗ GET ${url}`, { error: error.message });
        throw new Error(error.response?.data?.detail || error.message);
    }
};

// ── 12. LIST EXPERIMENTS ──────────────────────────────────────────────────────
exports.listExperiments = async (pipelineId = null) => {
    const params = pipelineId ? { pipeline_id: pipelineId } : {};
    try {
        const response = await mlCall('listExperiments', 'get',
            `${ML_SERVICE_URL}/api/experiments`,
            null,
            { params, timeout: 5000 }
        );
        return response.data;
    } catch (error) {
        if (error.message?.includes('not reachable') || error.response?.status === 404) {
            logger.warn('[ML]', 'ML Service unreachable for listExperiments — returning empty list');
            return { experiments: [], count: 0 };
        }
        throw error;
    }
};
