/**
 * ============================================
 * ARQUIVO: cartController.js
 * DESCRICAO: Controlador do carrinho de compras
 * ============================================
 *
 * Responsavel por receber requisicoes HTTP relacionadas
 * ao carrinho de compras e delegar para o CartService.
 *
 * Todas as rotas requerem autenticacao (token JWT valido).
 * O carrinho e persistido no banco de dados, associado ao usuario.
 *
 * Endpoints tratados:
 * - GET /api/cart - Obter carrinho do usuario
 * - POST /api/cart/items - Adicionar item
 * - PUT /api/cart/items/:itemId - Atualizar item
 * - DELETE /api/cart/items/:itemId - Remover item
 * - DELETE /api/cart - Limpar carrinho
 */

const cartService = require('../services/cartService');
const { successResponse } = require('../utils/responseHandler');

class CartController {
  /**
   * Obtem o carrinho do usuario logado
   *
   * Retorna:
   * - items: Array de itens com produto, quantidade, subtotal
   * - total: Valor total do carrinho
   * - itemCount: Quantidade de itens
   *
   * Se usuario nao tiver carrinho, cria um vazio automaticamente
   *
   * @param {Object} req - Request com req.user (do authMiddleware)
   * @param {Object} res - Response do Express
   * @param {Function} next - Middleware de erro
   */
  async getCart(req, res, next) {
    try {
      // req.user.id vem do token JWT validado pelo authMiddleware
      const cart = await cartService.getCart(req.user.id);
      return successResponse(res, 200, 'Carrinho obtido com sucesso', { cart });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Adiciona um item ao carrinho
   *
   * Se o produto ja estiver no carrinho, incrementa a quantidade.
   * Valida se o produto existe e esta disponivel.
   *
   * Body esperado:
   * - productId: ID do produto (obrigatorio)
   * - quantity: Quantidade (default: 1)
   * - notes: Observacoes do item (ex: "sem cebola")
   *
   * @param {Object} req - Request com body e req.user
   * @param {Object} res - Response do Express
   * @param {Function} next - Middleware de erro
   */
  async addItem(req, res, next) {
    try {
      const { productId, quantity, notes } = req.body;
      // Service adiciona item e retorna carrinho atualizado
      const cart = await cartService.addItem(req.user.id, productId, quantity, notes);
      return successResponse(res, 200, 'Item adicionado ao carrinho', { cart });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza um item do carrinho
   *
   * Permite alterar quantidade e/ou observacoes.
   * Se quantidade for 0, remove o item.
   *
   * Body esperado:
   * - quantity: Nova quantidade (opcional)
   * - notes: Novas observacoes (opcional)
   *
   * @param {Object} req - Request com params.itemId e body
   * @param {Object} res - Response do Express
   * @param {Function} next - Middleware de erro
   */
  async updateItem(req, res, next) {
    try {
      const { itemId } = req.params;
      const { quantity, notes } = req.body;
      const cart = await cartService.updateItem(req.user.id, itemId, quantity, notes);
      return successResponse(res, 200, 'Item atualizado', { cart });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove um item do carrinho
   *
   * @param {Object} req - Request com params.itemId
   * @param {Object} res - Response do Express
   * @param {Function} next - Middleware de erro
   */
  async removeItem(req, res, next) {
    try {
      const { itemId } = req.params;
      const cart = await cartService.removeItem(req.user.id, itemId);
      return successResponse(res, 200, 'Item removido do carrinho', { cart });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Limpa todos os itens do carrinho
   *
   * Usado principalmente apos finalizar um pedido,
   * mas tambem disponivel para o usuario limpar manualmente
   *
   * @param {Object} req - Request com req.user
   * @param {Object} res - Response do Express
   * @param {Function} next - Middleware de erro
   */
  async clearCart(req, res, next) {
    try {
      const cart = await cartService.clearCart(req.user.id);
      return successResponse(res, 200, 'Carrinho limpo', { cart });
    } catch (error) {
      next(error);
    }
  }
}

// Exporta instancia unica (Singleton)
module.exports = new CartController();
