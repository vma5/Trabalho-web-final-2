const Joi = require('joi');
const { ORDER_STATUS } = require('../utils/constants');

const createOrderSchema = Joi.object({
  notes: Joi.string()
    .max(500)
    .optional()
    .allow(''),
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(ORDER_STATUS))
    .required()
    .messages({
      'any.required': 'Status e obrigatorio',
      'any.only': 'Status invalido',
    }),

  notes: Joi.string()
    .max(500)
    .optional()
    .allow(''),
});

const orderQuerySchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(ORDER_STATUS))
    .optional(),
  date: Joi.date().optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createOrderSchema,
  updateStatusSchema,
  orderQuerySchema,
};
