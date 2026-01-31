/**
 * ============================================
 * ARQUIVO: Home.jsx
 * DESCRICAO: Pagina principal do cardapio
 * ============================================
 *
 * Exibe o cardapio da cantina com:
 * - Barra de busca
 * - Filtro por categorias
 * - Grid de produtos organizados por categoria
 *
 * Funcionalidades:
 * - Carrega produtos e categorias da API
 * - Filtra produtos por categoria selecionada
 * - Busca por nome ou descricao
 * - Mostra apenas produtos disponiveis
 */

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { productService, categoryService } from '../services/api';
import ProductCard from '../components/ProductCard';
import './Home.css';

export default function Home() {
  // ==========================================
  // ESTADOS
  // ==========================================

  // Lista de todos os produtos do cardapio
  const [products, setProducts] = useState([]);

  // Lista de categorias (Lanches, Bebidas, etc)
  const [categories, setCategories] = useState([]);

  // ID da categoria selecionada (null = todas)
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Termo de busca digitado pelo usuario
  const [searchTerm, setSearchTerm] = useState('');

  // Estado de carregamento inicial
  const [loading, setLoading] = useState(true);

  // ==========================================
  // EFEITOS
  // ==========================================

  // Carrega dados ao montar o componente
  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================
  // FUNCOES
  // ==========================================

  /**
   * Busca produtos e categorias da API
   * Executa as duas chamadas em paralelo para melhor performance
   */
  const fetchData = async () => {
    try {
      setLoading(true);

      // Promise.all executa ambas requisicoes simultaneamente
      const [productsRes, categoriesRes] = await Promise.all([
        productService.getAll(),
        categoryService.getAll(),
      ]);

      // Extrai dados da resposta padronizada da API
      setProducts(productsRes.data.data.products);
      setCategories(categoriesRes.data.data.categories);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // DADOS DERIVADOS
  // ==========================================

  /**
   * Filtra produtos baseado em:
   * - Categoria selecionada
   * - Termo de busca
   * - Disponibilidade (isAvailable)
   */
  const filteredProducts = products.filter((product) => {
    // Verifica se produto pertence a categoria selecionada
    const matchesCategory =
      !selectedCategory || product.categoryId === selectedCategory;

    // Verifica se nome ou descricao contem o termo de busca
    const matchesSearch =
      !searchTerm ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());

    // Retorna apenas produtos que atendem todos os criterios
    return matchesCategory && matchesSearch && product.isAvailable;
  });

  /**
   * Agrupa produtos filtrados por categoria
   * para exibir separados por secoes
   */
  const groupedProducts = categories
    // Filtra categorias se uma especifica foi selecionada
    .filter((cat) => !selectedCategory || cat.id === selectedCategory)
    // Mapeia cada categoria com seus produtos
    .map((category) => ({
      ...category,
      products: filteredProducts.filter((p) => p.categoryId === category.id),
    }))
    // Remove categorias sem produtos (apos filtros)
    .filter((cat) => cat.products.length > 0);

  // ==========================================
  // RENDERIZACAO
  // ==========================================

  // Mostra loader enquanto carrega dados iniciais
  if (loading) {
    return (
      <div className="page-loader">
        <span className="loader loader-lg"></span>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* ==========================================
          HERO SECTION
          Cabecalho com titulo e barra de busca
          ========================================== */}
      <section className="hero">
        <div className="hero-content container">
          <h1>Cardapio da Cantina</h1>
          <p>Escolha seus lanches favoritos e faca seu pedido sem filas!</p>

          {/* Campo de busca */}
          <div className="search-box">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* ==========================================
          TABS DE CATEGORIAS
          Navegacao por categorias (sticky)
          ========================================== */}
      <nav className="categories-nav">
        <div className="container">
          <div className="categories-tabs">
            {/* Botao "Todos" - limpa filtro de categoria */}
            <button
              className={`category-tab ${!selectedCategory ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </button>

            {/* Botoes das categorias */}
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-tab ${
                  selectedCategory === category.id ? 'active' : ''
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ==========================================
          GRID DE PRODUTOS
          Produtos agrupados por categoria
          ========================================== */}
      <main className="menu-content container">
        {groupedProducts.length === 0 ? (
          // Estado vazio - nenhum produto encontrado
          <div className="empty-state">
            <p>Nenhum produto encontrado</p>
          </div>
        ) : (
          // Lista de categorias com seus produtos
          groupedProducts.map((category) => (
            <section key={category.id} className="category-section">
              {/* Cabecalho da categoria */}
              <div className="category-header">
                <h2>{category.name}</h2>
                {category.description && <p>{category.description}</p>}
              </div>

              {/* Grid de cards de produtos */}
              <div className="products-grid">
                {category.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}
