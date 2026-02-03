const orderAnalyticsService = require('../services/orderAnalyticsService');
const userAnalyticsService = require('../services/userAnalyticsService');
const areaAnalyticsService = require('../services/areaAnalyticsService');

/**
 * GET /api/analytics/sales-totals?period=daily|weekly|monthly
 */
async function getSalesTotals(req, res) {
  try {
    const period = req.query.period || 'weekly';
    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return res.status(400).json({ message: 'Invalid period. Use: daily, weekly, monthly' });
    }
    const data = await orderAnalyticsService.getSalesTotals(period);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Analytics getSalesTotals error:', error.message);
    return res.status(502).json({
      message: 'Failed to fetch sales totals',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

/**
 * GET /api/analytics/orders-metrics?period=daily|weekly|monthly
 */
async function getOrdersMetrics(req, res) {
  try {
    const period = req.query.period || 'weekly';
    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return res.status(400).json({ message: 'Invalid period. Use: daily, weekly, monthly' });
    }
    const data = await orderAnalyticsService.getOrdersMetrics(period);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Analytics getOrdersMetrics error:', error.message);
    return res.status(502).json({
      message: 'Failed to fetch orders metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

/**
 * GET /api/analytics/blocked-users-count
 */
async function getBlockedUsersCount(req, res) {
  try {
    const data = await userAnalyticsService.getBlockedUsersCount();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Analytics getBlockedUsersCount error:', error.message);
    return res.status(502).json({
      message: 'Failed to fetch blocked users count',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

/**
 * GET /api/analytics/unpaid-orders-count
 */
async function getUnpaidOrdersCount(req, res) {
  try {
    const data = await orderAnalyticsService.getUnpaidOrdersCount();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Analytics getUnpaidOrdersCount error:', error.message);
    return res.status(502).json({
      message: 'Failed to fetch unpaid orders count',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

/**
 * GET /api/analytics/top-selling-items?startDate=...&endDate=...&limit=...
 */
async function getTopSellingItems(req, res) {
  try {
    const { startDate, endDate, limit } = req.query;
    const dateRange = {};
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;
    const data = await orderAnalyticsService.getTopSellingItems(
      dateRange,
      parseInt(limit, 10) || 10
    );
    return res.status(200).json(data);
  } catch (error) {
    console.error('Analytics getTopSellingItems error:', error.message);
    return res.status(502).json({
      message: 'Failed to fetch top selling items',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

/**
 * GET /api/analytics/session-performance?sessionType=breakfast|lunch|dinner&startDate=...&endDate=...
 */
async function getSessionPerformance(req, res) {
  try {
    const { sessionType, startDate, endDate } = req.query;
    if (!sessionType || !['breakfast', 'lunch', 'dinner'].includes(sessionType)) {
      return res.status(400).json({
        message: 'Invalid sessionType. Use: breakfast, lunch, dinner',
      });
    }
    const dateRange = {};
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;
    const data = await orderAnalyticsService.getSessionPerformance(sessionType, dateRange);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Analytics getSessionPerformance error:', error.message);
    return res.status(502).json({
      message: 'Failed to fetch session performance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

/**
 * GET /api/analytics/area-metrics?areaId=...&startDate=...&endDate=...
 */
async function getAreaMetrics(req, res) {
  try {
    const { areaId, startDate, endDate } = req.query;
    const dateRange = {};
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;
    const data = await orderAnalyticsService.getAreaMetrics(areaId || undefined, dateRange);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Analytics getAreaMetrics error:', error.message);
    return res.status(502).json({
      message: 'Failed to fetch area metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

/**
 * GET /api/analytics/areas - list areas (from locations-service) for dropdowns
 */
async function getAreas(req, res) {
  try {
    const data = await areaAnalyticsService.getAreas();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Analytics getAreas error:', error.message);
    return res.status(502).json({
      message: 'Failed to fetch areas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

module.exports = {
  getSalesTotals,
  getOrdersMetrics,
  getBlockedUsersCount,
  getUnpaidOrdersCount,
  getTopSellingItems,
  getSessionPerformance,
  getAreaMetrics,
  getAreas,
};
