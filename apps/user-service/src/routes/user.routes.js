const express = require('express');
const { signup, getProfile, getUserById, approveCustomer, deleteAccount, refreshToken } = require('../controllers/user.controller');
const { authMiddleware } =  require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');
const { internalAuthMiddleware } = require('../middlewares/internalAuthMiddleware');
const router = express.Router();

router.post('/signup', signup);
router.post('/refresh-token', refreshToken);
router.get('/profile', authMiddleware, getProfile);
router.get('/:userId', internalAuthMiddleware, getUserById); // Internal service-to-service lookup: requires X-Internal-Key

router.put('/approve/:customerId', authMiddleware, checkRole(["admin", "super_admin"]), approveCustomer);
router.put('/delete/:userId', authMiddleware, deleteAccount);

module.exports = router;
