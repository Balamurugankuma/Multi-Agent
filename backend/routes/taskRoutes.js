// ══════════════════════════════════════════════════
//  routes/taskRoutes.js  —  /api/tasks
// ══════════════════════════════════════════════════
const express  = require('express');
const { body } = require('express-validator');
const router   = express.Router();

const {
  getTasks, createTask, getTask, updateTask, updateTaskStatus, deleteTask
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const validate    = require('../middleware/validate');

router.use(protect);

const STATUS   = ['todo','in_progress','in_review','done'];
const PRIORITY = ['low','medium','high','urgent'];

const taskValidation = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ min: 2, max: 200 }).withMessage('Title must be 2–200 chars'),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('status').optional().isIn(STATUS).withMessage(`Status: ${STATUS.join(', ')}`),
  body('priority').optional().isIn(PRIORITY).withMessage(`Priority: ${PRIORITY.join(', ')}`),
  body('dueDate').optional().isISO8601().withMessage('Invalid date'),
  body('project').notEmpty().withMessage('Project ID is required').isMongoId(),
  body('labels').optional().isArray(),
];

router.get('/',             getTasks);
router.post('/',            taskValidation, validate, createTask);
router.get('/:id',          getTask);
router.put('/:id',          taskValidation, validate, updateTask);
router.patch('/:id/status', [
  body('status').isIn(STATUS).withMessage(`Status: ${STATUS.join(', ')}`)
], validate, updateTaskStatus);
router.delete('/:id',       deleteTask);

module.exports = router;
