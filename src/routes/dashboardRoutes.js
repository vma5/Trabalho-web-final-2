const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Todas as rotas do dashboard sao protegidas e apenas para admin
router.use(authMiddleware, adminMiddleware);

router.get('/stats', dashboardController.getStats);
router.get('/sales', dashboardController.getSales);
router.get('/top-products', dashboardController.getTopProducts);
router.get('/peak-hours', dashboardController.getPeakHours);
router.get('/orders-by-status', dashboardController.getOrdersByStatus);
router.get('/recent-orders', dashboardController.getRecentOrders);

module.exports = router;
