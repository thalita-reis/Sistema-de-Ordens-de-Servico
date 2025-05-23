const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const authConfig = require('../config/auth');

module.exports = {
  async registrar(req, res) {
    try {
      const { nome, email, senha, tipo } = req.body;

      // Verificar se usuário já existe
      const usuarioExistente = await Usuario.findOne({ where: { email } });
      if (usuarioExistente) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      // Criptografar senha
      const senhaHash = await bcrypt.hash(senha, 10);

      // Criar usuário
      const usuario = await Usuario.create({
        nome,
        email,
        senha: senhaHash,
        tipo: tipo || 'usuario'
      });

      // Remover senha do retorno
      usuario.senha = undefined;

      // Gerar token
      const token = jwt.sign(
        { id: usuario.id, tipo: usuario.tipo },
        authConfig.secret,
        { expiresIn: authConfig.expiresIn }
      );

      return res.status(201).json({
        usuario,
        token
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
  },

  async login(req, res) {
    try {
      const { email, senha } = req.body;

      // Buscar usuário
      const usuario = await Usuario.findOne({ where: { email } });
      if (!usuario) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Verificar senha
      const senhaValida = await bcrypt.compare(senha, usuario.senha);
      if (!senhaValida) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Verificar se usuário está ativo
      if (!usuario.ativo) {
        return res.status(401).json({ error: 'Usuário inativo' });
      }

      // Remover senha do retorno
      usuario.senha = undefined;

      // Gerar token
      const token = jwt.sign(
        { id: usuario.id, tipo: usuario.tipo },
        authConfig.secret,
        { expiresIn: authConfig.expiresIn }
      );

      return res.json({
        usuario,
        token
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao fazer login' });
    }
  },

  async perfil(req, res) {
    try {
      const usuario = await Usuario.findByPk(req.userId, {
        attributes: { exclude: ['senha'] }
      });

      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      return res.json(usuario);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
  }
};