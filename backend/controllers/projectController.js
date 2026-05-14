// ══════════════════════════════════════════════════════════
//  controllers/projectController.js  —  Velverse AI + TaskFlow
//  Full CRUD for Projects — scoped to logged-in user
// ══════════════════════════════════════════════════════════
const Project = require('../models/Project');
const Task    = require('../models/Task');
const { createError } = require('../middleware/errorHandler');

// GET /api/projects
const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    const withCounts = await Promise.all(
      projects.map(async (p) => {
        const [total, done] = await Promise.all([
          Task.countDocuments({ project: p._id }),
          Task.countDocuments({ project: p._id, status: 'done' }),
        ]);
        return { ...p, taskCount: total, doneCount: done };
      })
    );
    res.json({ success: true, count: withCounts.length, projects: withCounts });
  } catch (err) { next(err); }
};

// POST /api/projects
const createProject = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;
    const project = await Project.create({
      name, description,
      color: color || '#6366f1',
      owner: req.user._id,
    });
    res.status(201).json({ success: true, project });
  } catch (err) { next(err); }
};

// GET /api/projects/:id
const getProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id }).lean();
    if (!project) return next(createError('Project not found.', 404));
    res.json({ success: true, project });
  } catch (err) { next(err); }
};

// PUT /api/projects/:id
const updateProject = async (req, res, next) => {
  try {
    const { name, description, color, isArchived } = req.body;
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { name, description, color, isArchived },
      { new: true, runValidators: true }
    );
    if (!project) return next(createError('Project not found.', 404));
    res.json({ success: true, project });
  } catch (err) { next(err); }
};

// DELETE /api/projects/:id
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) return next(createError('Project not found.', 404));
    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    res.json({ success: true, message: 'Project and all its tasks deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getProjects, createProject, getProject, updateProject, deleteProject };
