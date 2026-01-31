/**
 * ============================================
 * ARQUIVO: orderService.js
 * DESCRICAO: Servico de pedidos
 * ============================================
 *
 * Gerencia toda a logica de pedidos:
 * - Criacao de pedidos a partir do carrinho
 * - Listagem de pedidos (usuario e admin)
 * - Cancelamento de pedidos
 * - Atualizacao de status (admin)
 *
 * Fluxo de status:
 * PENDENTE -> EM_PREPARO -> PRONTO -> ENTREGUE
 *          -> CANCELADO (pode ser de qualquer status)
 */

const prisma = require('../config/database');
const { ORDER_STATUS, VALID_STATUS_TRANSITIONS } = require('../utils/constants');

class OrderService {
  /**
   * Cria pedido a partir do carrinho do usuario
   *
   * Processo:
   * 1. Valida se carrinho tem itens
   * 2. Verifica disponibilidade dos produtos
   * 3. Gera numero sequencial do pedido
   * 4. Cria pedido com itens (salva preco no momento)
   * 5. Limpa o carrinho
   *
   * Tudo em uma transacao para garantir consistencia.
   *
   * @param {string} userId - ID do usuario
   * @param {string} [notes=null] - Observacoes do pedido
   * @returns {Object} Pedido criado
   * @throws {Error} 400 se carrinho vazio ou produto indisponivel
   */
  async createFromCart(userId, notes = null) {
    // Busca carrinho com itens e produtos
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Valida se carrinho tem itens
    if (!cart || cart.items.length === 0) {
      const error = new Error('Carrinho vazio');
      error.statusCode = 400;
      throw error;
    }

    // Verifica se todos os produtos ainda estao disponiveis
    for (const item of cart.items) {
      if (!item.product.isAvailable) {
        const error = new Error(`Produto "${item.product.name}" nao esta mais disponivel`);
        error.statusCode = 400;
        throw error;
      }
    }

    // Prepara dados dos itens do pedido
    // Importante: salva nome e preco no momento da compra
    // para manter historico mesmo se produto for alterado depois
    let totalAmount = 0;
    const orderItems = cart.items.map((item) => {
      const itemTotal = item.product.price * item.quantity;
      totalAmount += itemTotal;

      return {
        productId: item.productId,
        productName: item.product.name, // Salva nome atual
        quantity: item.quantity,
        unitPrice: item.product.price,  // Salva preco atual
        totalPrice: itemTotal,
        notes: item.notes,
      };
    });

    // Cria pedido em transacao atomica
    const order = await prisma.$transaction(async (tx) => {
      // Gera numero sequencial do pedido usando contador
      // Upsert: cria se nao existe, incrementa se existe
      const counter = await tx.counter.upsert({
        where: { id: 'order_counter' },
        update: { value: { increment: 1 } },
        create: { id: 'order_counter', value: 1 },
      });

      // Cria o pedido com itens e historico inicial
      const newOrder = await tx.order.create({
        data: {
          orderNumber: counter.value,
          userId,
          totalAmount,
          notes,
          status: ORDER_STATUS.PENDENTE,
          // Cria itens do pedido
          items: {
            create: orderItems,
          },
          // Cria primeiro registro no historico de status
          statusHistory: {
            create: {
              status: ORDER_STATUS.PENDENTE,
              notes: 'Pedido criado',
            },
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      });

      // Limpa carrinho apos criar pedido
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    return order;
  }

  /**
   * Lista pedidos do usuario com filtros e paginacao
   *
   * @param {string} userId - ID do usuario
   * @param {Object} filters - Filtros de busca
   * @param {string} [filters.status] - Filtrar por status
   * @param {number} [filters.page=1] - Pagina atual
   * @param {number} [filters.limit=20] - Itens por pagina
   * @returns {Object} { orders, pagination }
   */
  async getUserOrders(userId, filters = {}) {
    const { status, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    // Sempre filtra pelo usuario logado
    const where = { userId };

    // Adiciona filtro de status se informado
    if (status) {
      where.status = status;
    }

    // Executa busca e contagem em paralelo
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: { imageUrl: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' }, // Mais recentes primeiro
        skip,
        take: Number(limit),
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Busca detalhes de um pedido
   *
   * Cliente so pode ver seus proprios pedidos.
   * Admin pode ver qualquer pedido.
   *
   * @param {string} id - ID do pedido
   * @param {string} userId - ID do usuario logado
   * @param {boolean} [isAdmin=false] - Se usuario e admin
   * @returns {Object} Pedido com itens e historico
   * @throws {Error} 404 se pedido nao encontrado
   */
  async getById(id, userId, isAdmin = false) {
    const where = { id };

    // Se nao for admin, filtra pelo usuario
    if (!isAdmin) {
      where.userId = userId;
    }

    const order = await prisma.order.findFirst({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                category: { select: { name: true } },
              },
            },
          },
        },
        // Dados do cliente (util para admin)
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        // Historico de mudancas de status
        statusHistory: {
          orderBy: { changedAt: 'desc' },
        },
      },
    });

    if (!order) {
      const error = new Error('Pedido nao encontrado');
      error.statusCode = 404;
      throw error;
    }

    return order;
  }

  /**
   * Cancela um pedido do usuario
   *
   * So permite cancelar pedidos com status PENDENTE.
   * Pedidos em preparo ou posteriores nao podem ser cancelados.
   *
   * @param {string} id - ID do pedido
   * @param {string} userId - ID do usuario
   * @returns {Object} Pedido cancelado
   * @throws {Error} 404 se pedido nao encontrado
   * @throws {Error} 400 se pedido nao esta pendente
   */
  async cancel(id, userId) {
    // Busca pedido do usuario
    const order = await prisma.order.findFirst({
      where: { id, userId },
    });

    if (!order) {
      const error = new Error('Pedido nao encontrado');
      error.statusCode = 404;
      throw error;
    }

    // Valida se pode cancelar
    if (order.status !== ORDER_STATUS.PENDENTE) {
      const error = new Error('Apenas pedidos pendentes podem ser cancelados');
      error.statusCode = 400;
      throw error;
    }

    // Atualiza status e registra no historico
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: ORDER_STATUS.CANCELADO,
        cancelledAt: new Date(),
        statusHistory: {
          create: {
            status: ORDER_STATUS.CANCELADO,
            notes: 'Cancelado pelo cliente',
          },
        },
      },
      include: {
        items: true,
      },
    });

    return updatedOrder;
  }

  /**
   * Lista todos os pedidos do sistema (ADMIN)
   *
   * @param {Object} filters - Filtros de busca
   * @param {string} [filters.status] - Filtrar por status
   * @param {string} [filters.date] - Filtrar por data (YYYY-MM-DD)
   * @param {number} [filters.page=1] - Pagina atual
   * @param {number} [filters.limit=20] - Itens por pagina
   * @returns {Object} { orders, pagination }
   */
  async getAll(filters = {}) {
    const { status, date, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where = {};

    // Filtro por status
    if (status) {
      where.status = status;
    }

    // Filtro por data (dia inteiro)
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.createdAt = {
        gte: startOfDay, // >= inicio do dia
        lte: endOfDay,   // <= fim do dia
      };
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Atualiza status do pedido (ADMIN)
   *
   * Valida transicoes de status permitidas.
   * Registra alteracao no historico com quem fez.
   *
   * Transicoes validas:
   * - PENDENTE -> EM_PREPARO, CANCELADO
   * - EM_PREPARO -> PRONTO, CANCELADO
   * - PRONTO -> ENTREGUE, CANCELADO
   * - ENTREGUE -> (nenhuma)
   * - CANCELADO -> (nenhuma)
   *
   * @param {string} id - ID do pedido
   * @param {string} newStatus - Novo status
   * @param {string} adminId - ID do admin fazendo alteracao
   * @param {string} [notes=null] - Observacoes da alteracao
   * @returns {Object} Pedido atualizado
   * @throws {Error} 404 se pedido nao encontrado
   * @throws {Error} 400 se transicao de status invalida
   */
  async updateStatus(id, newStatus, adminId, notes = null) {
    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      const error = new Error('Pedido nao encontrado');
      error.statusCode = 404;
      throw error;
    }

    // Valida se a transicao de status e permitida
    const validTransitions = VALID_STATUS_TRANSITIONS[order.status];

    if (!validTransitions.includes(newStatus)) {
      const error = new Error(`Nao e possivel mudar de ${order.status} para ${newStatus}`);
      error.statusCode = 400;
      throw error;
    }

    // Prepara dados de atualizacao
    const updateData = {
      status: newStatus,
      // Registra alteracao no historico
      statusHistory: {
        create: {
          status: newStatus,
          changedBy: adminId, // Quem fez a alteracao
          notes,
        },
      },
    };

    // Adiciona timestamp especifico conforme o status
    if (newStatus === ORDER_STATUS.EM_PREPARO) updateData.preparedAt = new Date();
    if (newStatus === ORDER_STATUS.PRONTO) updateData.readyAt = new Date();
    if (newStatus === ORDER_STATUS.ENTREGUE) updateData.deliveredAt = new Date();
    if (newStatus === ORDER_STATUS.CANCELADO) updateData.cancelledAt = new Date();

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { name: true, email: true } },
        items: true,
        statusHistory: { orderBy: { changedAt: 'desc' } },
      },
    });

    return updatedOrder;
  }
}

// Exporta instancia unica (Singleton)
module.exports = new OrderService();
