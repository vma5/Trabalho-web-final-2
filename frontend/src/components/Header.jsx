/**
 * ============================================
 * ARQUIVO: Header.jsx
 * DESCRICAO: Componente de cabecalho da aplicacao
 * ============================================
 *
 * Barra de navegacao superior presente em todas as paginas.
 *
 * Funcionalidades:
 * - Logo com link para home
 * - Menu de navegacao (Cardapio, Meus Pedidos, Admin)
 * - Icone do carrinho com badge de quantidade
 * - Dropdown do usuario com opcao de sair
 * - Menu mobile responsivo (hamburger)
 *
 * O conteudo exibido varia conforme:
 * - Usuario autenticado ou nao
 * - Usuario e admin ou cliente
 */

import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import './Header.css';

export default function Header() {
  // ==========================================
  // ESTADOS
  // ==========================================

  // Controla menu mobile (hamburger)
  const [menuOpen, setMenuOpen] = useState(false);

  // Controla dropdown do usuario
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // ==========================================
  // HOOKS
  // ==========================================

  // Dados e funcoes de autenticacao
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  // Dados do carrinho
  const { cart } = useCart();

  // Hook de navegacao
  const navigate = useNavigate();

  // ==========================================
  // HANDLERS
  // ==========================================

  /**
   * Realiza logout do usuario
   * Chama funcao do contexto, redireciona e fecha dropdown
   */
  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
  };

  // ==========================================
  // DADOS DERIVADOS
  // ==========================================

  // Conta quantidade de itens no carrinho para o badge
  const cartItemCount = cart?.items?.length || 0;

  // ==========================================
  // RENDERIZACAO
  // ==========================================

  return (
    <header className="header">
      <div className="header-container">
        {/* ==========================================
            LOGO
            Link para pagina inicial
            ========================================== */}
        <Link to="/" className="header-logo">
          <span className="logo-icon">🍔</span>
          <span className="logo-text">Cantina IFNMG</span>
        </Link>

        {/* ==========================================
            NAVEGACAO
            Links principais - responsivo com classe 'open'
            ========================================== */}
        <nav className={`header-nav ${menuOpen ? 'open' : ''}`}>
          {/* Link sempre visivel */}
          <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>
            Cardapio
          </Link>

          {/* Link visivel apenas para usuarios autenticados */}
          {isAuthenticated && (
            <Link to="/orders" className="nav-link" onClick={() => setMenuOpen(false)}>
              Meus Pedidos
            </Link>
          )}

          {/* Link visivel apenas para admins */}
          {isAdmin && (
            <Link to="/admin" className="nav-link" onClick={() => setMenuOpen(false)}>
              <LayoutDashboard size={18} />
              Admin
            </Link>
          )}
        </nav>

        {/* ==========================================
            ACOES
            Carrinho, usuario e menu mobile
            ========================================== */}
        <div className="header-actions">
          {/* Botao do carrinho (apenas autenticados) */}
          {isAuthenticated && (
            <Link to="/cart" className="cart-btn">
              <ShoppingCart size={22} />
              {/* Badge com quantidade de itens */}
              {cartItemCount > 0 && (
                <span className="cart-badge">{cartItemCount}</span>
              )}
            </Link>
          )}

          {/* Usuario autenticado: dropdown com nome e logout */}
          {isAuthenticated ? (
            <div className="user-dropdown">
              {/* Botao que abre dropdown */}
              <button
                className="user-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {/* Avatar com primeira letra do nome */}
                <span className="user-avatar">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
                {/* Primeiro nome do usuario */}
                <span className="user-name">{user?.name?.split(' ')[0]}</span>
              </button>

              {/* Menu dropdown */}
              {dropdownOpen && (
                <div className="dropdown-menu">
                  {/* Cabecalho com dados do usuario */}
                  <div className="dropdown-header">
                    <strong>{user?.name}</strong>
                    <small>{user?.email}</small>
                  </div>
                  <hr />
                  {/* Botao de logout */}
                  <button onClick={handleLogout} className="dropdown-item">
                    <LogOut size={16} />
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Usuario nao autenticado: botao de entrar */
            <Link to="/login" className="btn btn-primary">
              Entrar
            </Link>
          )}

          {/* Botao hamburger (visivel apenas em mobile) */}
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
}
