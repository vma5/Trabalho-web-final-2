/**
 * ============================================
 * ARQUIVO: uploadMiddleware.js
 * DESCRICAO: Middleware de upload de arquivos com Multer
 * ============================================
 *
 * Configura o Multer para upload de imagens de produtos.
 *
 * Funcionalidades:
 * - Salva arquivos em /uploads/products
 * - Gera nomes unicos com UUID
 * - Valida tipos de arquivo permitidos
 * - Limita tamanho maximo do arquivo
 * - Trata erros de upload
 *
 * Uso nas rotas:
 * router.post('/image',
 *   upload.single('image'),
 *   handleUploadError,
 *   controller.uploadImage
 * )
 */

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // Gera UUIDs unicos

// ============================================
// CONFIGURACAO DE ARMAZENAMENTO
// ============================================

/**
 * Configura onde e como os arquivos serao salvos
 *
 * diskStorage: Salva em disco (alternativa: memoryStorage)
 * destination: Pasta de destino dos arquivos
 * filename: Funcao que gera nome unico para o arquivo
 */
const storage = multer.diskStorage({
  // Define pasta de destino
  destination: (req, file, cb) => {
    cb(null, 'uploads/products');
  },

  // Gera nome unico para evitar conflitos
  // Formato: <uuid>.<extensao-original>
  // Ex: 550e8400-e29b-41d4-a716-446655440000.jpg
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// ============================================
// FILTRO DE TIPOS DE ARQUIVO
// ============================================

/**
 * Valida o tipo MIME do arquivo enviado
 *
 * Apenas imagens sao permitidas:
 * - JPEG (.jpg, .jpeg)
 * - PNG (.png)
 * - WebP (.webp)
 *
 * @param {Object} req - Request do Express
 * @param {Object} file - Objeto do arquivo (Multer)
 * @param {Function} cb - Callback (erro, aceitar)
 */
const fileFilter = (req, file, cb) => {
  // Lista de tipos MIME permitidos
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

  if (allowedTypes.includes(file.mimetype)) {
    // Tipo permitido - aceita o arquivo
    cb(null, true);
  } else {
    // Tipo nao permitido - rejeita com erro
    cb(new Error('Tipo de arquivo nao permitido. Use JPEG, PNG ou WebP.'), false);
  }
};

// ============================================
// INSTANCIA DO MULTER
// ============================================

/**
 * Cria instancia do Multer com configuracoes
 *
 * storage: Como/onde salvar arquivos
 * fileFilter: Validacao de tipos
 * limits: Restricoes (tamanho max, etc)
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB em bytes
  },
});

// ============================================
// TRATAMENTO DE ERROS
// ============================================

/**
 * Middleware para tratar erros de upload
 *
 * Captura erros do Multer e retorna mensagens amigaveis.
 * Deve ser usado APOS upload.single() na cadeia de middlewares.
 *
 * @param {Error} err - Erro do Multer ou customizado
 * @param {Object} req - Request do Express
 * @param {Object} res - Response do Express
 * @param {Function} next - Proximo middleware
 */
const handleUploadError = (err, req, res, next) => {
  // Erro especifico do Multer
  if (err instanceof multer.MulterError) {
    // Arquivo excedeu tamanho maximo
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Arquivo muito grande. Tamanho maximo: 5MB',
      });
    }

    // Outros erros do Multer
    return res.status(400).json({
      success: false,
      message: 'Erro no upload do arquivo',
    });
  }

  // Erro customizado (ex: tipo de arquivo invalido)
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Sem erros - continua para proximo middleware
  next();
};

module.exports = { upload, handleUploadError };
