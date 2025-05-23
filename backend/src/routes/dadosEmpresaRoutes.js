const express = require('express');
const router = express.Router();
const dadosEmpresaController = require('../controllers/dadosEmpresaController');
const { verificarToken, verificarAdmin } = require('../middleware/authMiddleware');

// Rotas protegidas
router.use(verificarToken);

router.get('/', dadosEmpresaController.buscar);
router.put('/', verificarAdmin, dadosEmpresaController.atualizar);

module.exports = router;