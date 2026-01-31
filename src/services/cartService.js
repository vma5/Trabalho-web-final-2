/**
 * ============================================
 * ARQUIVO: cartService.js
 * DESCRICAO: Servico do carrinho de compras
 * ============================================
 *
 * Gerencia toda a logica do carrinho de compras:
 * - Obter carrinho do usuario
 * - Adicionar itens ao carrinho
 * - Atualizar quantidade de itens
 * - Remover itens
 * - Limpar carrinho
 *
 * O carrinho e persistido no banco de dados,
 * vinculado ao usuario logado.
 */

const prisma = require('../config/database');

class CartService {
  /**
   * Obtem o carrinho do usuario
   *
   * Se o usuario nao tiver carrinho, cria um vazio.
   * Calcula total e quantidade de itens automaticamente.
   *
   * @param {string} userId - ID do usuario
   * @returns {Object} Carrinho com items, total e itemCount
   */
  async getCart(userId) {
    // Busca carrinho com todos os itens e dados dos produtos
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            // Inclui produto completo com categoria
            product: {
              include: {
                category: {
                  select: { name: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' }, // Mais recentes primeiro
        },
      },
    });

    // Se usuario nao tem carrinho, cria um vazio
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
      });
    }

    // Calcula valor total do carrinho
    const total = cart.items.reduce((sum, item) => {
      return sum + item.product.price * item.quantity;
    }, 0);

    // Retorna carrinho com total e contagem de itens
    return {
      ...cart,
      total,
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }

  /**
   * Adiciona um item ao carrinho
   *
   * Se o produto ja estiver no carrinho, incrementa a quantidade.
   * Valida se produto existe e esta disponivel.
   *
   * @param {string} userId - ID do usuario
   * @param {string} productId - ID do produto
   * @param {number} [quantity=1] - Quantidade a adicionar
   * @param {string} [notes=null] - Observacoes do item
   * @returns {Object} Carrinho atualizado
   * @throws {Error} 404 se produto nao encontrado
   * @throws {Error} 400 se produto indisponivel
   */
  async addItem(userId, productId, quantity = 1, notes = null) {
    // Verifica se produto existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      const error = new Error('Produto nao encontrado');
      error.statusCode = 404;
      throw error;
    }

    // Verifica se produto esta disponivel
    if (!product.isAvailable) {
      const error = new Error('Produto nao disponivel');
      error.statusCode = 400;
      throw error;
    }

    // Obtem ou cria carrinho do usuario
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    // Verifica se produto ja esta no carrinho
    // Usa chave composta cartId + productId para busca unica
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    let cartItem;

    if (existingItem) {
      // Produto ja existe - incrementa quantidade
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
          notes: notes || existingItem.notes, // Mantem nota anterior se nao informada
        },
        include: {
          product: true,
        },
      });
    } else {
      // Produto novo - cria item no carrinho
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          notes,
        },
        include: {
          product: true,
        },
      });
    }

    // Retorna carrinho atualizado com totais recalculados
    return this.getCart(userId);
  }

  /**
   * Atualiza um item do carrinho
   *
   * Permite alterar quantidade e observacoes.
   * Se quantidade for 0 ou menor, remove o item.
   *
   * @param {string} userId - ID do usuario
   * @param {string} itemId - ID do item do carrinho
   * @param {number} quantity - Nova quantidade
   * @param {string} [notes] - Novas observacoes
   * @returns {Object} Carrinho atualizado
   * @throws {Error} 404 se carrinho ou item nao encontrado
   */
  async updateItem(userId, itemId, quantity, notes) {
    // Busca carrinho do usuario
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      const error = new Error('Carrinho nao encontrado');
      error.statusCode = 404;
      throw error;
    }

    // Busca item verificando se pertence ao carrinho do usuario
    const item = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id, // Garante que item pertence ao usuario
      },
    });

    if (!item) {
      const error = new Error('Item nao encontrado no carrinho');
      error.statusCode = 404;
      throw error;
    }

    if (quantity <= 0) {
      // Quantidade 0 ou negativa - remove item
      await prisma.cartItem.delete({
        where: { id: itemId },
      });
    } else {
      // Atualiza quantidade e observacoes
      await prisma.cartItem.update({
        where: { id: itemId },
        data: {
          quantity,
          // So atualiza notes se foi informado (undefined nao altera)
          ...(notes !== undefined && { notes }),
        },
      });
    }

    return this.getCart(userId);
  }

  /**
   * Remove um item do carrinho
   *
   * @param {string} userId - ID do usuario
   * @param {string} itemId - ID do item a remover
   * @returns {Object} Carrinho atualizado
   * @throws {Error} 404 se carrinho ou item nao encontrado
   */
  async removeItem(userId, itemId) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      const error = new Error('Carrinho nao encontrado');
      error.statusCode = 404;
      throw error;
    }

    // Verifica se item existe e pertence ao carrinho
    const item = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!item) {
      const error = new Error('Item nao encontrado no carrinho');
      error.statusCode = 404;
      throw error;
    }

    // Remove o item
    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    return this.getCart(userId);
  }

  /**
   * Limpa todos os itens do carrinho
   *
   * Usado apos finalizar pedido ou pelo usuario manualmente.
   *
   * @param {string} userId - ID do usuario
   * @returns {Object} Carrinho vazio
   * @throws {Error} 404 se carrinho nao encontrado
   */
  async clearCart(userId) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      const error = new Error('Carrinho nao encontrado');
      error.statusCode = 404;
      throw error;
    }

    // Remove todos os itens do carrinho de uma vez
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return this.getCart(userId);
  }
}

// Exporta instancia unica (Singleton)
module.exports = new CartService();
