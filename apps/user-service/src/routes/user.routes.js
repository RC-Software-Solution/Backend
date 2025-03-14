const express = require('express');
const { signup, login, getProfile, approveCustomer } = require('../controllers/user.controller');
const { authMiddleware } =  require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);
router.put('/approve/:customerId', authMiddleware, checkRole(["admin", "super_admin"]), approveCustomer);

module.exports = router;
