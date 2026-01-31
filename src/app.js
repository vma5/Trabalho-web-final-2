/**
 * ============================================
 * ARQUIVO: app.js
 * DESCRICAO: Configuracao principal do Express
 * ============================================
 *
 * Este arquivo configura o servidor Express com:
 * - Middlewares de seguranca (helmet, cors)
 * - Parser de JSON para requisicoes
 * - Servir arquivos estaticos (uploads)
 * - Rotas da API
 * - Tratamento de erros
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config(); // Carrega variaveis de ambiente do .env

// Importa as rotas e middleware de erro
const routes = require('./routes');
const errorMiddleware = require('./middlewares/errorMiddleware');

// Cria a instancia do Express
const app = express();

// ============================================
// MIDDLEWARES DE SEGURANCA
// ============================================

/**
 * Helmet: Adiciona headers de seguranca HTTP
 * - Protege contra XSS, clickjacking, etc
 */
app.use(helmet());

/**
 * CORS: Permite requisicoes de outros dominios
 * - origin: URL do frontend permitida
 * - credentials: Permite envio de cookies
 */
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
}));

// ============================================
// PARSERS DE REQUISICAO
// ============================================

/**
 * Parser JSON: Converte body da requisicao em objeto JS
 * - limit: Tamanho maximo do body (10MB para uploads)
 */
app.use(express.json({ limit: '10mb' }));

/**
 * Parser URL Encoded: Para formularios HTML tradicionais
 */
app.use(express.urlencoded({ extended: true }));

// ============================================
// ARQUIVOS ESTATICOS
// ============================================

/**
 * Serve arquivos da pasta uploads
 * Ex: GET /uploads/products/imagem.jpg
 */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================================
// ROTAS DA API
// ============================================

/**
 * Todas as rotas da API comecam com /api
 * Ex: /api/auth, /api/products, /api/orders
 */
app.use('/api', routes);

/**
 * Rota de Health Check
 * Usada para verificar se o servidor esta funcionando
 * GET /health -> { status: 'OK', timestamp: '...' }
 */
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ============================================
// TRATAMENTO DE ERROS
// ============================================

/**
 * Rota 404: Captura requisicoes para rotas inexistentes
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota nao encontrada',
  });
});

/**
 * Middleware de erro global
 * Captura todos os erros nao tratados e retorna resposta padronizada
 */
app.use(errorMiddleware);

// Exporta o app configurado para uso no server.js
module.exports = app;
