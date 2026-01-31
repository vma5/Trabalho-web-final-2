/**
 * ============================================
 * ARQUIVO: dashboardController.js
 * DESCRICAO: Controlador do dashboard administrativo
 * ============================================
 *
 * Responsavel por fornecer estatisticas e relatorios
 * para o painel administrativo.
 *
 * Todas as rotas requerem autenticacao como ADMIN.
 *
 * Endpoints tratados:
 * - GET /api/dashboard/stats - Estatisticas gerais
 * - GET /api/dashboard/sales - Vendas por periodo
 * - GET /api/dashboard/top-products - Produtos mais vendidos
 * - GET /api/dashboard/peak-hours - Horarios de pico
 * - GET /api/dashboard/orders-by-status - Pedidos por status
 * - GET /api/dashboard/recent-orders - Pedidos recentes
 */

const dashboardService = require('../services/dashboardService');
const { successResponse } = require('../utils/responseHandler');

class DashboardController {
  /**
   * Retorna estatisticas gerais do sistema
   *
   * Dados retornados:
   * - totalVendasHoje: Valor total vendido no dia
   * - pedidosHoje: Quantidade de pedidos do dia
   * - pedidosPendentes: Pedidos aguardando preparo
   * - totalUsuarios: Total de usuarios cadastrados
   *
   * @param {Object} req - Request do Express
   * @param {Object} res - Response do Express
   * @param {Function} next - Middleware de erro
   */
  async getStats(req, res, next) {
    try {
      const stats = await dashboardService.getStats();
      return successResponse(res, 200, 'Estatisticas obtidas', { stats });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retorna vendas agrupadas por dia em um periodo
   *
   * Query params:
   * - startDate: Data inicial (formato: YYYY-MM-DD)
   * - endDate: Data final (formato: YYYY-MM-DD)
   *
   * Se nao informado, usa os ultimos 30 dias como padrao.
   *
   * Retorna array com { data, total, quantidade }
   *
   * @param {Object} req - Request com query params de datas
   * @param {Object} res - Response do Express
   * @param {Function} next - Middleware de erro
   */
  async getSales(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      // Define periodo padrao: ultimos 30 dias
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate
        ? new Date(startDate)
        : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

      const sales = await dashboardService.getSalesByPeriod(start, end);
      return successResponse(res, 200, 'Vendas por periodo', { sales });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retorna produtos mais vendidos
   *
   * Query params:
   * - limit: Quantidade de produtos (default: 10)
   *
   * Retorna array com { produto, quantidade, totalVendido }
   *
   * @param {Object} req - Request com query.limit opcional
   * @param {Object} res - Response do Express
   * @param {Function} next - Middleware de erro
   */
  async getTopProducts(req, res, next) {
    try {
      // Converte para numero ou usa 10 como padrao
      const limit = parseInt(req.query.limit) || 10;
      const topProducts = await dashboardService.getTopProducts(limit);
      return successResponse(res, 200, 'Produtos mais vendidos', { topProducts });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retorna horarios de maior movimento
   *
   * Analisa historico de pedidos para identificar
   * horarios com maior volume de pedidos.
   *
   * Util para planejamento de funcionarios.
   *
   * @param {Object} req - Request do Express
   * @param {Object} res - Response do Express
   * @param {Function} next - Middleware de erro
   */
  async getPeakHours(req, res, next) {
    try {
      const peakHours = await dashboardService.getPeakHours();
      return successResponse(res, 200, 'Horarios de pico', { peakHours });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retorna quantidade de pedidos por status
   *
   * Retorna objeto com contagem para cada status:
   * - PENDENTE
   * - EM_PREPARO
   * - PRONTO
   * - ENTREGUE
   * - CANCELADO
   *
   * @param {Object} req - Request do Express
   * @param {Object} res - Response do Express
   * @param {Function} next - Middleware de erro
   */
  async getOrdersByStatus(req, res, next) {
    try {
      const ordersByStatus = await dashboardService.getOrdersByStatus();
      return successResponse(res, 200, 'Pedidos por status', { ordersByStatus });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retorna pedidos mais recentes
   *
   * Query params:
   * - limit: Quantidade de pedidos (default: 10)
   *
   * Retorna pedidos ordenados do mais recente
   * Inclui dados do usuario e resumo dos itens
   *
   * @param {Object} req - Request com query.limit opcional
   * @param {Object} res - Response do Express
   * @param {Function} next - Middleware de erro
   */
  async getRecentOrders(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const recentOrders = await dashboardService.getRecentOrders(limit);
      return successResponse(res, 200, 'Pedidos recentes', { recentOrders });
    } catch (error) {
      next(error);
    }
  }
}

// Exporta instancia unica (Singleton)
module.exports = new DashboardController();
