/**
 * ============================================
 * ARQUIVO: Register.jsx
 * DESCRICAO: Pagina de cadastro de novos usuarios
 * ============================================
 *
 * Permite que novos usuarios se cadastrem no sistema.
 *
 * Funcionalidades:
 * - Formulario com nome, email, telefone e senha
 * - Validacao de campos obrigatorios
 * - Validacao de tamanho minimo da senha
 * - Toggle para mostrar/ocultar senha
 * - Feedback visual de loading
 * - Mensagens de erro/sucesso com toast
 * - Link para pagina de login
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Register() {
  // ==========================================
  // ESTADOS
  // ==========================================

  // Campos do formulario
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Controla visibilidade da senha
  const [showPassword, setShowPassword] = useState(false);

  // Estado de carregamento do submit
  const [loading, setLoading] = useState(false);

  // ==========================================
  // HOOKS
  // ==========================================

  // Funcao de registro do contexto de autenticacao
  const { register } = useAuth();

  // Hook de navegacao programatica
  const navigate = useNavigate();

  // ==========================================
  // HANDLERS
  // ==========================================

  /**
   * Processa o envio do formulario de cadastro
   *
   * Validacoes:
   * - Nome, email e senha sao obrigatorios
   * - Senha deve ter no minimo 6 caracteres
   *
   * @param {Event} e - Evento do formulario
   */
  const handleSubmit = async (e) => {
    // Previne reload da pagina
    e.preventDefault();

    // Valida campos obrigatorios
    if (!name || !email || !password) {
      toast.error('Preencha os campos obrigatorios');
      return;
    }

    // Valida tamanho da senha
    if (password.length < 6) {
      toast.error('A senha deve ter no minimo 6 caracteres');
      return;
    }

    try {
      setLoading(true);

      // Chama API de registro atraves do contexto
      const user = await register({ name, email, phone, password });

      // Sucesso - exibe mensagem e redireciona para home
      toast.success(`Bem-vindo, ${user.name}!`);
      navigate('/');
    } catch (error) {
      // Erro - exibe mensagem da API ou generica
      toast.error(error.response?.data?.message || 'Erro ao criar conta');
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
          Formulario de cadastro
          ========================================== */}
      <div className="auth-right">
        <div className="auth-form-container">
          <h2>Criar uma conta</h2>
          <p className="auth-subtitle">Preencha seus dados para se cadastrar</p>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Campo nome (obrigatorio) */}
            <div className="form-group">
              <label className="form-label">Nome completo *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Campo email (obrigatorio) */}
            <div className="form-group">
              <label className="form-label">E-mail *</label>
              <input
                type="email"
                className="form-input"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Campo telefone (opcional) */}
            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input
                type="tel"
                className="form-input"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {/* Campo senha com toggle de visibilidade */}
            <div className="form-group">
              <label className="form-label">Senha *</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Minimo 6 caracteres"
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
              {loading ? <span className="loader loader-sm"></span> : 'Criar conta'}
            </button>
          </form>

          {/* Link para login */}
          <p className="auth-footer">
            Ja tem uma conta? <Link to="/login">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
