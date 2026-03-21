/**
 * Per-user training lock.
 * Prevents duplicate jobs from rapid double-clicks or concurrent API requests.
 *
 * Key:   userId (number)
 * Value: experiment_id (string)
 *
 * Lifecycle:
 *   SET   → training.controller.js after trainingQueue.add() succeeds
 *   CLEAR → training.worker.js on job completed OR failed
 */
const activeTrainingByUser = new Map();

module.exports = { activeTrainingByUser };
