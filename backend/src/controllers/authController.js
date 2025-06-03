const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database'); // Usando nossa conexão PostgreSQL
const authConfig = require('../config/auth');

module.exports = {
  async registrar(req, res) {
    try {
      const { nome, email, senha, tipo } = req.body;

      // Verificar se usuário já existe
      const usuarioExistente = await pool.query(
        'SELECT id FROM usuarios WHERE email = $1',
        [email]
      );
      
      if (usuarioExistente.rows.length > 0) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      // Criptografar senha
      const senhaHash = await bcrypt.hash(senha, 10);

      // Criar usuário
      const resultado = await pool.query(`
        INSERT INTO usuarios (nome, email, senha, tipo, ativo, created_at, updated_at) 
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
        RETURNING id, nome, email, tipo, ativo, created_at
      `, [nome, email, senhaHash, tipo || 'usuario', true]);

      const usuario = resultado.rows[0];

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
      console.error('Erro ao registrar usuário:', error);
      
      // Tratar erro de email duplicado
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }
      
      return res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
  },

  async login(req, res) {
    try {
      const { email, senha } = req.body;

      // Buscar usuário
      const resultado = await pool.query(
        'SELECT id, nome, email, senha, tipo, ativo FROM usuarios WHERE email = $1',
        [email]
      );
      
      if (resultado.rows.length === 0) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const usuario = resultado.rows[0];

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
      delete usuario.senha;

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
      console.error('Erro ao fazer login:', error);
      return res.status(500).json({ error: 'Erro ao fazer login' });
    }
  },

  async perfil(req, res) {
    try {
      const resultado = await pool.query(
        'SELECT id, nome, email, tipo, ativo, created_at, updated_at FROM usuarios WHERE id = $1',
        [req.userId]
      );

      if (resultado.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const usuario = resultado.rows[0];

      return res.json(usuario);
      
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
  },

  // ============================================
  // MÉTODOS EXTRAS (BONUS)
  // ============================================

  async listarUsuarios(req, res) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT id, nome, email, tipo, ativo, created_at, updated_at 
        FROM usuarios 
        WHERE 1=1
      `;
      let params = [];

      if (search) {
        query += ` AND (nome ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`;
        params.push(`%${search}%`);
      }

      query += ` ORDER BY nome LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const resultado = await pool.query(query, params);

      // Contar total
      let countQuery = 'SELECT COUNT(*) FROM usuarios WHERE 1=1';
      let countParams = [];

      if (search) {
        countQuery += ` AND (nome ILIKE $${countParams.length + 1} OR email ILIKE $${countParams.length + 1})`;
        countParams.push(`%${search}%`);
      }

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      return res.json({
        usuarios: resultado.rows,
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page)
      });

    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      return res.status(500).json({ error: 'Erro ao listar usuários' });
    }
  },

  async atualizarUsuario(req, res) {
    try {
      const { id } = req.params;
      const { nome, email, tipo, ativo } = req.body;

      // Verificar se usuário existe
      const usuarioExistente = await pool.query(
        'SELECT id FROM usuarios WHERE id = $1',
        [id]
      );

      if (usuarioExistente.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Atualizar usuário
      const resultado = await pool.query(`
        UPDATE usuarios 
        SET nome = $1, email = $2, tipo = $3, ativo = $4, updated_at = NOW()
        WHERE id = $5
        RETURNING id, nome, email, tipo, ativo, created_at, updated_at
      `, [nome, email, tipo, ativo, id]);

      return res.json(resultado.rows[0]);

    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }
      
      return res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
  },

  async alterarSenha(req, res) {
    try {
      const { senhaAtual, novaSenha } = req.body;
      const userId = req.userId;

      // Buscar usuário atual
      const resultado = await pool.query(
        'SELECT senha FROM usuarios WHERE id = $1',
        [userId]
      );

      if (resultado.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const usuario = resultado.rows[0];

      // Verificar senha atual
      const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
      if (!senhaValida) {
        return res.status(401).json({ error: 'Senha atual incorreta' });
      }

      // Criptografar nova senha
      const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

      // Atualizar senha
      await pool.query(
        'UPDATE usuarios SET senha = $1, updated_at = NOW() WHERE id = $2',
        [novaSenhaHash, userId]
      );

      return res.json({ message: 'Senha alterada com sucesso' });

    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return res.status(500).json({ error: 'Erro ao alterar senha' });
    }
  }
};
