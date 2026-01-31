const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validate, validateQuery } = require('../middlewares/validationMiddleware');
const { upload, handleUploadError } = require('../middlewares/uploadMiddleware');
const {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} = require('../validations/productValidation');

// Rotas publicas
router.get('/', validateQuery(productQuerySchema), productController.getAll);
router.get('/:id', productController.getById);
router.get('/category/:categoryId', productController.getByCategory);

// Rotas protegidas (admin)
router.post('/', authMiddleware, adminMiddleware, validate(createProductSchema), productController.create);
router.put('/:id', authMiddleware, adminMiddleware, validate(updateProductSchema), productController.update);
router.delete('/:id', authMiddleware, adminMiddleware, productController.delete);
router.patch('/:id/availability', authMiddleware, adminMiddleware, productController.updateAvailability);
router.post('/:id/image', authMiddleware, adminMiddleware, upload.single('image'), handleUploadError, productController.uploadImage);

module.exports = router;
