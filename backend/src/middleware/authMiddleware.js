const jwt = require('jsonwebtoken');
const { pool } = require('../config/database'); // Nossa conexão PostgreSQL
const authConfig = require('../config/auth');

const verificarToken = async (req, res, next) => {
  try {
    // Extrair token do header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    // Formato esperado: "Bearer token"
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Formato de token inválido' });
    }

    const token = parts[1];

    // Verificar e decodificar token
    const decoded = jwt.verify(token, authConfig.secret);
    
    // Buscar usuário no banco para verificar se ainda existe e está ativo
    const resultado = await pool.query(
      'SELECT id, nome, email, tipo, ativo FROM usuarios WHERE id = $1',
      [decoded.id]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    const usuario = resultado.rows[0];

    if (!usuario.ativo) {
      return res.status(401).json({ error: 'Usuário inativo' });
    }

    // Adicionar dados do usuário na requisição
    req.userId = usuario.id;
    req.user = usuario;

    next();

  } catch (error) {
    console.error('Erro na verificação do token:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }

    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Middleware para verificar se é admin
const verificarAdmin = (req, res, next) => {
  if (req.user && req.user.tipo === 'admin') {
    return next();
  }
  
  return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
};

// Middleware para verificar tipos específicos
const verificarTipo = (...tiposPermitidos) => {
  return (req, res, next) => {
    if (req.user && tiposPermitidos.includes(req.user.tipo)) {
      return next();
    }
    
    return res.status(403).json({ 
      error: `Acesso negado. Tipos permitidos: ${tiposPermitidos.join(', ')}` 
    });
  };
};

// Middleware opcional (não bloqueia se não tiver token)
const verificarTokenOpcional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      req.userId = null;
      req.user = null;
      return next();
    }

    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      req.userId = null;
      req.user = null;
      return next();
    }

    const token = parts[1];
    const decoded = jwt.verify(token, authConfig.secret);
    
    const resultado = await pool.query(
      'SELECT id, nome, email, tipo, ativo FROM usuarios WHERE id = $1',
      [decoded.id]
    );

    if (resultado.rows.length > 0 && resultado.rows[0].ativo) {
      req.userId = resultado.rows[0].id;
      req.user = resultado.rows[0];
    } else {
      req.userId = null;
      req.user = null;
    }

    next();

  } catch (error) {
    req.userId = null;
    req.user = null;
    next();
  }
};

module.exports = {
  verificarToken,
  verificarAdmin,
  verificarTipo,
  verificarTokenOpcional
};

// ============================================
// AUDITORIA OPCIONAL (se quiser manter logs)
// ============================================

const registrarAlteracao = async (tabela, registroId, acao, dados, usuarioId) => {
  try {
    await pool.query(`
      INSERT INTO historico_alteracoes (tabela, registro_id, acao, dados_anteriores, dados_novos, usuario_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [tabela, registroId, acao, JSON.stringify(dados), JSON.stringify(dados), usuarioId]);
    
  } catch (error) {
    console.error('Erro ao registrar alteração:', error);
    // Não quebra a aplicação se a auditoria falhar
  }
};
