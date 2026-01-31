const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Rotas publicas
router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);

// Rotas protegidas (admin)
router.post('/', authMiddleware, adminMiddleware, categoryController.create);
router.put('/:id', authMiddleware, adminMiddleware, categoryController.update);
router.delete('/:id', authMiddleware, adminMiddleware, categoryController.delete);
router.put('/reorder/all', authMiddleware, adminMiddleware, categoryController.reorder);

module.exports = router;
