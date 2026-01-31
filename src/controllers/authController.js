/**
 * ============================================
 * ARQUIVO: authController.js
 * DESCRICAO: Controller de autenticacao
 * ============================================
 *
 * Responsavel por receber requisicoes HTTP relacionadas
 * a autenticacao e chamar os servicos apropriados.
 *
 * Rotas que utilizam este controller:
 * - POST /api/auth/register - Cadastro de usuario
 * - POST /api/auth/login - Login
 * - POST /api/auth/forgot-password - Recuperar senha
 * - POST /api/auth/reset-password - Redefinir senha
 * - PUT /api/auth/change-password - Alterar senha
 * - GET /api/auth/me - Obter perfil do usuario logado
 */

const authService = require('../services/authService');
const { successResponse } = require('../utils/responseHandler');

class AuthController {
  /**
   * Cadastra um novo usuario no sistema
   *
   * @route POST /api/auth/register
   * @param {Object} req.body - Dados do usuario
   * @param {string} req.body.name - Nome completo
   * @param {string} req.body.email - Email (unico)
   * @param {string} req.body.password - Senha (min 6 caracteres)
   * @param {string} [req.body.phone] - Telefone (opcional)
   * @returns {Object} Usuario criado e token JWT
   */
  async register(req, res, next) {
    try {
      // Chama o servico de cadastro com os dados do body
      const result = await authService.register(req.body);
      // Retorna sucesso com status 201 (Created)
      return successResponse(res, 201, 'Usuario cadastrado com sucesso', result);
    } catch (error) {
      // Passa o erro para o middleware de erro
      next(error);
    }
  }

  /**
   * Autentica um usuario e retorna token JWT
   *
   * @route POST /api/auth/login
   * @param {string} req.body.email - Email do usuario
   * @param {string} req.body.password - Senha do usuario
   * @returns {Object} Dados do usuario e token JWT
   */
  async login(req, res, next) {
    try {
      // Extrai email e senha do body
      const { email, password } = req.body;
      // Chama o servico de login
      const result = await authService.login(email, password);
      // Retorna sucesso com dados do usuario e token
      return successResponse(res, 200, 'Login realizado com sucesso', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Envia email para recuperacao de senha
   *
   * @route POST /api/auth/forgot-password
   * @param {string} req.body.email - Email do usuario
   * @returns {Object} Mensagem de confirmacao
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      return successResponse(res, 200, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Redefine a senha usando token de recuperacao
   *
   * @route POST /api/auth/reset-password
   * @param {string} req.body.token - Token de recuperacao
   * @param {string} req.body.password - Nova senha
   * @returns {Object} Mensagem de confirmacao
   */
  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      const result = await authService.resetPassword(token, password);
      return successResponse(res, 200, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Altera a senha do usuario logado
   *
   * @route PUT /api/auth/change-password
   * @requires Autenticacao - Header Authorization com token JWT
   * @param {string} req.body.currentPassword - Senha atual
   * @param {string} req.body.newPassword - Nova senha
   * @returns {Object} Mensagem de confirmacao
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      // req.user e adicionado pelo authMiddleware
      const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
      return successResponse(res, 200, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retorna os dados do usuario logado
   *
   * @route GET /api/auth/me
   * @requires Autenticacao - Header Authorization com token JWT
   * @returns {Object} Dados do usuario (sem senha)
   */
  async getProfile(req, res, next) {
    try {
      // req.user.id vem do authMiddleware apos validar o token
      const user = await authService.getProfile(req.user.id);
      return successResponse(res, 200, 'Perfil obtido com sucesso', { user });
    } catch (error) {
      next(error);
    }
  }
}

// Exporta uma instancia unica do controller (Singleton)
module.exports = new AuthController();
