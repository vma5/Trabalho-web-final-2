/**
 * ============================================
 * ARQUIVO: adminMiddleware.js
 * DESCRICAO: Middleware de autorizacao para admin
 * ============================================
 *
 * Restringe acesso a rotas administrativas.
 * DEVE ser usado APOS authMiddleware para ter acesso a req.user.
 *
 * Uso nas rotas:
 * router.get('/admin', authMiddleware, adminMiddleware, controller.method)
 */

const { USER_ROLES } = require('../utils/constants');

/**
 * Middleware de autorizacao admin
 *
 * Verifica se usuario autenticado possui role ADMIN.
 * Retorna 401 se nao autenticado ou 403 se nao for admin.
 *
 * Importante: Este middleware depende do authMiddleware
 * ter sido executado antes para popular req.user.
 *
 * @param {Object} req - Request com req.user populado
 * @param {Object} res - Response do Express
 * @param {Function} next - Proximo middleware
 */
const adminMiddleware = (req, res, next) => {
  // Verifica se usuario esta autenticado
  // Se authMiddleware nao foi executado, req.user sera undefined
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Autenticacao necessaria',
    });
  }

  // Verifica se usuario tem role de admin
  if (req.user.role !== USER_ROLES.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Acesso restrito a administradores',
    });
  }

  // Usuario e admin - permite continuar
  next();
};

module.exports = adminMiddleware;
