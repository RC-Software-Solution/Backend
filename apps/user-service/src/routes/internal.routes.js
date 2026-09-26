const express = require('express');
const { notifyUser } = require('../controllers/internal.controller');
const { internalAuthMiddleware } = require('../middlewares/internalAuthMiddleware');

const router = express.Router();
router.use(internalAuthMiddleware);

router.post('/notify', notifyUser);

module.exports = router;
