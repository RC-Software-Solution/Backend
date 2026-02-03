const { Order, Order_Item, sequelize } = require('../models');
const { Op } = require('sequelize');

function getDateRange(period) {
  const now = new Date();
  let start;

  switch (period) {
    case 'daily':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      break;
    case 'weekly': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0);
      break;
    }
    case 'monthly':
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  }

  return { [Op.gte]: start };
}

function parseCustomRange(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return { [Op.between]: [start, end] };
}

exports.getSalesTotals = async (req, res) => {
  try {
    const period = req.query.period || 'weekly';
    const dateFilter = getDateRange(period);

    const result = await Order.findAll({
      where: { created_at: dateFilter, payment_status: 'paid' },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total_price')), 'totalRevenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
      ],
      raw: true,
    });

    const row = result[0] || {};
    res.status(200).json({
      period,
      totalRevenue: Number(row.totalRevenue || 0),
      orderCount: Number(row.orderCount || 0),
    });
  } catch (error) {
    console.error('Internal analytics getSalesTotals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getOrdersMetrics = async (req, res) => {
  try {
    const period = req.query.period || 'weekly';
    const dateFilter = getDateRange(period);

    const totalRows = await Order.findAll({
      where: { created_at: dateFilter },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN payment_status = 'paid' THEN total_price ELSE 0 END")), 'revenue'],
      ],
      raw: true,
    });
    const totals = totalRows[0] || {};

    const unpaid = await Order.count({
      where: { created_at: dateFilter, payment_status: 'unpaid' },
    });

    const completed = await Order.count({
      where: { created_at: dateFilter, status: 'completed', payment_status: 'paid' },
    });

    res.status(200).json({
      period,
      totalOrders: Number(totals?.total || 0),
      totalRevenue: Number(totals?.revenue || 0),
      unpaidCount: unpaid,
      completedCount: completed,
    });
  } catch (error) {
    console.error('Internal analytics getOrdersMetrics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUnpaidOrdersCount = async (req, res) => {
  try {
    const count = await Order.count({
      where: { payment_status: 'unpaid' },
    });
    res.status(200).json({ count });
  } catch (error) {
    console.error('Internal analytics getUnpaidOrdersCount error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTopSellingItems = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    const dateFilter = parseCustomRange(startDate, endDate);
    const whereOrder = dateFilter ? { created_at: dateFilter } : {};

    const items = await Order_Item.findAll({
      attributes: [
        'food_name',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
        [sequelize.fn('SUM', sequelize.literal('quantity * price')), 'total_revenue'],
      ],
      include: [
        {
          model: Order,
          as: 'order',
          attributes: [],
          where: whereOrder,
          required: true,
        },
      ],
      group: ['food_name'],
      order: [[sequelize.literal('total_quantity'), 'DESC']],
      limit: Math.min(Number.parseInt(limit, 10) || 10, 100),
      raw: true,
    });

    const data = items.map((i) => ({
      food_name: i.food_name,
      total_quantity: Number(i.total_quantity || 0),
      total_revenue: Number(i.total_revenue || 0),
    }));

    res.status(200).json({ data });
  } catch (error) {
    console.error('Internal analytics getTopSellingItems error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSessionPerformance = async (req, res) => {
  try {
    const { sessionType, startDate, endDate } = req.query;
    if (!sessionType || !['breakfast', 'lunch', 'dinner'].includes(sessionType)) {
      return res.status(400).json({ message: 'Invalid sessionType. Use: breakfast, lunch, dinner' });
    }

    const dateFilter = parseCustomRange(startDate, endDate);
    const where = { meal_time: sessionType };
    if (dateFilter) where.created_at = dateFilter;

    const result = await Order.findAll({
      where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
        [sequelize.fn('SUM', sequelize.col('total_price')), 'totalRevenue'],
      ],
      raw: true,
    });

    const row = result[0] || {};
    res.status(200).json({
      sessionType,
      orderCount: Number(row.orderCount || 0),
      totalRevenue: Number(row.totalRevenue || 0),
    });
  } catch (error) {
    console.error('Internal analytics getSessionPerformance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAreaMetrics = async (req, res) => {
  try {
    const { areaId, startDate, endDate } = req.query;
    const dateFilter = parseCustomRange(startDate, endDate);
    const where = {};
    if (areaId) where.area_id = areaId;
    if (dateFilter) where.created_at = dateFilter;

    const areas = await Order.findAll({
      where,
      attributes: [
        'area_id',
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount'],
        [sequelize.fn('SUM', sequelize.col('total_price')), 'totalRevenue'],
      ],
      group: ['area_id'],
      raw: true,
    });

    const data = areas.map((a) => ({
      area_id: a.area_id,
      orderCount: Number(a.orderCount || 0),
      totalRevenue: Number(a.totalRevenue || 0),
    }));

    res.status(200).json({ data });
  } catch (error) {
    console.error('Internal analytics getAreaMetrics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
