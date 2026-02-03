const express = require('express');
const { getAreas, getAreaById } = require('../controllers/area.controller');
const { internalAuthMiddleware } = require('../middlewares/internalAuthMiddleware');

const router = express.Router();
router.use(internalAuthMiddleware);

router.get('/', getAreas);
router.get('/:id', getAreaById);

module.exports = router;
