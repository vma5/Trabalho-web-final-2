/**
 * ============================================
 * ARQUIVO: authService.js
 * DESCRICAO: Servico de autenticacao
 * ============================================
 *
 * Contem toda a logica de negocio relacionada a autenticacao:
 * - Cadastro de usuarios com hash de senha
 * - Login com validacao de credenciais
 * - Geracao de tokens JWT
 * - Recuperacao e alteracao de senha
 */

const bcrypt = require('bcrypt');      // Biblioteca para hash de senhas
const jwt = require('jsonwebtoken');   // Biblioteca para tokens JWT
const crypto = require('crypto');      // Modulo nativo para gerar tokens aleatorios
const prisma = require('../config/database'); // Cliente do Prisma
const { USER_ROLES } = require('../utils/constants');

// ============================================
// CONSTANTES DE CONFIGURACAO
// ============================================

const SALT_ROUNDS = 10;  // Numero de rounds para o bcrypt (mais alto = mais seguro, mais lento)
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';  // Tempo de expiracao do token
const RESET_TOKEN_EXPIRES_IN = 60 * 60 * 1000; // 1 hora em milissegundos

class AuthService {
  /**
   * Cadastra um novo usuario no sistema
   *
   * Processo:
   * 1. Verifica se email ja existe
   * 2. Faz hash da senha com bcrypt
   * 3. Cria usuario no banco (transacao)
   * 4. Cria carrinho vazio para o usuario
   * 5. Gera token JWT
   *
   * @param {Object} userData - Dados do usuario
   * @param {string} userData.email - Email unico
   * @param {string} userData.password - Senha em texto puro
   * @param {string} userData.name - Nome completo
   * @param {string} [userData.phone] - Telefone opcional
   * @returns {Object} Usuario (sem senha) e token JWT
   * @throws {Error} 409 se email ja cadastrado
   */
  async register(userData) {
    const { email, password, name, phone } = userData;

    // Verifica se email ja existe no banco
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const error = new Error('Este email ja esta cadastrado');
      error.statusCode = 409; // Conflict
      throw error;
    }

    // Gera hash da senha (nunca salvar senha em texto puro!)
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Usa transacao para garantir que usuario e carrinho sejam criados juntos
    // Se um falhar, ambos sao revertidos
    const user = await prisma.$transaction(async (tx) => {
      // Cria o usuario
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          phone: phone || null,
          role: USER_ROLES.CLIENTE, // Novos usuarios sempre sao clientes
        },
      });

      // Cria carrinho vazio para o usuario
      await tx.cart.create({
        data: { userId: newUser.id },
      });

      return newUser;
    });

    // Gera token JWT para o usuario
    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user), // Remove senha antes de retornar
      token,
    };
  }

  /**
   * Autentica um usuario com email e senha
   *
   * Processo:
   * 1. Busca usuario pelo email
   * 2. Verifica se conta esta ativa
   * 3. Compara senha com hash salvo
   * 4. Gera token JWT se credenciais validas
   *
   * @param {string} email - Email do usuario
   * @param {string} password - Senha em texto puro
   * @returns {Object} Usuario (sem senha) e token JWT
   * @throws {Error} 401 se credenciais invalidas
   * @throws {Error} 403 se conta desativada
   */
  async login(email, password) {
    // Busca usuario pelo email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Usuario nao encontrado
    if (!user) {
      const error = new Error('Email ou senha invalidos');
      error.statusCode = 401; // Unauthorized
      throw error;
    }

    // Verifica se conta esta ativa
    if (!user.isActive) {
      const error = new Error('Conta desativada. Entre em contato com o suporte.');
      error.statusCode = 403; // Forbidden
      throw error;
    }

    // Compara senha informada com hash salvo no banco
    // bcrypt.compare() faz a comparacao de forma segura
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      const error = new Error('Email ou senha invalidos');
      error.statusCode = 401;
      throw error;
    }

    // Gera token JWT para o usuario autenticado
    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Inicia processo de recuperacao de senha
   *
   * Gera um token aleatorio e salva no banco com expiracao.
   * Em producao, enviaria email com link contendo o token.
   *
   * @param {string} email - Email do usuario
   * @returns {Object} Mensagem generica (nao revela se email existe)
   */
  async forgotPassword(email) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Retorna mensagem generica mesmo se email nao existe
    // Isso evita que atacantes descubram emails cadastrados
    if (!user) {
      return { message: 'Se o email existir, voce recebera um link de recuperacao.' };
    }

    // Gera token aleatorio de 32 bytes (64 caracteres hex)
    const resetToken = crypto.randomBytes(32).toString('hex');
    // Define expiracao do token (1 hora)
    const resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_EXPIRES_IN);

    // Salva token no banco
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // TODO: Em producao, enviar email com link de recuperacao
    // Ex: https://cantina.com/reset-password?token=xxxxx
    console.log(`Reset token para ${email}: ${resetToken}`);

    return { message: 'Se o email existir, voce recebera um link de recuperacao.' };
  }

  /**
   * Redefine a senha usando token de recuperacao
   *
   * @param {string} token - Token de recuperacao
   * @param {string} newPassword - Nova senha
   * @returns {Object} Mensagem de confirmacao
   * @throws {Error} 400 se token invalido ou expirado
   */
  async resetPassword(token, newPassword) {
    // Busca usuario com token valido (nao expirado)
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(), // gt = greater than (maior que data atual)
        },
      },
    });

    if (!user) {
      const error = new Error('Token invalido ou expirado');
      error.statusCode = 400;
      throw error;
    }

    // Gera hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Atualiza senha e remove token de recuperacao
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,        // Invalida o token
        resetTokenExpiry: null,
      },
    });

    return { message: 'Senha alterada com sucesso' };
  }

  /**
   * Altera a senha do usuario logado
   *
   * @param {string} userId - ID do usuario
   * @param {string} currentPassword - Senha atual
   * @param {string} newPassword - Nova senha
   * @returns {Object} Mensagem de confirmacao
   * @throws {Error} 401 se senha atual incorreta
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // Verifica se senha atual esta correta
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      const error = new Error('Senha atual incorreta');
      error.statusCode = 401;
      throw error;
    }

    // Gera hash da nova senha e atualiza
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Senha alterada com sucesso' };
  }

  /**
   * Busca perfil do usuario por ID
   *
   * @param {string} userId - ID do usuario
   * @returns {Object} Dados do usuario (sem senha)
   * @throws {Error} 404 se usuario nao encontrado
   */
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const error = new Error('Usuario nao encontrado');
      error.statusCode = 404;
      throw error;
    }

    return this.sanitizeUser(user);
  }

  /**
   * Gera token JWT para o usuario
   *
   * O token contem:
   * - userId: ID do usuario
   * - email: Email do usuario
   * - role: Papel (CLIENTE ou ADMIN)
   *
   * @param {Object} user - Objeto do usuario
   * @returns {string} Token JWT assinado
   */
  generateToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET, // Chave secreta para assinar o token
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  /**
   * Remove dados sensiveis do objeto usuario
   *
   * NUNCA retornar senha ou tokens para o cliente!
   *
   * @param {Object} user - Objeto do usuario completo
   * @returns {Object} Usuario sem dados sensiveis
   */
  sanitizeUser(user) {
    // Desestrutura para remover campos sensiveis
    const { password, resetToken, resetTokenExpiry, ...safeUser } = user;
    return safeUser;
  }
}

// Exporta instancia unica (Singleton)
module.exports = new AuthService();
