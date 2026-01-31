/**
 * ============================================
 * ARQUIVO: Dashboard.jsx (Admin)
 * DESCRICAO: Pagina principal do painel administrativo
 * ============================================
 *
 * Exibe estatisticas e informacoes gerais do sistema.
 * Acessivel apenas para usuarios com role ADMIN.
 *
 * Funcionalidades:
 * - Cards de estatisticas (vendas, pedidos, usuarios)
 * - Lista de pedidos recentes
 * - Ranking de produtos mais vendidos
 * - Dados carregados em paralelo da API
 */

import { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Clock,
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { dashboardService } from '../../services/api';
import './Admin.css';

export default function Dashboard() {
  // ==========================================
  // ESTADOS
  // ==========================================

  // Estatisticas gerais (vendas, pedidos, usuarios)
  const [stats, setStats] = useState(null);

  // Lista de pedidos mais recentes
  const [recentOrders, setRecentOrders] = useState([]);

  // Produtos mais vendidos (ranking)
  const [topProducts, setTopProducts] = useState([]);

  // Estado de carregamento inicial
  const [loading, setLoading] = useState(true);

  // ==========================================
  // EFFECTS
  // ==========================================

  /**
   * Carrega dados do dashboard ao montar componente
   */
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ==========================================
  // FUNCOES DE DADOS
  // ==========================================

  /**
   * Busca todos os dados do dashboard em paralelo
   *
   * Chama tres endpoints simultaneamente:
   * - getStats: estatisticas gerais
   * - getRecentOrders: ultimos 5 pedidos
   * - getTopProducts: 5 produtos mais vendidos
   */
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Requisicoes em paralelo para performance
      const [statsRes, recentRes, topRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentOrders(5),
        dashboardService.getTopProducts(5),
      ]);

      // Atualiza estados com dados recebidos
      setStats(statsRes.data.data.stats);
      setRecentOrders(recentRes.data.data.recentOrders);
      setTopProducts(topRes.data.data.topProducts);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // HELPERS
  // ==========================================

  /**
   * Formata valor para moeda brasileira
   * @param {number} price - Valor a formatar
   * @returns {string} Valor formatado (ex: "R$ 10,00")
   */
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  /**
   * Formata data para exibicao resumida
   * @param {string} dateString - Data ISO
   * @returns {string} Data formatada (ex: "30/01 14:30")
   */
  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  /**
   * Retorna badge JSX com cor baseada no status
   * @param {string} status - Status do pedido
   * @returns {JSX.Element} Badge colorido
   */
  const getStatusBadge = (status) => {
    // Configuracao de labels e cores por status
    const config = {
      PENDENTE: { label: 'Pendente', color: 'warning' },
      EM_PREPARO: { label: 'Em Preparo', color: 'info' },
      PRONTO: { label: 'Pronto', color: 'success' },
      ENTREGUE: { label: 'Entregue', color: 'neutral' },
      CANCELADO: { label: 'Cancelado', color: 'error' },
    };
    const { label, color } = config[status] || { label: status, color: 'neutral' };
    return <span className={`badge badge-${color}`}>{label}</span>;
  };

  // ==========================================
  // RENDERIZACAO - LOADING
  // ==========================================

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
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
    <AdminLayout title="Dashboard">
      {/* ==========================================
          CARDS DE ESTATISTICAS
          Grid com 4 cards de metricas principais
          ========================================== */}
      <div className="stats-grid">
        {/* Card: Vendas de Hoje */}
        <div className="stat-card">
          <div className="stat-icon stat-icon-green">
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Vendas Hoje</span>
            <span className="stat-value">{formatPrice(stats?.todaySales || 0)}</span>
          </div>
        </div>

        {/* Card: Pedidos de Hoje */}
        <div className="stat-card">
          <div className="stat-icon stat-icon-blue">
            <ShoppingCart size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Pedidos Hoje</span>
            <span className="stat-value">{stats?.todayOrders || 0}</span>
          </div>
        </div>

        {/* Card: Pedidos Pendentes */}
        <div className="stat-card">
          <div className="stat-icon stat-icon-yellow">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Pedidos Pendentes</span>
            <span className="stat-value">{stats?.pendingOrders || 0}</span>
          </div>
        </div>

        {/* Card: Total de Clientes */}
        <div className="stat-card">
          <div className="stat-icon stat-icon-purple">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Clientes</span>
            <span className="stat-value">{stats?.totalUsers || 0}</span>
          </div>
        </div>
      </div>

      {/* ==========================================
          GRID DO DASHBOARD
          Pedidos recentes e produtos mais vendidos
          ========================================== */}
      <div className="dashboard-grid">
        {/* ==========================================
            PEDIDOS RECENTES
            Tabela com ultimos pedidos realizados
            ========================================== */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Pedidos Recentes</h3>
          </div>
          <div className="card-content">
            {recentOrders.length === 0 ? (
              <p className="empty-text">Nenhum pedido recente</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.orderNumber}</td>
                      <td>{order.user?.name || 'Cliente'}</td>
                      <td>{formatPrice(order.total)}</td>
                      <td>{getStatusBadge(order.status)}</td>
                      <td>{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ==========================================
            PRODUTOS MAIS VENDIDOS
            Ranking dos produtos com maior volume de vendas
            ========================================== */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>
              <TrendingUp size={18} />
              Produtos Mais Vendidos
            </h3>
          </div>
          <div className="card-content">
            {topProducts.length === 0 ? (
              <p className="empty-text">Nenhum produto vendido</p>
            ) : (
              <div className="top-products-list">
                {topProducts.map((item, index) => (
                  <div key={item.productId} className="top-product-item">
                    {/* Posicao no ranking */}
                    <span className="product-rank">#{index + 1}</span>
                    {/* Nome do produto */}
                    <span className="product-name">{item.product?.name}</span>
                    {/* Quantidade vendida */}
                    <span className="product-qty">{item._sum?.quantity || 0} vendidos</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
