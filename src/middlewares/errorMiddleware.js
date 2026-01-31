/**
 * ============================================
 * ARQUIVO: errorMiddleware.js
 * DESCRICAO: Middleware centralizado de tratamento de erros
 * ============================================
 *
 * Captura todos os erros da aplicacao e retorna
 * respostas JSON padronizadas para o cliente.
 *
 * Tratamentos especificos:
 * - Erros do Prisma (P2025, P2002, P2003)
 * - Erros de validacao (Joi)
 * - Erros de JWT (invalido, expirado)
 * - Erros genericos com statusCode customizado
 *
 * Em producao, oculta detalhes de erro para seguranca.
 * Em desenvolvimento, inclui stack trace.
 *
 * Uso no app.js:
 * app.use(errorMiddleware) // Deve ser o ultimo middleware
 */

/**
 * Middleware de tratamento de erros
 *
 * Intercepta erros lancados em qualquer parte da aplicacao.
 * Retorna resposta JSON padronizada com codigo HTTP apropriado.
 *
 * @param {Error} err - Erro capturado
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Proximo middleware (nao usado, mas necessario)
 */
const errorMiddleware = (err, req, res, next) => {
  // Log do erro para debugging
  console.error('Error:', err);

  // ==========================================
  // ERROS DO PRISMA (ORM)
  // ==========================================

  // P2025 - Registro nao encontrado em operacao que requer existencia
  // Ex: update() ou delete() em registro que nao existe
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Registro nao encontrado',
    });
  }

  // P2002 - Violacao de constraint UNIQUE
  // Ex: tentar criar usuario com email que ja existe
  if (err.code === 'P2002') {
    // Tenta extrair nome do campo que violou constraint
    const field = err.meta?.target?.[0] || 'campo';
    return res.status(409).json({
      success: false,
      message: `Este ${field} ja esta em uso`,
    });
  }

  // P2003 - Violacao de chave estrangeira
  // Ex: referenciar categoryId que nao existe
  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      message: 'Referencia invalida para registro relacionado',
    });
  }

  // ==========================================
  // ERROS DE VALIDACAO
  // ==========================================

  // Erro customizado de validacao (definido manualmente)
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // ==========================================
  // ERROS DE JWT
  // ==========================================

  // Token mal formado ou assinatura invalida
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token invalido',
    });
  }

  // Token expirado
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expirado',
    });
  }

  // ==========================================
  // ERRO GENERICO
  // ==========================================

  // Usa statusCode do erro ou 500 como padrao
  const statusCode = err.statusCode || 500;

  // Usa mensagem do erro ou mensagem generica
  const message = err.message || 'Erro interno do servidor';

  res.status(statusCode).json({
    success: false,
    // Em producao, esconde detalhes de erros 500 por seguranca
    message: process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor'
      : message,
    // Em desenvolvimento, inclui stack trace para debugging
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = errorMiddleware;
