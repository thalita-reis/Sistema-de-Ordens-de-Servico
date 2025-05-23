const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken } = require('../middleware/authMiddleware');

router.post('/registrar', authController.registrar);
router.post('/login', authController.login);
router.get('/perfil', verificarToken, authController.perfil);

module.exports = router;