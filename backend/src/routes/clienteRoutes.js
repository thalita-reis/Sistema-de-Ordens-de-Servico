const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const { verificarToken } = require('../middleware/authMiddleware');

// ============================================
// MIDDLEWARE: Todas as rotas precisam de autenticação
// ============================================
router.use(verificarToken);

// ============================================
// ROTAS PRINCIPAIS (FUNCIONANDO)
// ============================================

// LISTAR CLIENTES com paginação e filtros
router.get('/', clienteController.listar);

// BUSCAR CLIENTE POR ID (usando método que existe no controller)
router.get('/:id', clienteController.buscarPorId);

// BUSCAR CLIENTE POR CPF (novo método)
router.get('/cpf/:cpf', clienteController.buscarPorCpf);

// VERIFICAR SE CPF EXISTE (novo método)
router.get('/verificar-cpf/:cpf', clienteController.verificarCpf);

// BUSCAR OU CRIAR CLIENTE (novo método premium!)
router.post('/buscar-ou-criar', clienteController.buscarOuCriar);

// CRIAR CLIENTE NOVO
router.post('/', clienteController.criar);

// ATUALIZAR CLIENTE (usando método que existe)
router.put('/:id', clienteController.atualizar);

// DELETAR CLIENTE (usando método que existe)
router.delete('/:id', clienteController.deletar);

// ============================================
// ROTAS ESPECIAIS (NOVAS)
// ============================================

// ESTATÍSTICAS GERAIS
router.get('/estatisticas/:empresa_id?', clienteController.obterEstatisticas);

// ============================================
// ROTAS REMOVIDAS (métodos não implementados)
// ============================================

// Estas rotas foram comentadas porque os métodos não existem no controller:
// router.put('/cpf/:cpf', clienteController.atualizarPorCpf);
// router.delete('/cpf/:cpf', clienteController.desativarPorCpf);
// router.get('/historico/:cpf', clienteController.buscarHistoricoCompleto);

// ============================================
// TRATAMENTO DE ERROS GLOBAL
// ============================================
router.use((error, req, res, next) => {
  console.error('Erro nas rotas de cliente:', error);
  
  res.status(error.status || 500).json({
    sucesso: false,
    erro: error.message || 'Erro interno do servidor',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
