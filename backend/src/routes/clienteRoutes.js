const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

// ============================================
// ROTAS DE CLIENTES - FUNCIONAIS
// ============================================

// GET /api/clientes - Listar todos os clientes
router.get('/', clienteController.listarTodos);

// GET /api/clientes/pesquisar/:termo - Pesquisar clientes
router.get('/pesquisar/:termo', clienteController.pesquisar);

// GET /api/clientes/verificar-cpf/:cpf - Verificar se CPF existe
router.get('/verificar-cpf/:cpf', clienteController.verificarCpfExiste);

// GET /api/clientes/cpf/:cpf - Buscar cliente por CPF
router.get('/cpf/:cpf', clienteController.buscarPorCpf);

// POST /api/clientes/buscar-ou-criar - Buscar ou criar cliente
router.post('/buscar-ou-criar', clienteController.buscarOuCriar);

// POST /api/clientes/validar-cpf - Validar CPF
router.post('/validar-cpf', clienteController.validarCpf);

// POST /api/clientes - Criar novo cliente
router.post('/', clienteController.criar);

// GET /api/clientes/:id - Buscar cliente por ID (deve ficar após rotas específicas)
router.get('/:id', clienteController.buscarPorId);

// PUT /api/clientes/:id - Atualizar cliente
router.put('/:id', clienteController.atualizar);

// DELETE /api/clientes/:id - Inativar cliente
router.delete('/:id', clienteController.inativar);

// DELETE /api/clientes/:id/deletar - Deletar permanentemente
router.delete('/:id/deletar', clienteController.deletar);

module.exports = router;