const express = require('express');
const { createNotice, listNotices, deleteNotice } = require('../controllers/notice.controller');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

const router = express.Router();
const adminOnly = checkRole(['admin', 'super_admin']);

router.use(authMiddleware);

router.get('/', listNotices);
router.post('/', adminOnly, createNotice);
router.delete('/:id', adminOnly, deleteNotice);

module.exports = router;
