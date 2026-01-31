/**
 * ============================================
 * ARQUIVO: orderController.js
 * DESCRICAO: Controlador de pedidos
 * ============================================
 *
 * Responsavel por receber requisicoes HTTP relacionadas
 * a pedidos e delegar para o OrderService.
 *
 * Endpoints Cliente (requer autenticacao):
 * - POST /api/orders - Criar pedido a partir do carrinho
 * - GET /api/orders - Listar meus pedidos
 * - GET /api/orders/:id - Detalhes de um pedido
 * - PATCH /api/orders/:id/cancel - Cancelar pedido
 *
 * Endpoints Admin (requer admin):
 * - GET /api/orders/admin/all - Listar todos os pedidos
 * - PATCH /api/orders/admin/:id/status - Atualizar status
 */

const orderService = require('../services/orderService');
const { successResponse } = require('../utils/responseHandler');

class OrderController {
  /**
   * Cria um novo pedido a partir do carrinho do usuario
   *
   * O pedido e criado com os itens do carrinho atual.
   * Apos criacao, o carrinho e limpo automaticamente.
   *
   * Body esperado:
   * - notes: Observacoes do pedido (opcional)
   *   Ex: "Entregar no bloco B"
   *
   * Retorna o pedido criado com numero sequencial unico
   *
   * @param {Object} req - Request com body.notes e req.user
   * @param {Object} res - Response do Express
   * @param {Function} next - Middleware de erro
   */
  async createOrder(req, res, next) {
    try {
      const { notes } = req.body;
      const order = await orderService.createFromCart(req.user.id, notes);
      return successResponse(res, 201, 'Pedido criado com sucesso', { order });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lista os pedidos do usuario logado
   *
   * Query params aceitos:
   * - status: Filtrar por status (PENDENTE, EM_PREPARO, etc)
   * - page: Numero da pagina
   * - limit: Itens por pagina
   *
   * Retorna pedidos ordenados do mais recente para o mais antigo
   *
   * @param {Object} req - Request com query params e req.user
   * @param {Object} res - Response do Express
   * @param {Function} next - Middleware de erro
   */
  async getMyOrders(req, res, next) {
    try {
      const result = await orderService.getUserOrders(req.user.id, req.query);
      return successResponse(res, 200, 'Pedidos encontrados', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Busca detalhes de um pedido especifico
   *
   * Cliente so pode ver seus proprios pedidos.
   * Admin pode ver qualquer pedido.
   *
   * Retorna pedido com:
   * - Dados basicos (numero, status, total)
   * - Itens com detalhes do produto
   * - Historico de status (se admin)
   *
   * @param {Object} req - Request com params.id e req.user
   * @param {Object} res - Response do Express
   * @param {Function} next - Middleware de erro
   */
  async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      // Verifica se usuario e admin para permitir acesso total
      const isAdmin = req.user.role === 'ADMIN';
      const order = await orderService.getById(id, req.user.id, isAdmin);
      return successResponse(res, 200, 'Pedido encontrado', { order });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancela um pedido do usuario
   *
   * So permite cancelar se:
   * - O pedido pertence ao usuario
   * - O status e PENDENTE (ainda nao comecou preparo)
   *
   * Apos cancelar, nao pode ser revertido
   *
   * @param {Object} req - Request com params.id e req.user
   * @param {Object} res - Response do Express
   * @param {Function} next - Middleware de erro
   */
  async cancelOrder(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderService.cancel(id, req.user.id);
      return successResponse(res, 200, 'Pedido cancelado', { order });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lista todos os pedidos do sistema (ADMIN)
   *
   * Query params aceitos:
   * - status: Filtrar por status
   * - userId: Filtrar por usuario
   * - startDate: Data inicial
   * - endDate: Data final
   * - page: Numero da pagina
   * - limit: Itens por pagina
   *
   * @param {Object} req - Request com query params
   * @param {Object} res - Response do Express
   * @param {Function} next - Middleware de erro
   */
  async getAllOrders(req, res, next) {
    try {
      const result = await orderService.getAll(req.query);
      return successResponse(res, 200, 'Pedidos encontrados', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza o status de um pedido (ADMIN)
   *
   * Status possiveis (em ordem):
   * 1. PENDENTE - Pedido recebido
   * 2. EM_PREPARO - Cozinha preparando
   * 3. PRONTO - Pronto para retirada
   * 4. ENTREGUE - Entregue ao cliente
   * 5. CANCELADO - Cancelado (admin pode cancelar qualquer status)
   *
   * Body esperado:
   * - status: Novo status (obrigatorio)
   * - notes: Observacao da mudanca (opcional)
   *
   * @param {Object} req - Request com params.id e body
   * @param {Object} res - Response do Express
   * @param {Function} next - Middleware de erro
   */
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      // Registra quem fez a alteracao (req.user.id)
      const order = await orderService.updateStatus(id, status, req.user.id, notes);
      return successResponse(res, 200, 'Status atualizado', { order });
    } catch (error) {
      next(error);
    }
  }
}

// Exporta instancia unica (Singleton)
module.exports = new OrderController();
