/**
 * ============================================
 * ARQUIVO: AdminLayout.jsx
 * DESCRICAO: Layout base para paginas administrativas
 * ============================================
 *
 * Componente wrapper que fornece estrutura comum para
 * todas as paginas do painel administrativo.
 *
 * Funcionalidades:
 * - Sidebar de navegacao com links para Dashboard, Produtos e Pedidos
 * - Header mobile com botao hamburger
 * - Exibicao do usuario logado com avatar
 * - Botao de logout
 * - Link para voltar ao cardapio publico
 * - Area de conteudo dinamico via children
 *
 * Uso:
 * <AdminLayout title="Dashboard">
 *   <ComponenteDoConteudo />
 * </AdminLayout>
 */

import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  LogOut,
  Menu,
  X,
  Home,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AdminLayout.css';

/**
 * Layout administrativo com sidebar e area de conteudo
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Conteudo da pagina
 * @param {string} props.title - Titulo exibido no header
 */
export default function AdminLayout({ children, title }) {
  // ==========================================
  // ESTADOS
  // ==========================================

  // Controla visibilidade da sidebar em mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ==========================================
  // HOOKS
  // ==========================================

  // Dados do usuario e funcao de logout
  const { user, logout } = useAuth();

  // Hook de navegacao programatica
  const navigate = useNavigate();

  // ==========================================
  // HANDLERS
  // ==========================================

  /**
   * Realiza logout e redireciona para login
   */
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ==========================================
  // RENDERIZACAO
  // ==========================================

  return (
    <div className="admin-layout">
      {/* ==========================================
          HEADER MOBILE
          Visivel apenas em telas pequenas
          Contem botao hamburger e titulo
          ========================================== */}
      <header className="admin-mobile-header">
        {/* Botao toggle da sidebar */}
        <button
          className="menu-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <span className="admin-title">Admin</span>
      </header>

      {/* ==========================================
          SIDEBAR
          Navegacao principal do admin
          Em mobile, controlada pelo estado sidebarOpen
          ========================================== */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Cabecalho da sidebar com logo */}
        <div className="sidebar-header">
          <span className="sidebar-logo">🍔</span>
          <h2>IFNMG Admin</h2>
        </div>

        {/* ==========================================
            NAVEGACAO
            Links com destaque para pagina ativa
            NavLink aplica classe 'active' automaticamente
            ========================================== */}
        <nav className="sidebar-nav">
          {/* Link para Dashboard */}
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>

          {/* Link para Gestao de Produtos */}
          <NavLink
            to="/admin/products"
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <Package size={20} />
            <span>Produtos</span>
          </NavLink>

          {/* Link para Gestao de Pedidos */}
          <NavLink
            to="/admin/orders"
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <ShoppingCart size={20} />
            <span>Pedidos</span>
          </NavLink>
        </nav>

        {/* ==========================================
            RODAPE DA SIDEBAR
            Link para cardapio, info do usuario e logout
            ========================================== */}
        <div className="sidebar-footer">
          {/* Link para voltar ao cardapio publico */}
          <Link to="/" className="back-to-menu">
            <Home size={20} />
            <span>Voltar ao Cardapio</span>
          </Link>

          {/* Informacoes do usuario logado */}
          <div className="user-info">
            {/* Avatar com inicial do nome */}
            <div className="user-avatar">{user?.name?.charAt(0)}</div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">Administrador</span>
            </div>
          </div>

          {/* Botao de logout */}
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* ==========================================
          OVERLAY
          Fundo escuro quando sidebar esta aberta em mobile
          Clicar fecha a sidebar
          ========================================== */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ==========================================
          CONTEUDO PRINCIPAL
          Area onde o conteudo da pagina e renderizado
          ========================================== */}
      <main className="admin-main">
        {/* Cabecalho com titulo da pagina */}
        <div className="admin-header">
          <h1>{title}</h1>
        </div>
        {/* Conteudo passado via children */}
        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}
