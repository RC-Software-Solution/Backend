const express = require('express');
const { getBlockedUsersCount } = require('../controllers/internalAnalytics.controller');
const { internalAuthMiddleware } = require('../middlewares/internalAuthMiddleware');

const router = express.Router();
router.use(internalAuthMiddleware);

router.get('/blocked-users-count', getBlockedUsersCount);

module.exports = router;
