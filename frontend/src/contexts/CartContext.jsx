/**
 * ============================================
 * ARQUIVO: CartContext.jsx
 * DESCRICAO: Contexto do carrinho de compras
 * ============================================
 *
 * Gerencia o estado global do carrinho de compras.
 * O carrinho e sincronizado com o backend para usuarios logados.
 *
 * Funcionalidades:
 * - Buscar carrinho do usuario logado
 * - Adicionar produtos ao carrinho
 * - Atualizar quantidade/observacoes
 * - Remover itens
 * - Limpar carrinho
 *
 * Uso:
 * 1. Envolver app com <CartProvider> (dentro de AuthProvider)
 * 2. Usar hook useCart() em qualquer componente
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { cartService } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast'; // Biblioteca para notificacoes

// Cria o contexto do carrinho
const CartContext = createContext(null);

/**
 * Provider do carrinho
 * Gerencia estado e sincroniza com backend
 *
 * @param {ReactNode} children - Componentes filhos
 */
export function CartProvider({ children }) {
  // Estado do carrinho com valores padrao
  const [cart, setCart] = useState({
    items: [],      // Array de itens no carrinho
    total: 0,       // Valor total em reais
    itemCount: 0,   // Quantidade total de itens
  });

  // Estado de carregamento
  const [loading, setLoading] = useState(false);

  // Pega status de autenticacao do AuthContext
  const { isAuthenticated } = useAuth();

  /**
   * Busca o carrinho do usuario no backend
   * Chamada quando usuario loga/desloga
   */
  const fetchCart = async () => {
    // Se nao esta logado, limpa o carrinho local
    if (!isAuthenticated) {
      setCart({ items: [], total: 0, itemCount: 0 });
      return;
    }

    try {
      setLoading(true);
      // Busca carrinho da API
      const response = await cartService.get();
      // Atualiza estado com dados do backend
      setCart(response.data.data.cart);
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Effect que executa quando status de autenticacao muda
   * Se logou: busca carrinho do backend
   * Se deslogou: limpa carrinho local
   */
  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]); // Executa quando isAuthenticated muda

  /**
   * Adiciona um produto ao carrinho
   *
   * @param {string} productId - ID do produto
   * @param {number} quantity - Quantidade (padrao: 1)
   * @param {string} notes - Observacoes (ex: "sem cebola")
   * @returns {boolean} true se sucesso, false se erro
   */
  const addItem = async (productId, quantity = 1, notes = '') => {
    // Verifica se usuario esta logado
    if (!isAuthenticated) {
      toast.error('Faca login para adicionar ao carrinho');
      return false;
    }

    try {
      // Chama API para adicionar item
      const response = await cartService.addItem(productId, quantity, notes);
      // Atualiza carrinho com resposta do backend
      setCart(response.data.data.cart);
      // Mostra notificacao de sucesso
      toast.success('Produto adicionado ao carrinho!');
      return true;
    } catch (error) {
      // Mostra erro retornado pela API ou mensagem generica
      toast.error(error.response?.data?.message || 'Erro ao adicionar produto');
      return false;
    }
  };

  /**
   * Atualiza quantidade ou observacoes de um item
   *
   * @param {string} itemId - ID do item no carrinho
   * @param {number} quantity - Nova quantidade
   * @param {string} notes - Novas observacoes
   * @returns {boolean} true se sucesso, false se erro
   */
  const updateItem = async (itemId, quantity, notes) => {
    try {
      // Chama API para atualizar item
      const response = await cartService.updateItem(itemId, quantity, notes);
      // Atualiza carrinho com resposta do backend
      setCart(response.data.data.cart);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar item');
      return false;
    }
  };

  /**
   * Remove um item do carrinho
   *
   * @param {string} itemId - ID do item no carrinho
   * @returns {boolean} true se sucesso, false se erro
   */
  const removeItem = async (itemId) => {
    try {
      // Chama API para remover item
      const response = await cartService.removeItem(itemId);
      // Atualiza carrinho com resposta do backend
      setCart(response.data.data.cart);
      // Mostra notificacao de sucesso
      toast.success('Item removido do carrinho');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao remover item');
      return false;
    }
  };

  /**
   * Limpa todos os itens do carrinho
   *
   * @returns {boolean} true se sucesso, false se erro
   */
  const clearCart = async () => {
    try {
      // Chama API para limpar carrinho
      const response = await cartService.clear();
      // Atualiza carrinho (agora vazio)
      setCart(response.data.data.cart);
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao limpar carrinho');
      return false;
    }
  };

  // Retorna o Provider com todos os valores e funcoes
  return (
    <CartContext.Provider
      value={{
        cart,                // Dados do carrinho (items, total, itemCount)
        loading,             // true enquanto carrega dados
        addItem,             // Funcao para adicionar item
        updateItem,          // Funcao para atualizar item
        removeItem,          // Funcao para remover item
        clearCart,           // Funcao para limpar carrinho
        refreshCart: fetchCart, // Funcao para recarregar carrinho
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/**
 * Hook personalizado para usar o contexto do carrinho
 *
 * @returns {Object} Valores do contexto do carrinho
 * @throws {Error} Se usado fora do CartProvider
 *
 * @example
 * function MeuComponente() {
 *   const { cart, addItem, removeItem } = useCart();
 *
 *   return (
 *     <div>
 *       <p>Total: R$ {cart.total}</p>
 *       <p>Itens: {cart.itemCount}</p>
 *       <button onClick={() => addItem(produtoId)}>Adicionar</button>
 *     </div>
 *   );
 * }
 */
export function useCart() {
  const context = useContext(CartContext);

  // Garante que o hook seja usado dentro do Provider
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }

  return context;
}
