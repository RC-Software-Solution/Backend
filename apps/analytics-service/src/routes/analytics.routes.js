const express = require('express');
const {
  getSalesTotals,
  getOrdersMetrics,
  getBlockedUsersCount,
  getUnpaidOrdersCount,
  getTopSellingItems,
  getSessionPerformance,
  getAreaMetrics,
  getAreas,
} = require('../controllers/analytics.controller');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

const adminRoles = ['admin', 'super_admin'];
router.use(authMiddleware);
router.use(checkRole(adminRoles));

router.get('/sales-totals', getSalesTotals);
router.get('/orders-metrics', getOrdersMetrics);
router.get('/blocked-users-count', getBlockedUsersCount);
router.get('/unpaid-orders-count', getUnpaidOrdersCount);
router.get('/top-selling-items', getTopSellingItems);
router.get('/session-performance', getSessionPerformance);
router.get('/area-metrics', getAreaMetrics);
router.get('/areas', getAreas);

module.exports = router;
