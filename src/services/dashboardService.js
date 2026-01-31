/**
 * ============================================
 * ARQUIVO: dashboardService.js
 * DESCRICAO: Servico do dashboard administrativo
 * ============================================
 *
 * Fornece estatisticas e relatorios para o painel admin:
 * - Estatisticas gerais (vendas, pedidos, usuarios)
 * - Vendas por periodo
 * - Produtos mais vendidos
 * - Horarios de pico
 * - Pedidos por status
 * - Pedidos recentes
 */

const prisma = require('../config/database');
const { ORDER_STATUS, USER_ROLES } = require('../utils/constants');

class DashboardService {
  /**
   * Retorna estatisticas gerais do sistema
   *
   * Dados retornados:
   * - orders: total, hoje, pendentes
   * - revenue: total, hoje
   * - products: total ativos
   * - users: total clientes ativos
   *
   * @returns {Object} Estatisticas gerais
   */
  async getStats() {
    // Define meia-noite de hoje para filtros do dia
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Executa todas as queries em paralelo para performance
    const [
      totalOrders,
      todayOrders,
      pendingOrders,
      totalRevenue,
      todayRevenue,
      totalProducts,
      totalUsers,
    ] = await Promise.all([
      // Total de pedidos no sistema
      prisma.order.count(),

      // Pedidos de hoje
      prisma.order.count({
        where: { createdAt: { gte: today } },
      }),

      // Pedidos pendentes ou em preparo (precisam atencao)
      prisma.order.count({
        where: { status: { in: [ORDER_STATUS.PENDENTE, ORDER_STATUS.EM_PREPARO] } },
      }),

      // Receita total (excluindo cancelados)
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { not: ORDER_STATUS.CANCELADO } },
      }),

      // Receita de hoje (excluindo cancelados)
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: today },
          status: { not: ORDER_STATUS.CANCELADO },
        },
      }),

      // Total de produtos disponiveis
      prisma.product.count({ where: { isAvailable: true } }),

      // Total de clientes ativos
      prisma.user.count({ where: { role: USER_ROLES.CLIENTE, isActive: true } }),
    ]);

    return {
      orders: {
        total: totalOrders,
        today: todayOrders,
        pending: pendingOrders,
      },
      revenue: {
        total: totalRevenue._sum.totalAmount || 0,
        today: todayRevenue._sum.totalAmount || 0,
      },
      products: totalProducts,
      users: totalUsers,
    };
  }

  /**
   * Retorna vendas agrupadas por dia em um periodo
   *
   * Util para graficos de evolucao de vendas.
   *
   * @param {Date} startDate - Data inicial
   * @param {Date} endDate - Data final
   * @returns {Array} Array com { date, ordersCount, totalAmount }
   */
  async getSalesByPeriod(startDate, endDate) {
    // Busca pedidos do periodo (excluindo cancelados)
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        status: { not: ORDER_STATUS.CANCELADO },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    });

    // Agrupa pedidos por dia
    const salesByDay = {};
    orders.forEach((order) => {
      // Extrai apenas a data (YYYY-MM-DD)
      const date = order.createdAt.toISOString().split('T')[0];

      // Inicializa dia se nao existir
      if (!salesByDay[date]) {
        salesByDay[date] = { date, ordersCount: 0, totalAmount: 0 };
      }

      // Acumula valores
      salesByDay[date].ordersCount += 1;
      salesByDay[date].totalAmount += order.totalAmount;
    });

    // Converte para array e ordena por data
    return Object.values(salesByDay).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Retorna produtos mais vendidos
   *
   * Ordena por quantidade vendida.
   * Inclui dados do produto e valor total gerado.
   *
   * @param {number} [limit=10] - Quantidade de produtos a retornar
   * @returns {Array} Array com { product, totalQuantity, totalRevenue }
   */
  async getTopProducts(limit = 10) {
    // Agrupa itens de pedido por produto
    const orderItems = await prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc', // Ordena por quantidade vendida
        },
      },
      take: limit,
    });

    // Busca dados atuais dos produtos (imagem, categoria)
    const productIds = orderItems.map((p) => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        category: { select: { name: true } },
      },
    });

    // Cria mapa para lookup rapido
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Monta resultado com dados do produto
    return orderItems.map((item) => ({
      // Usa dados atuais do produto ou nome salvo no pedido (fallback)
      product: productMap.get(item.productId) || { name: item.productName },
      totalQuantity: item._sum.quantity,
      totalRevenue: item._sum.totalPrice,
    }));
  }

  /**
   * Retorna horarios de maior movimento
   *
   * Analisa todos os pedidos e conta por hora do dia.
   * Util para planejamento de funcionarios.
   *
   * @returns {Array} Array com { hour, ordersCount } ordenado por quantidade
   */
  async getPeakHours() {
    // Busca todos os pedidos (excluindo cancelados)
    const orders = await prisma.order.findMany({
      where: {
        status: { not: ORDER_STATUS.CANCELADO },
      },
      select: {
        createdAt: true,
      },
    });

    // Inicializa contador para todas as 24 horas
    const hourCounts = {};
    for (let i = 0; i < 24; i++) {
      hourCounts[i] = 0;
    }

    // Conta pedidos por hora
    orders.forEach((order) => {
      const hour = order.createdAt.getHours();
      hourCounts[hour]++;
    });

    // Converte para array e ordena por quantidade (mais movimentados primeiro)
    return Object.entries(hourCounts)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        ordersCount: count,
      }))
      .sort((a, b) => b.ordersCount - a.ordersCount);
  }

  /**
   * Retorna quantidade de pedidos por status
   *
   * Util para visualizar distribuicao de pedidos.
   *
   * @returns {Array} Array com { status, count }
   */
  async getOrdersByStatus() {
    // Agrupa pedidos por status e conta
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    return ordersByStatus.map((item) => ({
      status: item.status,
      count: item._count.id,
    }));
  }

  /**
   * Retorna pedidos mais recentes
   *
   * Inclui dados do usuario e contagem de itens.
   *
   * @param {number} [limit=10] - Quantidade de pedidos
   * @returns {Array} Pedidos com itemCount calculado
   */
  async getRecentOrders(limit = 10) {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { name: true } },
        items: { select: { quantity: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Adiciona contagem total de itens em cada pedido
    return orders.map((order) => ({
      ...order,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    }));
  }
}

// Exporta instancia unica (Singleton)
module.exports = new DashboardService();
