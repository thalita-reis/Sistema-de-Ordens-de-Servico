const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');
const { Usuario } = require('../models');

module.exports = {
  async verificarToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const [, token] = authHeader.split(' ');

    try {
      const decoded = jwt.verify(token, authConfig.secret);
      req.userId = decoded.id;
      req.userTipo = decoded.tipo;
      
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido' });
    }
  },

  verificarAdmin(req, res, next) {
    if (req.userTipo !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }
    return next();
  },

  verificarDesenvolvedor(req, res, next) {
    if (req.userTipo !== 'admin' && req.userTipo !== 'desenvolvedor') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores e desenvolvedores.' });
    }
    return next();
  }
};