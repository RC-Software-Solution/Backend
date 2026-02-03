const express = require('express');
const {
  listCustomers,
  getCustomerProfile,
  approveCustomer,
  rejectCustomer,
  assignArea,
  disableCustomer,
  enableCustomer,
  unlockCustomer,
  exportCustomers,
} = require('../controllers/customer.controller');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

const router = express.Router();
const adminOnly = checkRole(['admin', 'super_admin']);

router.use(authMiddleware);
router.use(adminOnly);

router.get('/', listCustomers);
router.get('/export', exportCustomers);
router.get('/:id/profile', getCustomerProfile);
router.post('/:id/approve', approveCustomer);
router.post('/:id/reject', rejectCustomer);
router.put('/:id/assign-area', assignArea);
router.put('/:id/disable', disableCustomer);
router.put('/:id/enable', enableCustomer);
router.put('/:id/unlock', unlockCustomer);

module.exports = router;
