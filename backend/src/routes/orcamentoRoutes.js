const express = require('express');
const router = express.Router();
const orcamentoController = require('../controllers/orcamentoController');
const { verificarToken } = require('../middleware/authMiddleware');

// Todas as rotas precisam de autenticação
router.use(verificarToken);

router.get('/', orcamentoController.listar);
router.get('/:id', orcamentoController.buscarPorId);
router.post('/', orcamentoController.criar);
router.put('/:id', orcamentoController.atualizar);
router.delete('/:id', orcamentoController.deletar);

module.exports = router;