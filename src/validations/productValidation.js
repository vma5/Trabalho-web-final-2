const Joi = require('joi');

const createProductSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'any.required': 'Nome do produto e obrigatorio',
    }),

  description: Joi.string()
    .max(500)
    .optional()
    .allow(''),

  price: Joi.number()
    .positive()
    .required()
    .messages({
      'number.positive': 'Preco deve ser maior que zero',
      'any.required': 'Preco e obrigatorio',
    }),

  categoryId: Joi.string()
    .uuid()
    .required()
    .messages({
      'any.required': 'Categoria e obrigatoria',
    }),

  isAvailable: Joi.boolean()
    .default(true),

  stockQuantity: Joi.number()
    .integer()
    .min(0)
    .optional(),
});

const updateProductSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional(),

  description: Joi.string()
    .max(500)
    .optional()
    .allow(''),

  price: Joi.number()
    .positive()
    .optional(),

  categoryId: Joi.string()
    .uuid()
    .optional(),

  isAvailable: Joi.boolean()
    .optional(),

  stockQuantity: Joi.number()
    .integer()
    .min(0)
    .optional(),
});

const productQuerySchema = Joi.object({
  categoryId: Joi.string().uuid().optional(),
  search: Joi.string().optional(),
  available: Joi.string().valid('true', 'false').optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
};
