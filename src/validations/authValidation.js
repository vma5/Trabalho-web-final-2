const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email invalido',
      'any.required': 'Email e obrigatorio',
    }),

  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min': 'Senha deve ter no minimo 6 caracteres',
      'any.required': 'Senha e obrigatoria',
    }),

  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Nome deve ter no minimo 2 caracteres',
      'any.required': 'Nome e obrigatorio',
    }),

  phone: Joi.string()
    .pattern(/^[\d\s\-\(\)]+$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'Telefone invalido',
    }),
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email invalido',
      'any.required': 'Email e obrigatorio',
    }),

  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Senha e obrigatoria',
    }),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email invalido',
      'any.required': 'Email e obrigatorio',
    }),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Token e obrigatorio',
    }),

  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Senha deve ter no minimo 6 caracteres',
      'any.required': 'Nova senha e obrigatoria',
    }),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Senha atual e obrigatoria',
    }),

  newPassword: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Nova senha deve ter no minimo 6 caracteres',
      'any.required': 'Nova senha e obrigatoria',
    }),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
};
