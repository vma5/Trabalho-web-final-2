/**
 * ============================================
 * ARQUIVO: productService.js
 * DESCRICAO: Servico de produtos
 * ============================================
 *
 * Contem toda a logica de negocio relacionada a produtos:
 * - Listagem com filtros e paginacao
 * - Busca por ID ou categoria
 * - CRUD completo de produtos
 * - Upload e gerenciamento de imagens
 */

const prisma = require('../config/database');
const fs = require('fs');     // File System - para manipular arquivos
const path = require('path'); // Path - para caminhos de arquivos

class ProductService {
  /**
   * Lista produtos com filtros e paginacao
   *
   * @param {Object} filters - Filtros de busca
   * @param {string} [filters.categoryId] - Filtrar por categoria
   * @param {string} [filters.search] - Busca por nome ou descricao
   * @param {string} [filters.available] - 'true' ou 'false' para disponibilidade
   * @param {number} [filters.page=1] - Pagina atual
   * @param {number} [filters.limit=20] - Itens por pagina
   * @returns {Object} { products, pagination }
   */
  async getAll(filters = {}) {
    const { categoryId, search, available, page = 1, limit = 20 } = filters;

    // Calcula quantos registros pular (para paginacao)
    const skip = (page - 1) * limit;

    // Monta objeto de filtros dinamicamente
    const where = {};

    // Filtro por categoria
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Busca por texto em nome OU descricao
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Filtro de disponibilidade
    if (available !== undefined) {
      where.isAvailable = available === 'true';
    }

    // Executa query de produtos e contagem em paralelo
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          // Inclui dados basicos da categoria
          category: {
            select: { id: true, name: true },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: Number(limit),
      }),
      // Conta total para calcular paginas
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Busca um produto pelo ID
   *
   * @param {string} id - ID do produto (UUID)
   * @returns {Object} Produto com dados da categoria
   * @throws {Error} 404 se produto nao encontrado
   */
  async getById(id) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    if (!product) {
      const error = new Error('Produto nao encontrado');
      error.statusCode = 404;
      throw error;
    }

    return product;
  }

  /**
   * Lista produtos de uma categoria especifica
   * Retorna apenas produtos disponiveis
   *
   * @param {string} categoryId - ID da categoria
   * @returns {Array} Lista de produtos da categoria
   */
  async getByCategory(categoryId) {
    const products = await prisma.product.findMany({
      where: {
        categoryId,
        isAvailable: true, // Apenas disponiveis
      },
      orderBy: { name: 'asc' },
    });

    return products;
  }

  /**
   * Cria um novo produto
   *
   * @param {Object} data - Dados do produto
   * @param {string} data.name - Nome do produto
   * @param {string} [data.description] - Descricao
   * @param {number} data.price - Preco em reais
   * @param {string} data.categoryId - ID da categoria
   * @param {boolean} [data.isAvailable=true] - Se esta disponivel
   * @param {number} [data.stockQuantity] - Quantidade em estoque
   * @returns {Object} Produto criado
   * @throws {Error} 404 se categoria nao existe
   */
  async create(data) {
    const { name, description, price, categoryId, isAvailable, stockQuantity } = data;

    // Verifica se a categoria informada existe
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      const error = new Error('Categoria nao encontrada');
      error.statusCode = 404;
      throw error;
    }

    // Cria o produto no banco
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        categoryId,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        stockQuantity,
      },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    return product;
  }

  /**
   * Atualiza dados de um produto
   *
   * @param {string} id - ID do produto
   * @param {Object} data - Dados para atualizar
   * @returns {Object} Produto atualizado
   * @throws {Error} 404 se categoria informada nao existe
   */
  async update(id, data) {
    // Se estiver mudando de categoria, valida se existe
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        const error = new Error('Categoria nao encontrada');
        error.statusCode = 404;
        throw error;
      }
    }

    // Atualiza o produto
    const product = await prisma.product.update({
      where: { id },
      data,
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    return product;
  }

  /**
   * Desativa um produto (soft delete)
   *
   * Nao exclui fisicamente para manter historico de pedidos.
   * Apenas marca isAvailable como false.
   *
   * @param {string} id - ID do produto
   * @returns {Object} Produto desativado
   */
  async delete(id) {
    // Soft delete - apenas desativa o produto
    const product = await prisma.product.update({
      where: { id },
      data: { isAvailable: false },
    });

    return product;
  }

  /**
   * Atualiza apenas a disponibilidade do produto
   *
   * @param {string} id - ID do produto
   * @param {boolean} isAvailable - Nova disponibilidade
   * @returns {Object} Produto atualizado
   */
  async updateAvailability(id, isAvailable) {
    const product = await prisma.product.update({
      where: { id },
      data: { isAvailable },
    });

    return product;
  }

  /**
   * Faz upload de imagem para um produto
   *
   * Processo:
   * 1. Verifica se produto existe
   * 2. Remove imagem anterior (se houver)
   * 3. Salva caminho da nova imagem
   *
   * @param {string} id - ID do produto
   * @param {Object} file - Arquivo enviado pelo Multer
   * @param {string} file.path - Caminho temporario do arquivo
   * @param {string} file.filename - Nome do arquivo salvo
   * @returns {Object} Produto com nova imageUrl
   * @throws {Error} 404 se produto nao encontrado
   */
  async uploadImage(id, file) {
    // Busca produto atual para verificar imagem existente
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      // Remove arquivo enviado se produto nao existe
      if (file) {
        fs.unlinkSync(file.path);
      }
      const error = new Error('Produto nao encontrado');
      error.statusCode = 404;
      throw error;
    }

    // Remove imagem anterior se existir
    if (product.imageUrl) {
      const oldImagePath = path.join(__dirname, '../../', product.imageUrl);
      // Verifica se arquivo existe antes de deletar
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Monta URL relativa da nova imagem
    const imageUrl = `/uploads/products/${file.filename}`;

    // Atualiza produto com nova imagem
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { imageUrl },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    return updatedProduct;
  }
}

// Exporta instancia unica (Singleton)
module.exports = new ProductService();
