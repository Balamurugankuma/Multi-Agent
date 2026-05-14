// ══════════════════════════════════════════════════
//  controllers/serviceController.js
//  Handles: List Services · Admin CRUD
// ══════════════════════════════════════════════════
const Service         = require('../models/Service');
const { createError } = require('../middleware/errorHandler');

// GET /api/services — list all active services
const getServices = async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;

    const services = await Service.find(filter).lean();
    res.status(200).json({ success: true, count: services.length, services });
  } catch (err) { next(err); }
};

// GET /api/services/:id — single service
const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id).lean();
    if (!service) return next(createError('Service not found.', 404));
    res.status(200).json({ success: true, service });
  } catch (err) { next(err); }
};

// POST /api/services — admin create
const createService = async (req, res, next) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json({ success: true, service });
  } catch (err) { next(err); }
};

// PUT /api/services/:id — admin update
const updateService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!service) return next(createError('Service not found.', 404));
    res.status(200).json({ success: true, service });
  } catch (err) { next(err); }
};

module.exports = { getServices, getServiceById, createService, updateService };
