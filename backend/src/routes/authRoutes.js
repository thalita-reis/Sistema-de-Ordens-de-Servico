const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult, body } = require('express-validator');

// ============================================
// 🔧 IMPORTAÇÃO DO BANCO - SEM MODELS
// ============================================
const { pool } = require('../config/database');

// ============================================
// 🛡️ MIDDLEWARE DE AUTENTICAÇÃO
// ============================================
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1]; // Remove 'Bearer '
    
    if (!token) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    // Usar a mesma chave do auth.js
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key');
    req.userId = decoded.id;
    req.userType = decoded.tipo;
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

const router = express.Router();

// ============================================
// 🔐 LOGIN
// ============================================
router.post('/login', [
  body('email').isEmail().withMessage('Email deve ser válido'),
  body('senha').notEmpty().withMessage('Senha é obrigatória')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    console.log('\n🔐 =================================');
    console.log('🚪 PROCESSANDO LOGIN');
    console.log('=================================');
    
    const { email, senha } = req.body;
    console.log('📧 Email:', email);

    // Buscar usuário no banco usando SQL direto
    const query = 'SELECT * FROM usuarios WHERE email = $1 AND ativo = true';
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      console.log('❌ Usuário não encontrado');
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const usuario = result.rows[0];

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      console.log('❌ Senha incorreta');
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Gerar token usando a mesma chave do auth.js
    const token = jwt.sign(
      { 
        id: usuario.id, 
        tipo: usuario.tipo,
        email: usuario.email 
      },
      process.env.JWT_SECRET || 'super-secret-key',
      { expiresIn: '7d' }
    );

    console.log('✅ Login realizado com sucesso!');
    console.log('👤 Usuário:', usuario.nome);
    console.log('🎫 Tipo:', usuario.tipo);
    console.log('=================================\n');

    // Retornar dados (sem senha)
    const { senha: _, ...usuarioSemSenha } = usuario;

    res.json({
      token,
      usuario: usuarioSemSenha
    });

  } catch (error) {
    console.error('\n❌ Erro no login:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ============================================
// ✨ REGISTRO
// ============================================
router.post('/registrar', [
  body('nome')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Nome deve ter pelo menos 2 caracteres'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email deve ser válido'),
  body('senha')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('tipo')
    .optional()
    .isIn(['admin', 'operador'])
    .withMessage('Tipo deve ser admin ou operador')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors.array()
      });
    }

    console.log('\n✨ =================================');
    console.log('📝 PROCESSANDO REGISTRO');
    console.log('=================================');

    const { nome, email, senha, tipo = 'operador' } = req.body;
    
    console.log('📧 Email:', email);
    console.log('👤 Nome:', nome);
    console.log('🎫 Tipo:', tipo);

    // Verificar se email já existe
    const checkQuery = 'SELECT id FROM usuarios WHERE email = $1';
    const checkResult = await pool.query(checkQuery, [email.toLowerCase()]);

    if (checkResult.rows.length > 0) {
      console.log('❌ Email já cadastrado');
      console.log('=================================\n');
      return res.status(409).json({ 
        message: 'Email já está em uso' 
      });
    }

    // Criptografar senha
    console.log('🔒 Criptografando senha...');
    const saltRounds = 12;
    const senhaHash = await bcrypt.hash(senha, saltRounds);

    // Inserir usuário no banco
    console.log('💾 Salvando usuário no banco...');
    const insertQuery = `
      INSERT INTO usuarios (nome, email, senha, tipo, ativo, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
      RETURNING id, nome, email, tipo, ativo, created_at
    `;
    
    const insertResult = await pool.query(insertQuery, [
      nome.trim(),
      email.toLowerCase(),
      senhaHash,
      tipo,
      true
    ]);

    const novoUsuario = insertResult.rows[0];

    console.log('✅ Usuário criado com sucesso!');
    console.log('🆔 ID:', novoUsuario.id);
    console.log('👤 Nome:', novoUsuario.nome);
    console.log('📧 Email:', novoUsuario.email);
    console.log('=================================\n');

    // Gerar token automaticamente
    const token = jwt.sign(
      { 
        id: novoUsuario.id, 
        tipo: novoUsuario.tipo,
        email: novoUsuario.email 
      },
      process.env.JWT_SECRET || 'super-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      token,
      usuario: novoUsuario
    });

  } catch (error) {
    console.error('\n❌ Erro no registro:', error);
    
    // Tratar erro de email duplicado
    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({ 
        message: 'Email já está em uso' 
      });
    }

    res.status(500).json({ 
      message: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// 👤 PERFIL DO USUÁRIO
// ============================================
router.get('/perfil', authMiddleware, async (req, res) => {
  try {
    console.log('\n👤 =================================');
    console.log('📋 BUSCANDO PERFIL DO USUÁRIO');
    console.log('=================================');
    console.log('🆔 User ID:', req.userId);

    const query = 'SELECT id, nome, email, tipo, ativo, created_at, updated_at FROM usuarios WHERE id = $1';
    const result = await pool.query(query, [req.userId]);

    if (result.rows.length === 0) {
      console.log('❌ Usuário não encontrado');
      console.log('=================================\n');
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const usuario = result.rows[0];
    console.log('✅ Perfil encontrado:', usuario.nome);
    console.log('=================================\n');

    res.json({ usuario });

  } catch (error) {
    console.error('\n❌ Erro ao buscar perfil:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ============================================
// 🧪 TESTE DE CONEXÃO
// ============================================
router.get('/test', async (req, res) => {
  console.log('\n🧪 =================================');
  console.log('⚡ TESTE DE ROTA AUTH');
  console.log('=================================');

  try {
    // Testar conexão com banco
    const result = await pool.query('SELECT NOW() as current_time, COUNT(*) as usuarios FROM usuarios');
    console.log('✅ Conexão com banco funcionando!');
    console.log('🕐 Hora do banco:', result.rows[0].current_time);
    console.log('👥 Total usuários:', result.rows[0].usuarios);
    
    res.json({ 
      message: 'Rota de autenticação funcionando!',
      timestamp: new Date().toISOString(),
      banco_conectado: true,
      usuarios_cadastrados: parseInt(result.rows[0].usuarios),
      rotas_disponiveis: [
        'POST /api/auth/login',
        'POST /api/auth/registrar',
        'GET /api/auth/perfil',
        'GET /api/auth/test'
      ]
    });
    
  } catch (error) {
    console.log('❌ Erro na conexão com banco:', error.message);
    res.status(500).json({ 
      message: 'Erro na conexão com banco',
      error: error.message 
    });
  }
  
  console.log('=================================\n');
});

module.exports = router;