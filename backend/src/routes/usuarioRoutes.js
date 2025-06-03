const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// ============================================
// ROTAS DE USUÁRIOS - VERSÃO COMPLETA
// ============================================

// ============================================
// 🧪 ROTAS DE TESTE E INFORMAÇÕES (PRIMEIRO)
// ============================================

// GET /api/usuarios/teste - Teste de conexão
router.get('/teste', usuarioController.teste);

// GET /api/usuarios/estatisticas - Estatísticas de usuários
router.get('/estatisticas', usuarioController.obterEstatisticas);

// ============================================
// 🔍 ROTAS DE BUSCA E VALIDAÇÃO (ESPECÍFICAS)
// ============================================

// GET /api/usuarios/validar-email - Validar se email é único
router.get('/validar-email', usuarioController.validarEmail);

// GET /api/usuarios/buscar - Buscar usuários com filtros
router.get('/buscar', usuarioController.buscarComFiltros);

// GET /api/usuarios/email/:email - Buscar usuário por email
router.get('/email/:email', usuarioController.buscarPorEmail);

// ============================================
// 📋 ROTAS PRINCIPAIS DE USUÁRIOS
// ============================================

// GET /api/usuarios - Listar todos os usuários
router.get('/', usuarioController.listarTodos);

// GET /api/usuarios/:id - Buscar usuário por ID
router.get('/:id', usuarioController.buscarPorId);

// POST /api/usuarios - Criar novo usuário
router.post('/', usuarioController.criar);

// PUT /api/usuarios/:id - Atualizar usuário completo
router.put('/:id', usuarioController.atualizar);

// ============================================
// 🔧 ROTAS DE ATUALIZAÇÃO ESPECÍFICA (PATCH)
// ============================================

// PATCH /api/usuarios/:id/status - Alterar apenas status ativo/inativo
router.patch('/:id/status', usuarioController.alterarStatus);

// PATCH /api/usuarios/:id/tipo - Alterar apenas tipo/permissão
router.patch('/:id/tipo', usuarioController.alterarTipo);

// PATCH /api/usuarios/:id/senha - Alterar apenas senha
router.patch('/:id/senha', usuarioController.alterarSenha);

// ============================================
// 🗑️ ROTA DE EXCLUSÃO
// ============================================

// DELETE /api/usuarios/:id - Deletar usuário
router.delete('/:id', usuarioController.deletar);

// ============================================
// 🛡️ MIDDLEWARE DE LOGS (OPCIONAL)
// ============================================

// Middleware para log de todas as operações de usuários
router.use((req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log da resposta para debug
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${req.method} ${req.originalUrl} - Status: ${res.statusCode}`);
    }
    originalSend.call(this, data);
  };
  
  next();
});

// ============================================
// 📝 DOCUMENTAÇÃO DAS ROTAS
// ============================================

/*
DOCUMENTAÇÃO COMPLETA DAS ROTAS DE USUÁRIOS:

🧪 TESTE E INFORMAÇÕES:
GET /api/usuarios/teste                    - Testar conexão com banco
GET /api/usuarios/estatisticas             - Obter estatísticas dos usuários

🔍 BUSCA E VALIDAÇÃO:
GET /api/usuarios/validar-email            - Validar se email é único
    Query: ?email=teste@teste.com&excluir_id=1
GET /api/usuarios/buscar                   - Buscar com filtros
    Query: ?nome=João&tipo=admin&ativo=true&limite=10&pagina=1
GET /api/usuarios/email/:email             - Buscar usuário por email específico

📋 OPERAÇÕES PRINCIPAIS:
GET /api/usuarios                          - Listar todos os usuários
GET /api/usuarios/:id                      - Buscar usuário por ID
POST /api/usuarios                         - Criar novo usuário
    Body: { nome, email, senha, tipo?, ativo? }
PUT /api/usuarios/:id                      - Atualizar usuário completo
    Body: { nome?, email?, senha?, tipo?, ativo? }

🔧 ATUALIZAÇÕES ESPECÍFICAS:
PATCH /api/usuarios/:id/status             - Alterar apenas status
    Body: { ativo: true/false }
PATCH /api/usuarios/:id/tipo               - Alterar apenas permissão
    Body: { tipo: "admin" | "usuario" }
PATCH /api/usuarios/:id/senha              - Alterar apenas senha
    Body: { novaSenha, senhaAtual? }

🗑️ EXCLUSÃO:
DELETE /api/usuarios/:id                   - Deletar usuário

📊 RESPOSTAS PADRÃO:
Sucesso: { sucesso: true, data: {...}, mensagem: "..." }
Erro: { erro: "...", mensagem: "...", success: false }

🔒 TIPOS DE USUÁRIO ACEITOS:
- "administrador" ou "admin" → Normalizado para "administrador"
- "usuario" ou "user" → Normalizado para "usuario"

✅ VALIDAÇÕES:
- Email único no sistema
- Senha mínima de 6 caracteres
- Campos obrigatórios validados
- IDs validados como números
- Tipos de usuário normalizados

🧪 ENDPOINTS DE TESTE:
- /teste: Verifica se API está funcionando
- /estatisticas: Retorna contadores de usuários
- /validar-email: Testa se email pode ser usado

🔍 FILTROS DISPONÍVEIS NA BUSCA:
- nome: Busca parcial no nome (ILIKE)
- email: Busca parcial no email (ILIKE)  
- tipo: Busca exata por tipo
- ativo: true/false para status
- limite: Número máximo de resultados
- pagina: Página para paginação

EXEMPLO DE USO:
GET /api/usuarios/buscar?nome=João&tipo=admin&limite=5&pagina=1
*/

module.exports = router;