const express = require('express');
const pipelineController = require('../controllers/pipeline.controller');
const auth = require('../middlewares/authMiddleware');

const router = express.Router();

// 🔒 PROTECTED ROUTES
router.post('/', auth, pipelineController.createPipeline);
router.post('/:pipelineId/execute', auth, pipelineController.executePipeline);
router.post('/:pipelineId/undo', auth, pipelineController.undoToStep);
router.post('/:pipelineId/resume', auth, pipelineController.resumePipeline);
router.get('/user/resumable', auth, pipelineController.getResumablePipelines);
router.post('/:pipelineId/steps', auth, pipelineController.addStep);

module.exports = router;
