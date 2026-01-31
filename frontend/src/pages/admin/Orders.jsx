/**
 * ============================================
 * ARQUIVO: Orders.jsx (Admin)
 * DESCRICAO: Pagina de gestao de pedidos
 * ============================================
 *
 * Permite aos administradores visualizar e gerenciar pedidos.
 * Acessivel apenas para usuarios com role ADMIN.
 *
 * Funcionalidades:
 * - Listagem de todos os pedidos
 * - Filtros por status
 * - Visualizacao de detalhes do pedido
 * - Alteracao de status do pedido
 * - Informacoes do cliente e itens
 */

import { useState, useEffect } from 'react';
import { Eye, ChevronRight } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { orderService } from '../../services/api';
import toast from 'react-hot-toast';
import './Admin.css';

// ============================================
// CONSTANTES
// ============================================

/**
 * Opcoes de status com labels e cores
 * Usado em filtros, badges e select de alteracao
 */
const STATUS_OPTIONS = [
  { value: 'PENDENTE', label: 'Pendente', color: 'warning' },
  { value: 'EM_PREPARO', label: 'Em Preparo', color: 'info' },
  { value: 'PRONTO', label: 'Pronto', color: 'success' },
  { value: 'ENTREGUE', label: 'Entregue', color: 'neutral' },
  { value: 'CANCELADO', label: 'Cancelado', color: 'error' },
];

export default function Orders() {
  // ==========================================
  // ESTADOS
  // ==========================================

  // Lista de pedidos
  const [orders, setOrders] = useState([]);

  // Estado de carregamento
  const [loading, setLoading] = useState(true);

  // Filtro de status ativo ('all' ou status especifico)
  const [filter, setFilter] = useState('all');

  // Pedido selecionado para ver detalhes
  const [selectedOrder, setSelectedOrder] = useState(null);

  // ==========================================
  // EFFECTS
  // ==========================================

  /**
   * Carrega pedidos ao montar componente
   */
  useEffect(() => {
    fetchOrders();
  }, []);

  // ==========================================
  // FUNCOES DE DADOS
  // ==========================================

  /**
   * Busca todos os pedidos da API
   */
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getAll();
      setOrders(response.data.data.orders);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Atualiza status de um pedido
   * @param {string} orderId - ID do pedido
   * @param {string} newStatus - Novo status
   */
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderService.updateStatus(orderId, newStatus);
      toast.success('Status atualizado');

      // Recarrega lista
      fetchOrders();

      // Atualiza pedido selecionado se for o mesmo
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar status');
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

  /**
   * Formata data completa para exibicao
   * @param {string} dateString - Data ISO
   * @returns {string} Data formatada (ex: "30/01/2026 14:30")
   */
  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  /**
   * Busca configuracao de um status
   * @param {string} status - Status do pedido
   * @returns {Object} Configuracao com label e color
   */
  const getStatusConfig = (status) => {
    return STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
  };

  // ==========================================
  // DADOS DERIVADOS
  // ==========================================

  // Filtra pedidos conforme filtro selecionado
  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  // ==========================================
  // RENDERIZACAO - LOADING
  // ==========================================

  if (loading) {
    return (
      <AdminLayout title="Pedidos">
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
    <AdminLayout title="Pedidos">
      {/* ==========================================
          FILTROS POR STATUS
          Chips para filtrar pedidos
          ========================================== */}
      <div className="admin-filters">
        {/* Filtro: Todos */}
        <button
          className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todos ({orders.length})
        </button>

        {/* Filtros por status especifico */}
        {STATUS_OPTIONS.map((status) => {
          // Conta pedidos com este status
          const count = orders.filter((o) => o.status === status.value).length;
          return (
            <button
              key={status.value}
              className={`filter-chip filter-chip-${status.color} ${
                filter === status.value ? 'active' : ''
              }`}
              onClick={() => setFilter(status.value)}
            >
              {status.label} ({count})
            </button>
          );
        })}
      </div>

      {/* ==========================================
          LAYOUT PRINCIPAL
          Lista de pedidos + painel de detalhes
          ========================================== */}
      <div className="orders-layout">
        {/* ==========================================
            LISTA DE PEDIDOS
            Tabela com todos os pedidos filtrados
            ========================================== */}
        <div className="dashboard-card orders-list-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Itens</th>
                <th>Total</th>
                <th>Status</th>
                <th>Data</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const statusConfig = getStatusConfig(order.status);
                return (
                  <tr
                    key={order.id}
                    className={selectedOrder?.id === order.id ? 'selected' : ''}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td>
                      <strong>#{order.orderNumber}</strong>
                    </td>
                    <td>{order.user?.name || 'Cliente'}</td>
                    <td>{order.items?.length || 0} itens</td>
                    <td>{formatPrice(order.total)}</td>
                    <td>
                      <span className={`badge badge-${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      <ChevronRight size={18} className="chevron-icon" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Mensagem quando nao ha pedidos */}
          {filteredOrders.length === 0 && (
            <div className="empty-state-sm">
              <p>Nenhum pedido encontrado</p>
            </div>
          )}
        </div>

        {/* ==========================================
            PAINEL DE DETALHES
            Exibe informacoes do pedido selecionado
            ========================================== */}
        {selectedOrder && (
          <div className="dashboard-card order-details-card">
            {/* Cabecalho com numero do pedido */}
            <div className="details-header">
              <h3>Pedido #{selectedOrder.orderNumber}</h3>
              <button
                className="btn-close-details"
                onClick={() => setSelectedOrder(null)}
              >
                &times;
              </button>
            </div>

            {/* Secao: Dados do Cliente */}
            <div className="details-section">
              <h4>Cliente</h4>
              <p>{selectedOrder.user?.name}</p>
              <p className="text-muted">{selectedOrder.user?.email}</p>
              {selectedOrder.user?.phone && (
                <p className="text-muted">{selectedOrder.user?.phone}</p>
              )}
            </div>

            {/* Secao: Alteracao de Status */}
            <div className="details-section">
              <h4>Status</h4>
              <select
                className="form-input status-select"
                value={selectedOrder.status}
                onChange={(e) =>
                  handleStatusChange(selectedOrder.id, e.target.value)
                }
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Secao: Itens do Pedido */}
            <div className="details-section">
              <h4>Itens</h4>
              <div className="order-items-list">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="order-item-row">
                    <span className="item-qty">{item.quantity}x</span>
                    <span className="item-name">{item.product?.name}</span>
                    <span className="item-price">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Secao: Observacoes (se houver) */}
            {selectedOrder.notes && (
              <div className="details-section">
                <h4>Observacoes</h4>
                <p className="order-notes-text">{selectedOrder.notes}</p>
              </div>
            )}

            {/* Rodape: Total do Pedido */}
            <div className="details-footer">
              <div className="order-total-row">
                <span>Total</span>
                <span className="total-value">
                  {formatPrice(selectedOrder.total)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
