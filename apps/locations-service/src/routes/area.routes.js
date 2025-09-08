const express = require('express');
const router = express.Router();
const {
    createArea,
    getAreas,
    getAreaById,
    updateArea,
    deleteArea,
} = require('../controllers/area.controller');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

const CAN_MANAGE = ['admin', 'super-admin'];
const CAN_READ = ['admin', 'super-admin', 'delivery-person'];

router.post('/', authMiddleware, checkRole(CAN_MANAGE), createArea);
router.get('/', authMiddleware, checkRole(CAN_READ), getAreas);
router.get('/:id', authMiddleware, checkRole(CAN_READ), getAreaById);
router.put('/:id', authMiddleware, checkRole(CAN_MANAGE), updateArea);
router.delete('/:id', authMiddleware, checkRole(CAN_MANAGE), deleteArea);

module.exports = router;


