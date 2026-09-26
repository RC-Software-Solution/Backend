const { Op } = require('sequelize');
const Notice = require('../models/Notice');
const User = require('../models/User');
const { sendToMany } = require('../services/notificationService');

const ADMIN_ROLES = ['admin', 'super_admin'];

exports.createNotice = async (req, res) => {
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
  const body = typeof req.body.body === 'string' ? req.body.body.trim() : '';
  const area_id = req.body.area_id ?? null;

  if (!title || !body) {
    return res.status(400).json({ message: 'title and body are required' });
  }
  if (title.length > 150) {
    return res.status(400).json({ message: 'title must be 150 characters or less' });
  }
  if (area_id !== null && !Number.isInteger(area_id)) {
    return res.status(400).json({ message: 'area_id must be an integer' });
  }

  try {
    // Save first: if the push fails, the notice is still listed in the app.
    const notice = await Notice.create({ title, body, area_id, created_by: req.user.id });

    const where = { role: 'customer', customer_status: 'accepted', fcm_token: { [Op.ne]: null } };
    if (area_id) where.area_id = area_id;
    const recipients = await User.findAll({ where, attributes: ['fcm_token'] });
    const push = await sendToMany(recipients.map((u) => u.fcm_token), title, body);

    res.status(201).json({ notice, push });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ message: 'Unknown area_id' });
    }
    console.error('Error creating notice:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.listNotices = async (req, res) => {
  const limit = Math.max(Math.min(parseInt(req.query.limit, 10) || 20, 100), 1);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

  // req.user is loaded from the DB by authMiddleware, so area_id is current.
  const where = ADMIN_ROLES.includes(req.user.role)
    ? {}
    : { [Op.or]: [{ area_id: null }, { area_id: req.user.area_id }] };

  try {
    const { rows, count } = await Notice.findAndCountAll({ where, order: [['id', 'DESC']], limit, offset });
    res.json({ notices: rows, total: count, limit, offset });
  } catch (error) {
    console.error('Error listing notices:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteNotice = async (req, res) => {
  try {
    const deleted = await Notice.destroy({ where: { id: req.params.id } });
    if (!deleted) {
      return res.status(404).json({ message: 'Notice not found' });
    }
    res.json({ message: 'Notice deleted' });
  } catch (error) {
    console.error('Error deleting notice:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
