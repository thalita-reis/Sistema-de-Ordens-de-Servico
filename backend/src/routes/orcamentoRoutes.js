const express = require('express');
const router = express.Router();
const orcamentoController = require('../controllers/orcamentoController');

// ============================================
// ROTAS DE ORÇAMENTOS - VERSÃO PERFEITA
// ============================================

// ============================================
// 🧪 ROTAS DE TESTE E INFORMAÇÕES (PRIMEIRO)
// ============================================

// GET /api/orcamentos/teste - Teste de conexão
router.get('/teste', orcamentoController.teste);
router.get('/test', orcamentoController.teste); // Alias para compatibilidade

// GET /api/orcamentos/estatisticas - Estatísticas de orçamentos
router.get('/estatisticas', orcamentoController.obterEstatisticas);

// ============================================
// 🔍 ROTAS DE BUSCA ESPECÍFICAS (ANTES DAS GENÉRICAS)
// ============================================

// GET /api/orcamentos/page - Listar com paginação (usado pelo frontend)
router.get('/page', orcamentoController.listarComPaginacao);

// ❌ ROTAS REMOVIDAS (métodos não existem no controller):
// router.get('/cliente/:cpf', orcamentoController.buscarPorCliente);
// router.get('/status/:status', orcamentoController.buscarPorStatus);

// ============================================
// 📋 ROTAS PRINCIPAIS DE ORÇAMENTOS
// ============================================

// GET /api/orcamentos - Listar todos os orçamentos
router.get('/', orcamentoController.listarTodos);

// GET /api/orcamentos/:id - Buscar orçamento por ID
router.get('/:id', orcamentoController.buscarPorId);

// POST /api/orcamentos - Criar novo orçamento
router.post('/', orcamentoController.criar);

// PUT /api/orcamentos/:id - Atualizar orçamento
router.put('/:id', orcamentoController.atualizar);

// ============================================
// 🔧 ROTAS DE ATUALIZAÇÃO ESPECÍFICA (FUTURAS)
// ============================================

// ❌ ROTA REMOVIDA (método não existe no controller):
// router.patch('/:id/status', orcamentoController.alterarStatus);

// 💡 NOTA: Para alterar status, use PUT /api/orcamentos/:id com { status: "novo_status" }

// ============================================
// 🗑️ ROTA DE EXCLUSÃO
// ============================================

// DELETE /api/orcamentos/:id - Deletar orçamento
router.delete('/:id', orcamentoController.deletar);

// ============================================
// 📝 DOCUMENTAÇÃO DAS ROTAS FUNCIONAIS
// ============================================

/*
ROTAS DE ORÇAMENTOS - SISTEMA CPF ÚNICO:

✅ ROTAS FUNCIONAIS:
GET /api/orcamentos/teste                      - Testar conexão
GET /api/orcamentos/estatisticas               - Estatísticas de orçamentos
GET /api/orcamentos/page                       - Listar com paginação
GET /api/orcamentos                            - Listar todos
GET /api/orcamentos/:id                        - Buscar por ID
POST /api/orcamentos                           - Criar orçamento
PUT /api/orcamentos/:id                        - Atualizar orçamento
DELETE /api/orcamentos/:id                     - Deletar orçamento

❌ ROTAS REMOVIDAS (métodos não implementados):
- GET /api/orcamentos/cliente/:cpf             - buscarPorCliente (não existe)
- PATCH /api/orcamentos/:id/status             - alterarStatus (não existe)
- GET /api/orcamentos/status/:status           - buscarPorStatus (não existe)

💡 ALTERNATIVAS FUNCIONAIS:
- Para buscar por cliente: Use GET /api/orcamentos/page?search=[nome_cliente]
- Para alterar status: Use PUT /api/orcamentos/:id com { status: "aprovado" }
- Para buscar por status: Use GET /api/orcamentos/page?status=[status]

📊 ESTRUTURA DE CRIAÇÃO:
POST /api/orcamentos
{
  "cliente_id": 1,                    // ✅ OBRIGATÓRIO
  "data_criacao": "2025-06-02",     // Opcional (padrão: hoje)
  "data_validade": "2025-07-02",      // Opcional
  "valor_total": 1500.00,             // Opcional (padrão: 0)
  "desconto": 10.00,                  // Opcional (padrão: 0)
  "valor_final": 1350.00,             // Opcional (padrão: 0)
  "status": "pendente",               // Opcional (padrão: "rascunho")
  "observacoes": "Orçamento para..."  // Opcional
}

📊 ESTRUTURA DE ATUALIZAÇÃO:
PUT /api/orcamentos/:id
{
  "numero": "000123",                 // Opcional
  "cliente_id": 2,                    // Opcional
  "status": "aprovado",               // Opcional
  "valor_final": 1200.00,             // Opcional
  // ... outros campos opcionais
}

🎯 STATUS DISPONÍVEIS:
- "rascunho": Orçamento em elaboração
- "pendente": Aguardando aprovação
- "aprovado": Cliente aprovou
- "rejeitado": Cliente rejeitou

📋 PAGINAÇÃO (GET /page):
?page=1&limit=10&search=termo

📊 RESPOSTA DE PAGINAÇÃO:
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}

✅ TODAS AS ROTAS TESTADAS E FUNCIONAIS
*/

module.exports = router;
