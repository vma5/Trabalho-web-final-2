/**
 * ============================================
 * ARQUIVO: Products.jsx (Admin)
 * DESCRICAO: Pagina de gestao de produtos
 * ============================================
 *
 * Permite aos administradores gerenciar o catalogo de produtos.
 * Acessivel apenas para usuarios com role ADMIN.
 *
 * Funcionalidades:
 * - Listagem de todos os produtos
 * - Criar novo produto
 * - Editar produto existente
 * - Excluir produto (soft delete)
 * - Toggle de disponibilidade
 * - Modal para formulario de criacao/edicao
 */

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { productService, categoryService } from '../../services/api';
import toast from 'react-hot-toast';
import './Admin.css';

export default function Products() {
  // ==========================================
  // ESTADOS
  // ==========================================

  // Lista de produtos
  const [products, setProducts] = useState([]);

  // Lista de categorias (para select no formulario)
  const [categories, setCategories] = useState([]);

  // Estado de carregamento
  const [loading, setLoading] = useState(true);

  // Controla exibicao do modal
  const [showModal, setShowModal] = useState(false);

  // Produto sendo editado (null = novo produto)
  const [editingProduct, setEditingProduct] = useState(null);

  // Dados do formulario
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    isAvailable: true,
  });

  // ==========================================
  // EFFECTS
  // ==========================================

  /**
   * Carrega produtos e categorias ao montar
   */
  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================
  // FUNCOES DE DADOS
  // ==========================================

  /**
   * Busca produtos e categorias em paralelo
   */
  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        productService.getAll(),
        categoryService.getAll(),
      ]);
      setProducts(productsRes.data.data.products);
      setCategories(categoriesRes.data.data.categories);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // HANDLERS DO MODAL
  // ==========================================

  /**
   * Abre modal para criar ou editar produto
   * @param {Object|null} product - Produto a editar, ou null para novo
   */
  const handleOpenModal = (product = null) => {
    if (product) {
      // Modo edicao - preenche form com dados do produto
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        categoryId: product.categoryId,
        isAvailable: product.isAvailable,
      });
    } else {
      // Modo criacao - form vazio
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        categoryId: categories[0]?.id || '',
        isAvailable: true,
      });
    }
    setShowModal(true);
  };

  /**
   * Fecha modal e limpa estado de edicao
   */
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  // ==========================================
  // HANDLERS DE CRUD
  // ==========================================

  /**
   * Envia formulario para criar ou atualizar produto
   * @param {Event} e - Evento do formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepara dados com preco convertido para numero
    const data = {
      ...formData,
      price: parseFloat(formData.price),
    };

    try {
      if (editingProduct) {
        // Atualiza produto existente
        await productService.update(editingProduct.id, data);
        toast.success('Produto atualizado');
      } else {
        // Cria novo produto
        await productService.create(data);
        toast.success('Produto criado');
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao salvar produto');
    }
  };

  /**
   * Exclui produto apos confirmacao
   * @param {string} id - ID do produto
   */
  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir este produto?')) return;

    try {
      await productService.delete(id);
      toast.success('Produto excluido');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao excluir produto');
    }
  };

  /**
   * Alterna disponibilidade do produto
   * @param {Object} product - Produto a alternar
   */
  const handleToggleAvailability = async (product) => {
    try {
      await productService.update(product.id, {
        isAvailable: !product.isAvailable,
      });
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar disponibilidade');
    }
  };

  // ==========================================
  // HELPERS
  // ==========================================

  /**
   * Formata valor para moeda brasileira
   * @param {number} price - Valor a formatar
   * @returns {string} Valor formatado
   */
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  // ==========================================
  // RENDERIZACAO - LOADING
  // ==========================================

  if (loading) {
    return (
      <AdminLayout title="Produtos">
        <div className="admin-loader">
          <span className="loader loader-lg"></span>
        </div>
      </AdminLayout>
    );
  }

  // ==========================================
  // RENDERIZACAO - CONTEUDO
  // ==========================================

  return (
    <AdminLayout title="Produtos">
      {/* ==========================================
          BARRA DE FERRAMENTAS
          Botao para adicionar novo produto
          ========================================== */}
      <div className="admin-toolbar">
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} />
          Novo Produto
        </button>
      </div>

      {/* ==========================================
          TABELA DE PRODUTOS
          Lista todos os produtos com acoes
          ========================================== */}
      <div className="dashboard-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Preco</th>
              <th>Disponivel</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                {/* Coluna: Produto (imagem + nome + descricao) */}
                <td>
                  <div className="product-cell">
                    <div className="product-thumb">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} />
                      ) : (
                        '🍔'
                      )}
                    </div>
                    <div>
                      <strong>{product.name}</strong>
                      {product.description && (
                        <p className="product-desc">{product.description}</p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Coluna: Categoria */}
                <td>{product.category?.name}</td>

                {/* Coluna: Preco */}
                <td>{formatPrice(product.price)}</td>

                {/* Coluna: Toggle de disponibilidade */}
                <td>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={product.isAvailable}
                      onChange={() => handleToggleAvailability(product)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </td>

                {/* Coluna: Botoes de acao */}
                <td>
                  <div className="action-buttons">
                    {/* Botao editar */}
                    <button
                      className="btn-icon btn-icon-edit"
                      onClick={() => handleOpenModal(product)}
                    >
                      <Edit2 size={16} />
                    </button>
                    {/* Botao excluir */}
                    <button
                      className="btn-icon btn-icon-delete"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ==========================================
          MODAL DE CRIACAO/EDICAO
          Formulario para novo produto ou edicao
          ========================================== */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          {/* Evita fechar ao clicar dentro do modal */}
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {/* Cabecalho do modal */}
            <div className="modal-header">
              <h2>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="modal-form">
              {/* Campo: Nome */}
              <div className="form-group">
                <label className="form-label">Nome</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              {/* Campo: Descricao */}
              <div className="form-group">
                <label className="form-label">Descricao</label>
                <textarea
                  className="form-input"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              {/* Campos lado a lado: Preco e Categoria */}
              <div className="form-row">
                {/* Campo: Preco */}
                <div className="form-group">
                  <label className="form-label">Preco (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Campo: Categoria */}
                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <select
                    className="form-input"
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Campo: Disponibilidade */}
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) =>
                      setFormData({ ...formData, isAvailable: e.target.checked })
                    }
                  />
                  Produto disponivel
                </label>
              </div>

              {/* Botoes de acao */}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleCloseModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
