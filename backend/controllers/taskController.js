// ══════════════════════════════════════════════════════════
//  controllers/taskController.js  —  Velverse AI + TaskFlow
// ══════════════════════════════════════════════════════════
const Task    = require('../models/Task');
const Project = require('../models/Project');
const { createError } = require('../middleware/errorHandler');

// Verify project belongs to user
const verifyOwner = async (projectId, userId) => {
  const p = await Project.findOne({ _id: projectId, owner: userId });
  if (!p) throw createError('Project not found or access denied.', 403);
  return p;
};

// GET /api/tasks?project=&status=&priority=&search=&page=&limit=
const getTasks = async (req, res, next) => {
  try {
    const { project, status, priority, search, page = 1, limit = 50 } = req.query;

    // Always scope to current user's projects
    const userProjects = await Project.find({ owner: req.user._id }).select('_id');
    const ids = userProjects.map(p => p._id);

    const filter = { project: { $in: ids } };
    if (project)  filter.project  = project;
    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;
    if (search)   filter.title    = { $regex: search, $options: 'i' };

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Task.countDocuments(filter);
    const tasks = await Task.find(filter)
      .populate('project',   'name color')
      .populate('assignedTo','name email')
      .populate('createdBy', 'name email')
      .sort({ order: 1, createdAt: -1 })
      .skip(skip).limit(Number(limit)).lean();

    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), tasks });
  } catch (err) { next(err); }
};

// POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, labels, project, assignedTo } = req.body;
    await verifyOwner(project, req.user._id);
    const task = await Task.create({
      title, description, status, priority, dueDate, labels,
      project,
      assignedTo: assignedTo || req.user._id,
      createdBy:  req.user._id,
    });
    const populated = await task.populate([
      { path: 'project',    select: 'name color' },
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy',  select: 'name email' },
    ]);
    res.status(201).json({ success: true, task: populated });
  } catch (err) { next(err); }
};

// GET /api/tasks/:id
const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project',   'name color owner')
      .populate('assignedTo','name email')
      .populate('createdBy', 'name email');
    if (!task) return next(createError('Task not found.', 404));
    if (task.project.owner.toString() !== req.user._id.toString())
      return next(createError('Access denied.', 403));
    res.json({ success: true, task });
  } catch (err) { next(err); }
};

// PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, labels, assignedTo } = req.body;
    const task = await Task.findById(req.params.id).populate('project', 'owner');
    if (!task) return next(createError('Task not found.', 404));
    if (task.project.owner.toString() !== req.user._id.toString())
      return next(createError('Access denied.', 403));
    Object.assign(task, { title, description, status, priority, dueDate, labels, assignedTo });
    await task.save();
    const updated = await task.populate([
      { path: 'project',    select: 'name color' },
      { path: 'assignedTo', select: 'name email' },
    ]);
    res.json({ success: true, task: updated });
  } catch (err) { next(err); }
};

// PATCH /api/tasks/:id/status
const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['todo','in_progress','in_review','done'];
    if (!allowed.includes(status)) return next(createError(`Status must be one of: ${allowed.join(', ')}`, 400));
    const task = await Task.findById(req.params.id).populate('project','owner');
    if (!task) return next(createError('Task not found.', 404));
    if (task.project.owner.toString() !== req.user._id.toString())
      return next(createError('Access denied.', 403));
    task.status = status;
    await task.save();
    res.json({ success: true, task });
  } catch (err) { next(err); }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('project','owner');
    if (!task) return next(createError('Task not found.', 404));
    if (task.project.owner.toString() !== req.user._id.toString())
      return next(createError('Access denied.', 403));
    await task.deleteOne();
    res.json({ success: true, message: 'Task deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getTasks, createTask, getTask, updateTask, updateTaskStatus, deleteTask };
