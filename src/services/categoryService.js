/**
 * ============================================
 * ARQUIVO: categoryService.js
 * DESCRICAO: Servico de categorias
 * ============================================
 *
 * Contem toda a logica de negocio relacionada a categorias:
 * - Listagem de categorias
 * - CRUD completo
 * - Reordenacao de categorias no cardapio
 *
 * Categorias organizam os produtos do cardapio
 * Ex: Lanches, Bebidas, Sobremesas, etc.
 */

const prisma = require('../config/database');

class CategoryService {
  /**
   * Lista todas as categorias
   *
   * Por padrao retorna apenas categorias ativas.
   * Admin pode solicitar todas incluindo inativas.
   *
   * @param {boolean} [includeInactive=false] - Incluir categorias inativas
   * @returns {Array} Lista de categorias com contagem de produtos
   */
  async getAll(includeInactive = false) {
    // Se includeInactive=true, where fica vazio (sem filtro)
    const where = includeInactive ? {} : { isActive: true };

    const categories = await prisma.category.findMany({
      where,
      orderBy: { sortOrder: 'asc' }, // Ordena pela ordem definida pelo admin
      include: {
        // Inclui contagem de produtos em cada categoria
        _count: {
          select: { products: true },
        },
      },
    });

    return categories;
  }

  /**
   * Busca uma categoria pelo ID
   * Inclui os produtos da categoria na resposta
   *
   * @param {string} id - ID da categoria (UUID)
   * @returns {Object} Categoria com lista de produtos disponiveis
   * @throws {Error} 404 se categoria nao encontrada
   */
  async getById(id) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        // Inclui produtos disponiveis da categoria
        products: {
          where: { isAvailable: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!category) {
      const error = new Error('Categoria nao encontrada');
      error.statusCode = 404;
      throw error;
    }

    return category;
  }

  /**
   * Cria uma nova categoria
   *
   * A ordem (sortOrder) e automaticamente definida
   * como a ultima posicao + 1
   *
   * @param {Object} data - Dados da categoria
   * @param {string} data.name - Nome da categoria
   * @param {string} [data.description] - Descricao
   * @param {string} [data.imageUrl] - URL da imagem
   * @returns {Object} Categoria criada
   */
  async create(data) {
    const { name, description, imageUrl } = data;

    // Busca maior sortOrder atual para colocar nova categoria no final
    const maxOrder = await prisma.category.aggregate({
      _max: { sortOrder: true },
    });

    const category = await prisma.category.create({
      data: {
        name,
        description,
        imageUrl,
        // Nova categoria vai para o final da lista
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
      },
    });

    return category;
  }

  /**
   * Atualiza dados de uma categoria
   *
   * @param {string} id - ID da categoria
   * @param {Object} data - Dados para atualizar
   * @returns {Object} Categoria atualizada
   */
  async update(id, data) {
    const category = await prisma.category.update({
      where: { id },
      data,
    });

    return category;
  }

  /**
   * Desativa uma categoria (soft delete)
   *
   * Nao exclui fisicamente para manter produtos associados.
   * Apenas marca isActive como false.
   *
   * @param {string} id - ID da categoria
   * @returns {Object} Categoria desativada
   */
  async delete(id) {
    // Soft delete - apenas desativa a categoria
    const category = await prisma.category.update({
      where: { id },
      data: { isActive: false },
    });

    return category;
  }

  /**
   * Reordena as categorias no cardapio
   *
   * Recebe array de IDs na ordem desejada e atualiza
   * o campo sortOrder de cada categoria conforme posicao.
   *
   * Usa transacao para garantir atomicidade - todas as
   * atualizacoes sao feitas juntas ou nenhuma e feita.
   *
   * @param {Array<string>} orderedIds - Array de IDs na nova ordem
   * @returns {Array} Lista de categorias na nova ordem
   */
  async reorder(orderedIds) {
    // Cria array de operacoes de update
    const updates = orderedIds.map((id, index) =>
      prisma.category.update({
        where: { id },
        data: { sortOrder: index + 1 }, // sortOrder comeca em 1
      })
    );

    // Executa todas as atualizacoes em uma transacao
    await prisma.$transaction(updates);

    // Retorna categorias na nova ordem
    return this.getAll(true);
  }
}

// Exporta instancia unica (Singleton)
module.exports = new CategoryService();
