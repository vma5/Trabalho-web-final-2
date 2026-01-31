/**
 * ============================================
 * ARQUIVO: authMiddleware.js
 * DESCRICAO: Middleware de autenticacao JWT
 * ============================================
 *
 * Protege rotas que requerem usuario autenticado.
 *
 * Fluxo:
 * 1. Extrai token do header Authorization
 * 2. Valida e decodifica o token JWT
 * 3. Busca usuario no banco
 * 4. Adiciona usuario em req.user
 *
 * Uso nas rotas:
 * router.get('/protected', authMiddleware, controller.method)
 */

const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

/**
 * Middleware de autenticacao
 *
 * Valida token JWT e carrega dados do usuario em req.user.
 * Retorna 401 se token invalido, expirado ou usuario inativo.
 *
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Proximo middleware
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Busca header Authorization
    const authHeader = req.headers.authorization;

    // Verifica se header existe e esta no formato correto
    // Formato esperado: "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticacao nao fornecido',
      });
    }

    // Extrai apenas o token (remove "Bearer ")
    const token = authHeader.split(' ')[1];

    // Verifica e decodifica o token
    // jwt.verify() lanca erro se token invalido ou expirado
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Busca usuario no banco usando ID do token
    // Seleciona apenas campos necessarios (nao inclui senha)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    // Verifica se usuario existe e esta ativo
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuario nao encontrado ou inativo',
      });
    }

    // Adiciona usuario na requisicao para uso nos controllers
    // Agora qualquer controller pode acessar req.user
    req.user = user;
    next();
  } catch (error) {
    // Token mal formado ou assinatura invalida
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalido',
      });
    }

    // Token expirou
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
      });
    }

    // Outros erros - passa para errorMiddleware
    next(error);
  }
};

module.exports = authMiddleware;
