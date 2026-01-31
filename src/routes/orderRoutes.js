const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validate, validateQuery } = require('../middlewares/validationMiddleware');
const {
  createOrderSchema,
  updateStatusSchema,
  orderQuerySchema,
} = require('../validations/orderValidation');

// Todas as rotas de pedidos sao protegidas
router.use(authMiddleware);

// Rotas do cliente
router.get('/', validateQuery(orderQuerySchema), orderController.getMyOrders);
router.get('/:id', orderController.getOrderById);
router.post('/', validate(createOrderSchema), orderController.createOrder);
router.patch('/:id/cancel', orderController.cancelOrder);

// Rotas do admin
router.get('/admin/all', adminMiddleware, validateQuery(orderQuerySchema), orderController.getAllOrders);
router.patch('/admin/:id/status', adminMiddleware, validate(updateStatusSchema), orderController.updateStatus);

module.exports = router;
