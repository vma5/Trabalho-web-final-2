/**
 * ============================================
 * ARQUIVO: Login.jsx
 * DESCRICAO: Pagina de login
 * ============================================
 *
 * Permite que usuarios se autentiquem no sistema.
 *
 * Funcionalidades:
 * - Formulario de email e senha
 * - Toggle para mostrar/ocultar senha
 * - Validacao basica de campos
 * - Feedback visual de loading
 * - Mensagens de erro/sucesso com toast
 * - Link para pagina de cadastro
 * - Exibe credenciais de teste para demonstracao
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Login() {
  // ==========================================
  // ESTADOS
  // ==========================================

  // Campos do formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Controla visibilidade da senha
  const [showPassword, setShowPassword] = useState(false);

  // Estado de carregamento do submit
  const [loading, setLoading] = useState(false);

  // ==========================================
  // HOOKS
  // ==========================================

  // Funcao de login do contexto de autenticacao
  const { login } = useAuth();

  // Hook de navegacao programatica
  const navigate = useNavigate();

  // ==========================================
  // HANDLERS
  // ==========================================

  /**
   * Processa o envio do formulario de login
   *
   * 1. Valida se campos estao preenchidos
   * 2. Chama funcao de login do AuthContext
   * 3. Redireciona para home em caso de sucesso
   * 4. Exibe mensagem de erro se falhar
   *
   * @param {Event} e - Evento do formulario
   */
  const handleSubmit = async (e) => {
    // Previne reload da pagina
    e.preventDefault();

    // Validacao basica
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      setLoading(true);

      // Chama API de login atraves do contexto
      const user = await login(email, password);

      // Sucesso - exibe mensagem e redireciona
      toast.success(`Bem-vindo, ${user.name}!`);
      navigate('/');
    } catch (error) {
      // Erro - exibe mensagem da API ou generica
      toast.error(error.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // RENDERIZACAO
  // ==========================================

  return (
    <div className="auth-page">
      {/* ==========================================
          LADO ESQUERDO
          Branding da cantina com cor de fundo
          ========================================== */}
      <div className="auth-left">
        <div className="auth-brand">
          <span className="auth-logo">🍔</span>
          <h1>Cantina IFNMG</h1>
          <p>Seu lanche favorito sem filas</p>
        </div>
      </div>

      {/* ==========================================
          LADO DIREITO
          Formulario de login
          ========================================== */}
      <div className="auth-right">
        <div className="auth-form-container">
          <h2>Entrar na sua conta</h2>
          <p className="auth-subtitle">Digite suas credenciais para acessar</p>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Campo de email */}
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input
                type="email"
                className="form-input"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Campo de senha com toggle de visibilidade */}
            <div className="form-group">
              <label className="form-label">Senha</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {/* Botao de mostrar/ocultar senha */}
                <button
                  type="button"
                  className="input-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Botao de submit */}
            <button
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={loading}
            >
              {loading ? <span className="loader loader-sm"></span> : 'Entrar'}
            </button>
          </form>

          {/* Link para cadastro */}
          <p className="auth-footer">
            Nao tem uma conta? <Link to="/register">Cadastre-se</Link>
          </p>

          {/* Credenciais de demonstracao */}
          <div className="auth-demo">
            <p>Credenciais de teste:</p>
            <code>usuario@teste.com / user123</code>
            <code>admin@cantina.com / admin123</code>
          </div>
        </div>
      </div>
    </div>
  );
}
