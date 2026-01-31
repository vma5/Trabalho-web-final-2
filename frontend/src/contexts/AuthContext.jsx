/**
 * ============================================
 * ARQUIVO: AuthContext.jsx
 * DESCRICAO: Contexto de autenticacao do React
 * ============================================
 *
 * Este arquivo implementa o gerenciamento de estado global
 * de autenticacao usando Context API do React.
 *
 * Funcionalidades:
 * - Armazena dados do usuario logado
 * - Persiste sessao no localStorage
 * - Fornece funcoes de login, registro e logout
 * - Verifica se usuario e admin
 *
 * Uso:
 * 1. Envolver app com <AuthProvider>
 * 2. Usar hook useAuth() em qualquer componente
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

// Cria o contexto de autenticacao
// Valor inicial null - sera preenchido pelo Provider
const AuthContext = createContext(null);

/**
 * Provider de autenticacao
 * Deve envolver toda a aplicacao para fornecer o contexto
 *
 * @param {ReactNode} children - Componentes filhos
 */
export function AuthProvider({ children }) {
  // Estado do usuario logado (null = deslogado)
  const [user, setUser] = useState(null);

  // Estado de carregamento (true enquanto verifica localStorage)
  const [loading, setLoading] = useState(true);

  /**
   * Effect que executa ao montar o componente
   * Verifica se existe sessao salva no localStorage
   */
  useEffect(() => {
    // Tenta recuperar usuario e token do localStorage
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    // Se ambos existem, restaura a sessao
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }

    // Marca carregamento como concluido
    setLoading(false);
  }, []); // Array vazio = executa apenas uma vez

  /**
   * Funcao de login
   * Autentica usuario na API e salva sessao
   *
   * @param {string} email - Email do usuario
   * @param {string} password - Senha do usuario
   * @returns {Object} Dados do usuario logado
   * @throws {Error} Se credenciais invalidas
   */
  const login = async (email, password) => {
    // Chama API de login
    const response = await authService.login(email, password);

    // Extrai usuario e token da resposta
    const { user, token } = response.data.data;

    // Salva no localStorage para persistir sessao
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    // Atualiza estado
    setUser(user);

    return user;
  };

  /**
   * Funcao de registro
   * Cadastra novo usuario e ja faz login automatico
   *
   * @param {Object} data - Dados do usuario (name, email, password, phone)
   * @returns {Object} Dados do usuario criado
   * @throws {Error} Se email ja cadastrado ou dados invalidos
   */
  const register = async (data) => {
    // Chama API de registro
    const response = await authService.register(data);

    // Extrai usuario e token da resposta
    const { user, token } = response.data.data;

    // Salva no localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    // Atualiza estado
    setUser(user);

    return user;
  };

  /**
   * Funcao de logout
   * Remove sessao do localStorage e limpa estado
   */
  const logout = () => {
    // Remove dados do localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Limpa estado
    setUser(null);
  };

  // Valores computados
  // !! converte para booleano (true se user existe, false se null)
  const isAuthenticated = !!user;

  // Verifica se usuario e admin
  const isAdmin = user?.role === 'ADMIN';

  // Retorna o Provider com todos os valores e funcoes
  return (
    <AuthContext.Provider
      value={{
        user,           // Dados do usuario ou null
        loading,        // true enquanto verifica localStorage
        isAuthenticated,// true se logado
        isAdmin,        // true se role = ADMIN
        login,          // Funcao de login
        register,       // Funcao de registro
        logout,         // Funcao de logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook personalizado para usar o contexto de autenticacao
 * Facilita o acesso aos dados e funcoes de auth
 *
 * @returns {Object} Valores do contexto de auth
 * @throws {Error} Se usado fora do AuthProvider
 *
 * @example
 * function MeuComponente() {
 *   const { user, isAuthenticated, login, logout } = useAuth();
 *
 *   if (!isAuthenticated) {
 *     return <button onClick={() => login(email, senha)}>Entrar</button>;
 *   }
 *
 *   return <p>Ola, {user.name}!</p>;
 * }
 */
export function useAuth() {
  const context = useContext(AuthContext);

  // Garante que o hook seja usado dentro do Provider
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
