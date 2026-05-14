// ══════════════════════════════════════════════════
//  routes/projectRoutes.js  —  /api/projects
// ══════════════════════════════════════════════════
const express  = require('express');
const { body } = require('express-validator');
const router   = express.Router();

const {
  getProjects, createProject, getProject, updateProject, deleteProject
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const validate    = require('../middleware/validate');

router.use(protect);

const validation = [
  body('name').trim().notEmpty().withMessage('Project name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  body('description').optional().trim()
    .isLength({ max: 500 }).withMessage('Description max 500 characters'),
  body('color').optional()
    .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be a valid hex code'),
];

router.get('/',     getProjects);
router.post('/',    validation, validate, createProject);
router.get('/:id',  getProject);
router.put('/:id',  validation, validate, updateProject);
router.delete('/:id', deleteProject);

module.exports = router;
