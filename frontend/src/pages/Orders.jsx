/**
 * ============================================
 * ARQUIVO: Orders.jsx
 * DESCRICAO: Pagina "Meus Pedidos" do cliente
 * ============================================
 *
 * Lista todos os pedidos do usuario logado.
 *
 * Funcionalidades:
 * - Filtros por status (todos, em andamento, entregues, cancelados)
 * - Barra de progresso visual do pedido
 * - Detalhes dos itens de cada pedido
 * - Botao para cancelar pedidos pendentes
 *
 * Status possiveis:
 * - PENDENTE: Aguardando preparo
 * - EM_PREPARO: Sendo preparado
 * - PRONTO: Pronto para retirada
 * - ENTREGUE: Ja entregue
 * - CANCELADO: Cancelado
 */

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Package, ChefHat } from 'lucide-react';
import { orderService } from '../services/api';
import toast from 'react-hot-toast';
import './Orders.css';

// ============================================
// CONFIGURACAO DE STATUS
// ============================================

/**
 * Mapeamento de status para exibicao
 *
 * Cada status tem:
 * - label: Texto amigavel
 * - color: Cor do badge (CSS class)
 * - icon: Icone Lucide
 * - step: Posicao na barra de progresso
 */
const STATUS_CONFIG = {
  PENDENTE: {
    label: 'Pendente',
    color: 'warning',     // Amarelo
    icon: Clock,
    step: 1,
  },
  EM_PREPARO: {
    label: 'Em Preparo',
    color: 'info',        // Azul
    icon: ChefHat,
    step: 2,
  },
  PRONTO: {
    label: 'Pronto',
    color: 'success',     // Verde
    icon: CheckCircle,
    step: 3,
  },
  ENTREGUE: {
    label: 'Entregue',
    color: 'neutral',     // Cinza
    icon: Package,
    step: 4,
  },
  CANCELADO: {
    label: 'Cancelado',
    color: 'error',       // Vermelho
    icon: XCircle,
    step: 0,              // Nao aparece na barra de progresso
  },
};

export default function Orders() {
  // ==========================================
  // ESTADOS
  // ==========================================

  // Lista de pedidos do usuario
  const [orders, setOrders] = useState([]);

  // Estado de carregamento
  const [loading, setLoading] = useState(true);

  // Filtro de status selecionado
  const [filter, setFilter] = useState('all');

  // ==========================================
  // EFEITOS
  // ==========================================

  // Carrega pedidos ao montar componente
  useEffect(() => {
    fetchOrders();
  }, []);

  // ==========================================
  // FUNCOES
  // ==========================================

  /**
   * Busca pedidos do usuario na API
   */
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getMine();
      setOrders(response.data.data.orders);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancela um pedido
   *
   * So permite cancelar pedidos com status PENDENTE.
   * Pede confirmacao antes de cancelar.
   *
   * @param {string} orderId - ID do pedido
   */
  const handleCancelOrder = async (orderId) => {
    // Pede confirmacao
    if (!window.confirm('Deseja realmente cancelar este pedido?')) return;

    try {
      await orderService.cancel(orderId);
      toast.success('Pedido cancelado');
      // Recarrega lista para atualizar status
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao cancelar pedido');
    }
  };

  // ==========================================
  // HELPERS
  // ==========================================

  /**
   * Formata valor para moeda brasileira
   */
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  /**
   * Formata data para formato brasileiro
   * Ex: "30/01/2026 14:35"
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

  // ==========================================
  // DADOS DERIVADOS
  // ==========================================

  /**
   * Filtra pedidos baseado no filtro selecionado
   */
  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true;
    if (filter === 'active')
      return ['PENDENTE', 'EM_PREPARO', 'PRONTO'].includes(order.status);
    if (filter === 'completed') return order.status === 'ENTREGUE';
    if (filter === 'cancelled') return order.status === 'CANCELADO';
    return true;
  });

  // ==========================================
  // RENDERIZACAO
  // ==========================================

  // Mostra loader enquanto carrega
  if (loading) {
    return (
      <div className="page-loader">
        <span className="loader loader-lg"></span>
      </div>
    );
  }

  return (
    <div className="orders-page container">
      <h1>Meus Pedidos</h1>

      {/* ==========================================
          FILTROS
          Botoes para filtrar por status
          ========================================== */}
      <div className="orders-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todos
        </button>
        <button
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Em andamento
        </button>
        <button
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Entregues
        </button>
        <button
          className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
          onClick={() => setFilter('cancelled')}
        >
          Cancelados
        </button>
      </div>

      {filteredOrders.length === 0 ? (
        /* ==========================================
           ESTADO VAZIO
           ========================================== */
        <div className="orders-empty">
          <Package size={64} strokeWidth={1} />
          <h2>Nenhum pedido encontrado</h2>
          <p>Voce ainda nao fez nenhum pedido</p>
        </div>
      ) : (
        /* ==========================================
           LISTA DE PEDIDOS
           ========================================== */
        <div className="orders-list">
          {filteredOrders.map((order) => {
            const statusConfig = STATUS_CONFIG[order.status];
            const StatusIcon = statusConfig.icon;

            return (
              <div key={order.id} className="order-card">
                {/* Cabecalho: numero do pedido, data e status */}
                <div className="order-header">
                  <div className="order-info">
                    <span className="order-number">Pedido #{order.orderNumber}</span>
                    <span className="order-date">{formatDate(order.createdAt)}</span>
                  </div>
                  {/* Badge de status colorido */}
                  <span className={`badge badge-${statusConfig.color}`}>
                    <StatusIcon size={14} />
                    {statusConfig.label}
                  </span>
                </div>

                {/* Barra de progresso (apenas para pedidos em andamento) */}
                {order.status !== 'CANCELADO' && order.status !== 'ENTREGUE' && (
                  <div className="order-progress">
                    <div className="progress-steps">
                      {['PENDENTE', 'EM_PREPARO', 'PRONTO', 'ENTREGUE'].map(
                        (step, index) => {
                          const stepConfig = STATUS_CONFIG[step];
                          // Verifica se este passo ja foi atingido
                          const isActive = stepConfig.step <= statusConfig.step;
                          // Verifica se este e o passo atual
                          const isCurrent = step === order.status;

                          return (
                            <div
                              key={step}
                              className={`progress-step ${isActive ? 'active' : ''} ${
                                isCurrent ? 'current' : ''
                              }`}
                            >
                              <div className="step-dot"></div>
                              <span className="step-label">{stepConfig.label}</span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

                {/* Lista de itens do pedido */}
                <div className="order-items">
                  {order.items.map((item) => (
                    <div key={item.id} className="order-item">
                      <span className="item-qty">{item.quantity}x</span>
                      <span className="item-name">{item.product.name}</span>
                      <span className="item-price">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Observacoes do pedido (se houver) */}
                {order.notes && (
                  <div className="order-notes">
                    <strong>Observacoes:</strong> {order.notes}
                  </div>
                )}

                {/* Rodape: total e acoes */}
                <div className="order-footer">
                  <div className="order-total">
                    <span>Total:</span>
                    <span className="total-value">{formatPrice(order.total)}</span>
                  </div>

                  {/* Botao cancelar (apenas para pedidos pendentes) */}
                  {order.status === 'PENDENTE' && (
                    <button
                      className="btn btn-outline-error btn-sm"
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      Cancelar Pedido
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
