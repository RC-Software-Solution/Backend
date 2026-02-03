const express = require('express');
const {
  getSalesTotals,
  getOrdersMetrics,
  getUnpaidOrdersCount,
  getTopSellingItems,
  getSessionPerformance,
  getAreaMetrics,
} = require('../controllers/internalAnalytics.controller');
const { internalAuthMiddleware } = require('../middlewares/internalAuthMiddleware');

const router = express.Router();
router.use(internalAuthMiddleware);

router.get('/sales-totals', getSalesTotals);
router.get('/orders-metrics', getOrdersMetrics);
router.get('/unpaid-orders-count', getUnpaidOrdersCount);
router.get('/top-selling-items', getTopSellingItems);
router.get('/session-performance', getSessionPerformance);
router.get('/area-metrics', getAreaMetrics);

module.exports = router;
