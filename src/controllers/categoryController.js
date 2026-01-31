/**
 * ============================================
 * ARQUIVO: categoryController.js
 * DESCRICAO: Controlador de categorias
 * ============================================
 *
 * Responsavel por receber requisicoes HTTP relacionadas
 * a categorias de produtos e delegar para o CategoryService.
 *
 * Endpoints tratados:
 * - GET /api/categories - Listar categorias
 * - GET /api/categories/:id - Buscar por ID
 * - POST /api/categories - Criar categoria (admin)
 * - PUT /api/categories/:id - Atualizar categoria (admin)
 * - DELETE /api/categories/:id - Desativar categoria (admin)
 * - POST /api/categories/reorder - Reordenar categorias (admin)
 */

const categoryService = require('../services/categoryService');
const { successResponse } = require('../utils/responseHandler');

class CategoryController {
  /**
   * Lista todas as categorias
   *
   * Por padrao, retorna apenas categorias ativas.
   * Admin pode passar ?includeInactive=true para ver todas.
   *
   * @param {Object} req - Request com query.includeInactive opcional
   * @param {Object} res - Response do Express
   * @param {Function} next - Middleware de erro
   */
  async getAll(req, res, next) {
    try {
      // Verifica se deve incluir categorias inativas
      const includeInactive = req.query.includeInactive === 'true';
      const categories = await categoryService.getAll(includeInactive);
      return successResponse(res, 200, 'Categorias encontradas', { categories });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Busca uma categoria pelo ID
   * Inclui os produtos da categoria na resposta
   *
   * @param {Object} req - Request com params.id
   * @param {Object} res - Response do Express
   * @param {Function} next - Middleware de erro
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const category = await categoryService.getById(id);
      return successResponse(res, 200, 'Categoria encontrada', { category });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cria uma nova categoria
   * Requer autenticacao como ADMIN
   *
   * Body esperado:
   * - name: Nome da categoria (obrigatorio, unico)
   * - description: Descricao (opcional)
   * - sortOrder: Ordem de exibicao (default: 0)
   * - isActive: Se esta ativa (default: true)
   *
   * @param {Object} req - Request com body contendo dados
   * @param {Object} res - Response do Express
   * @param {Function} next - Middleware de erro
   */
  async create(req, res, next) {
    try {
      const category = await categoryService.create(req.body);
      return successResponse(res, 201, 'Categoria criada com sucesso', { category });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza dados de uma categoria
   * Requer autenticacao como ADMIN
   *
   * @param {Object} req - Request com params.id e body com dados
   * @param {Object} res - Response do Express
   * @param {Function} next - Middleware de erro
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const category = await categoryService.update(id, req.body);
      return successResponse(res, 200, 'Categoria atualizada com sucesso', { category });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Desativa uma categoria (soft delete)
   * Requer autenticacao como ADMIN
   *
   * Nota: Nao exclui fisicamente, apenas marca como inativa
   * Os produtos da categoria permanecem no banco
   *
   * @param {Object} req - Request com params.id
   * @param {Object} res - Response do Express
   * @param {Function} next - Middleware de erro
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await categoryService.delete(id);
      return successResponse(res, 200, 'Categoria desativada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reordena as categorias no cardapio
   * Requer autenticacao como ADMIN
   *
   * Body esperado:
   * - orderedIds: Array com IDs na nova ordem
   *   Ex: ["uuid1", "uuid2", "uuid3"]
   *
   * O sortOrder de cada categoria e atualizado
   * conforme a posicao no array
   *
   * @param {Object} req - Request com body.orderedIds
   * @param {Object} res - Response do Express
   * @param {Function} next - Middleware de erro
   */
  async reorder(req, res, next) {
    try {
      const { orderedIds } = req.body;
      const categories = await categoryService.reorder(orderedIds);
      return successResponse(res, 200, 'Ordem atualizada com sucesso', { categories });
    } catch (error) {
      next(error);
    }
  }
}

// Exporta instancia unica (Singleton)
module.exports = new CategoryController();
