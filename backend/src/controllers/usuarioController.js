const database = require('../config/database').pool;
const bcrypt = require('bcrypt');

class UsuarioController {
  // ============================================
  // 📋 LISTAR TODOS OS USUÁRIOS
  // ============================================
  async listarTodos(req, res) {
    try {
      console.log('🔍 Listando todos os usuários...');
      console.log('🌐 PostgreSQL conectado - Banco de dados:', database.options?.database || 'sistema_os');
      
      const query = `
        SELECT 
          id,
          nome,
          email,
          tipo,
          ativo,
          created_at,
          updated_at
        FROM usuarios 
        WHERE ativo IS NOT NULL
        ORDER BY created_at DESC
      `;
      
      const result = await database.query(query);
      
      console.log('✅ Usuários encontrados:', result.rows.length, 'usuários ativos');
      
      // Resposta compatível com frontend
      res.json({
        data: result.rows,
        total: result.rows.length,
        success: true
      });
      
    } catch (error) {
      console.error('❌ Erro ao listar usuários:', error);
      res.status(500).json({ 
        erro: 'Erro ao carregar usuários',
        mensagem: error.message,
        success: false
      });
    }
  }

  // ============================================
  // 👤 BUSCAR USUÁRIO POR ID
  // ============================================
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      console.log('🔍 Buscando usuário ID:', id);
      
      if (!id || isNaN(id)) {
        return res.status(400).json({ 
          erro: 'ID inválido',
          mensagem: 'ID deve ser um número válido'
        });
      }
      
      const query = `
        SELECT 
          id,
          nome,
          email,
          tipo,
          ativo,
          created_at,
          updated_at
        FROM usuarios 
        WHERE id = $1
      `;
      
      const result = await database.query(query, [id]);
      
      if (result.rows.length === 0) {
        console.log('⚠️ Usuário não encontrado para ID:', id);
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }
      
      console.log('✅ Usuário encontrado:', result.rows[0].nome);
      res.json({
        data: result.rows[0],
        success: true
      });
      
    } catch (error) {
      console.error('❌ Erro ao buscar usuário:', error);
      res.status(500).json({ 
        erro: 'Erro ao buscar usuário',
        mensagem: error.message,
        success: false
      });
    }
  }

  // ============================================
  // ➕ CRIAR NOVO USUÁRIO
  // ============================================
  async criar(req, res) {
    try {
      const { nome, email, senha, tipo = 'usuario', ativo = true } = req.body;
      console.log('➕ Criando usuário:', nome, 'Tipo:', tipo);
      
      // Validações aprimoradas
      if (!nome?.trim() || !email?.trim() || !senha?.trim()) {
        return res.status(400).json({ 
          erro: 'Dados obrigatórios faltando',
          mensagem: 'Nome, email e senha são obrigatórios e não podem estar vazios'
        });
      }
      
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          erro: 'Email inválido',
          mensagem: 'Formato de email inválido'
        });
      }
      
      // Validar senha
      if (senha.length < 6) {
        return res.status(400).json({
          erro: 'Senha muito curta',
          mensagem: 'Senha deve ter pelo menos 6 caracteres'
        });
      }
      
      // Normalizar tipos
      const tipoNormalizado = this.normalizarTipo(tipo);
      
      // Verificar se email já existe
      const emailExistente = await database.query(
        'SELECT id, nome FROM usuarios WHERE email = $1',
        [email.toLowerCase().trim()]
      );
      
      if (emailExistente.rows.length > 0) {
        console.log('⚠️ Tentativa de cadastro com email existente:', email);
        return res.status(400).json({
          erro: 'Email já cadastrado',
          mensagem: `Email ${email} já está sendo usado por: ${emailExistente.rows[0].nome}`
        });
      }
      
      // Criptografar senha
      console.log('🔒 Criptografando senha...');
      const senhaHash = await bcrypt.hash(senha, 12);
      
      // Criar usuário
      const query = `
        INSERT INTO usuarios (nome, email, senha, tipo, ativo, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, nome, email, tipo, ativo, created_at, updated_at
      `;
      
      const valores = [
        nome.trim(), 
        email.toLowerCase().trim(), 
        senhaHash, 
        tipoNormalizado, 
        ativo
      ];
      
      const result = await database.query(query, valores);
      
      console.log('✅ Usuário criado com sucesso:', result.rows[0].nome, 'ID:', result.rows[0].id);
      res.status(201).json({
        sucesso: true,
        data: result.rows[0],
        usuario: result.rows[0], // Compatibilidade
        mensagem: `Usuário ${result.rows[0].nome} criado com sucesso`
      });
      
    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      res.status(500).json({ 
        erro: 'Erro interno ao criar usuário',
        mensagem: error.message,
        success: false
      });
    }
  }

  // ============================================
  // 🔄 ATUALIZAR USUÁRIO
  // ============================================
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome, email, senha, tipo, ativo } = req.body;
      console.log('🔄 Atualizando usuário ID:', id, 'Dados:', { nome, email, tipo, ativo });
      
      if (!id || isNaN(id)) {
        return res.status(400).json({ erro: 'ID inválido' });
      }
      
      // Verificar se usuário existe
      const usuarioExistente = await database.query(
        'SELECT * FROM usuarios WHERE id = $1',
        [id]
      );
      
      if (usuarioExistente.rows.length === 0) {
        console.log('⚠️ Tentativa de atualizar usuário inexistente, ID:', id);
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }
      
      // Verificar se email já existe em outro usuário
      if (email && email.trim()) {
        const emailExistente = await database.query(
          'SELECT id, nome FROM usuarios WHERE email = $1 AND id != $2',
          [email.toLowerCase().trim(), id]
        );
        
        if (emailExistente.rows.length > 0) {
          return res.status(400).json({
            erro: 'Email já cadastrado',
            mensagem: `Email já está sendo usado por: ${emailExistente.rows[0].nome}`
          });
        }
      }
      
      // Preparar query de atualização dinâmica
      let query = `UPDATE usuarios SET updated_at = CURRENT_TIMESTAMP`;
      let valores = [];
      let paramCount = 0;
      
      if (nome && nome.trim()) {
        paramCount++;
        query += `, nome = $${paramCount}`;
        valores.push(nome.trim());
      }
      
      if (email && email.trim()) {
        paramCount++;
        query += `, email = $${paramCount}`;
        valores.push(email.toLowerCase().trim());
      }
      
      if (senha && senha.trim()) {
        paramCount++;
        console.log('🔒 Atualizando senha...');
        const senhaHash = await bcrypt.hash(senha, 12);
        query += `, senha = $${paramCount}`;
        valores.push(senhaHash);
      }
      
      if (tipo !== undefined) {
        paramCount++;
        const tipoNormalizado = this.normalizarTipo(tipo);
        query += `, tipo = $${paramCount}`;
        valores.push(tipoNormalizado);
      }
      
      if (ativo !== undefined) {
        paramCount++;
        query += `, ativo = $${paramCount}`;
        valores.push(ativo);
      }
      
      query += ` WHERE id = $${paramCount + 1} RETURNING id, nome, email, tipo, ativo, created_at, updated_at`;
      valores.push(id);
      
      const result = await database.query(query, valores);
      
      console.log('✅ Usuário atualizado:', result.rows[0].nome, 'Tipo:', result.rows[0].tipo);
      res.json({
        sucesso: true,
        data: result.rows[0],
        usuario: result.rows[0], // Compatibilidade
        mensagem: `Usuário ${result.rows[0].nome} atualizado com sucesso`
      });
      
    } catch (error) {
      console.error('❌ Erro ao atualizar usuário:', error);
      res.status(500).json({ 
        erro: 'Erro ao atualizar usuário',
        mensagem: error.message,
        success: false
      });
    }
  }

  // ============================================
  // 🗑️ DELETAR USUÁRIO
  // ============================================
  async deletar(req, res) {
    try {
      const { id } = req.params;
      console.log('🗑️ Deletando usuário ID:', id);
      
      if (!id || isNaN(id)) {
        return res.status(400).json({ erro: 'ID inválido' });
      }
      
      // Verificar se usuário existe antes de deletar
      const usuarioExistente = await database.query(
        'SELECT nome FROM usuarios WHERE id = $1',
        [id]
      );
      
      if (usuarioExistente.rows.length === 0) {
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }
      
      const nomeUsuario = usuarioExistente.rows[0].nome;
      
      // Deletar usuário
      await database.query('DELETE FROM usuarios WHERE id = $1', [id]);
      
      console.log('✅ Usuário deletado com sucesso:', nomeUsuario);
      res.json({
        sucesso: true,
        mensagem: `Usuário ${nomeUsuario} deletado com sucesso`
      });
      
    } catch (error) {
      console.error('❌ Erro ao deletar usuário:', error);
      res.status(500).json({ 
        erro: 'Erro ao deletar usuário',
        mensagem: error.message,
        success: false
      });
    }
  }

  // ============================================
  // ⚡ ALTERAR STATUS (ATIVO/INATIVO)
  // ============================================
  async alterarStatus(req, res) {
    try {
      const { id } = req.params;
      const { ativo } = req.body;
      console.log('⚡ Alterando status usuário ID:', id, 'Para:', ativo ? 'ATIVO' : 'INATIVO');
      
      if (!id || isNaN(id)) {
        return res.status(400).json({ erro: 'ID inválido' });
      }
      
      if (typeof ativo !== 'boolean') {
        return res.status(400).json({ 
          erro: 'Status inválido',
          mensagem: 'Status deve ser true ou false'
        });
      }
      
      const query = `
        UPDATE usuarios SET 
          ativo = $1, 
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2 
        RETURNING id, nome, email, tipo, ativo, created_at, updated_at
      `;
      
      const result = await database.query(query, [ativo, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }
      
      console.log('✅ Status alterado:', result.rows[0].nome, '→', ativo ? 'ATIVO' : 'INATIVO');
      res.json({
        sucesso: true,
        data: result.rows[0],
        usuario: result.rows[0], // Compatibilidade
        mensagem: `Usuário ${result.rows[0].nome} ${ativo ? 'ativado' : 'desativado'} com sucesso`
      });
      
    } catch (error) {
      console.error('❌ Erro ao alterar status:', error);
      res.status(500).json({ 
        erro: 'Erro ao alterar status',
        mensagem: error.message,
        success: false
      });
    }
  }

  // ============================================
  // 🔐 ALTERAR TIPO/PERMISSÃO
  // ============================================
  async alterarTipo(req, res) {
    try {
      const { id } = req.params;
      const { tipo } = req.body;
      console.log('🔐 Alterando tipo usuário ID:', id, 'Para:', tipo);
      
      if (!id || isNaN(id)) {
        return res.status(400).json({ erro: 'ID inválido' });
      }
      
      if (!tipo) {
        return res.status(400).json({ erro: 'Tipo é obrigatório' });
      }
      
      const tipoNormalizado = this.normalizarTipo(tipo);
      
      const query = `
        UPDATE usuarios SET 
          tipo = $1, 
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2 
        RETURNING id, nome, email, tipo, ativo, created_at, updated_at
      `;
      
      const result = await database.query(query, [tipoNormalizado, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }
      
      console.log('✅ Tipo alterado:', result.rows[0].nome, '→', tipoNormalizado.toUpperCase());
      res.json({
        sucesso: true,
        data: result.rows[0],
        usuario: result.rows[0], // Compatibilidade
        mensagem: `Permissão de ${result.rows[0].nome} alterada para ${tipoNormalizado}`
      });
      
    } catch (error) {
      console.error('❌ Erro ao alterar tipo:', error);
      res.status(500).json({ 
        erro: 'Erro ao alterar tipo',
        mensagem: error.message,
        success: false
      });
    }
  }

  // ============================================
  // 🔍 BUSCAR POR EMAIL
  // ============================================
  async buscarPorEmail(req, res) {
    try {
      const { email } = req.params;
      console.log('🔍 Buscando usuário por email:', email);
      
      if (!email) {
        return res.status(400).json({ erro: 'Email é obrigatório' });
      }
      
      const query = `
        SELECT 
          id,
          nome,
          email,
          tipo,
          ativo,
          created_at,
          updated_at
        FROM usuarios 
        WHERE email = $1
      `;
      
      const result = await database.query(query, [email.toLowerCase().trim()]);
      
      if (result.rows.length === 0) {
        console.log('⚠️ Usuário não encontrado para email:', email);
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }
      
      console.log('✅ Usuário encontrado por email:', result.rows[0].nome);
      res.json({
        data: result.rows[0],
        success: true
      });
      
    } catch (error) {
      console.error('❌ Erro ao buscar por email:', error);
      res.status(500).json({ 
        erro: 'Erro ao buscar por email',
        mensagem: error.message,
        success: false
      });
    }
  }

  // ============================================
  // ✅ VALIDAR EMAIL ÚNICO (NOVO)
  // ============================================
  async validarEmail(req, res) {
    try {
      const { email, excluir_id } = req.query;
      console.log('✅ Validando email único:', email, 'Excluir ID:', excluir_id);
      
      if (!email) {
        return res.status(400).json({ 
          erro: 'Email é obrigatório para validação' 
        });
      }
      
      let query = 'SELECT id, nome FROM usuarios WHERE email = $1';
      let params = [email.toLowerCase().trim()];
      
      if (excluir_id) {
        query += ' AND id != $2';
        params.push(excluir_id);
      }
      
      const result = await database.query(query, params);
      
      if (result.rows.length > 0) {
        console.log('⚠️ Email já existe:', email, 'Usado por:', result.rows[0].nome);
        return res.status(400).json({
          valido: false,
          erro: 'Email já cadastrado',
          mensagem: `Email já está sendo usado por: ${result.rows[0].nome}`
        });
      }
      
      console.log('✅ Email disponível:', email);
      res.json({
        valido: true,
        mensagem: 'Email disponível para uso'
      });
      
    } catch (error) {
      console.error('❌ Erro na validação de email:', error);
      res.status(500).json({ 
        erro: 'Erro na validação de email',
        mensagem: error.message,
        valido: false
      });
    }
  }

  // ============================================
  // 🔒 ALTERAR SENHA (NOVO)
  // ============================================
  async alterarSenha(req, res) {
    try {
      const { id } = req.params;
      const { novaSenha, senhaAtual } = req.body;
      console.log('🔒 Alterando senha do usuário ID:', id);
      
      if (!id || isNaN(id)) {
        return res.status(400).json({ erro: 'ID inválido' });
      }
      
      if (!novaSenha || novaSenha.length < 6) {
        return res.status(400).json({
          erro: 'Nova senha inválida',
          mensagem: 'Nova senha deve ter pelo menos 6 caracteres'
        });
      }
      
      // Buscar usuário atual
      const usuarioAtual = await database.query(
        'SELECT senha, nome FROM usuarios WHERE id = $1',
        [id]
      );
      
      if (usuarioAtual.rows.length === 0) {
        return res.status(404).json({ erro: 'Usuário não encontrado' });
      }
      
      // Se senha atual foi fornecida, validar
      if (senhaAtual) {
        const senhaValida = await bcrypt.compare(senhaAtual, usuarioAtual.rows[0].senha);
        if (!senhaValida) {
          return res.status(400).json({
            erro: 'Senha atual incorreta'
          });
        }
      }
      
      // Criptografar nova senha
      const novaSenhaHash = await bcrypt.hash(novaSenha, 12);
      
      // Atualizar senha
      await database.query(
        'UPDATE usuarios SET senha = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [novaSenhaHash, id]
      );
      
      console.log('✅ Senha alterada com sucesso para:', usuarioAtual.rows[0].nome);
      res.json({
        sucesso: true,
        mensagem: 'Senha alterada com sucesso'
      });
      
    } catch (error) {
      console.error('❌ Erro ao alterar senha:', error);
      res.status(500).json({ 
        erro: 'Erro ao alterar senha',
        mensagem: error.message,
        success: false
      });
    }
  }

  // ============================================
  // 📊 ESTATÍSTICAS APRIMORADAS
  // ============================================
  async obterEstatisticas(req, res) {
    try {
      console.log('📊 Obtendo estatísticas de usuários...');
      
      const estatisticas = await database.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE ativo = true) as ativos,
          COUNT(*) FILTER (WHERE ativo = false) as inativos,
          COUNT(*) FILTER (WHERE tipo IN ('admin', 'administrador')) as administradores,
          COUNT(*) FILTER (WHERE tipo = 'usuario') as usuarios,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as novos_ultimo_mes
        FROM usuarios
      `);
      
      const dados = {
        total: parseInt(estatisticas.rows[0].total) || 0,
        ativos: parseInt(estatisticas.rows[0].ativos) || 0,
        inativos: parseInt(estatisticas.rows[0].inativos) || 0,
        administradores: parseInt(estatisticas.rows[0].administradores) || 0,
        usuarios: parseInt(estatisticas.rows[0].usuarios) || 0,
        novos_ultimo_mes: parseInt(estatisticas.rows[0].novos_ultimo_mes) || 0
      };
      
      console.log('✅ Estatísticas obtidas:', dados);
      res.json(dados);
      
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      res.status(500).json({ 
        erro: 'Erro ao obter estatísticas',
        mensagem: error.message,
        success: false
      });
    }
  }

  // ============================================
  // 🧪 TESTE DE CONEXÃO
  // ============================================
  async teste(req, res) {
    try {
      console.log('🧪 Testando conexão usuários...');
      
      const result = await database.query('SELECT COUNT(*) as total FROM usuarios');
      const totalUsuarios = result.rows[0].total;
      
      console.log('✅ Teste de conexão bem-sucedido - Total usuários:', totalUsuarios);
      res.json({
        status: 'OK',
        message: 'Controlador de usuários funcionando perfeitamente',
        totalUsuarios: parseInt(totalUsuarios),
        database: database.options?.database || 'conectado',
        timestamp: new Date().toISOString(),
        version: '2.0'
      });
      
    } catch (error) {
      console.error('❌ Erro no teste de conexão:', error);
      res.status(500).json({ 
        status: 'ERROR',
        erro: 'Erro no teste de conexão',
        mensagem: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // ============================================
  // 🎯 BUSCAR COM FILTROS (NOVO)
  // ============================================
  async buscarComFiltros(req, res) {
    try {
      const { nome, email, tipo, ativo, limite = 50, pagina = 1 } = req.query;
      console.log('🎯 Buscando usuários com filtros:', { nome, email, tipo, ativo });
      
      let query = `
        SELECT 
          id,
          nome,
          email,
          tipo,
          ativo,
          created_at,
          updated_at
        FROM usuarios 
        WHERE 1=1
      `;
      let params = [];
      let paramCount = 0;
      
      if (nome) {
        paramCount++;
        query += ` AND nome ILIKE $${paramCount}`;
        params.push(`%${nome}%`);
      }
      
      if (email) {
        paramCount++;
        query += ` AND email ILIKE $${paramCount}`;
        params.push(`%${email}%`);
      }
      
      if (tipo) {
        paramCount++;
        query += ` AND tipo = $${paramCount}`;
        params.push(tipo);
      }
      
      if (ativo !== undefined) {
        paramCount++;
        query += ` AND ativo = $${paramCount}`;
        params.push(ativo === 'true');
      }
      
      query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(parseInt(limite));
      params.push((parseInt(pagina) - 1) * parseInt(limite));
      
      const result = await database.query(query, params);
      
      console.log('✅ Busca com filtros concluída:', result.rows.length, 'resultados');
      res.json({
        data: result.rows,
        total: result.rows.length,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        success: true
      });
      
    } catch (error) {
      console.error('❌ Erro na busca com filtros:', error);
      res.status(500).json({ 
        erro: 'Erro na busca com filtros',
        mensagem: error.message,
        success: false
      });
    }
  }

  // ============================================
  // 🔧 MÉTODO AUXILIAR - NORMALIZAR TIPO
  // ============================================
  normalizarTipo(tipo) {
    const tiposValidos = {
      'admin': 'administrador',
      'administrador': 'administrador',
      'usuario': 'usuario',
      'user': 'usuario',
      'operador': 'usuario'
    };
    
    return tiposValidos[tipo?.toLowerCase()] || 'usuario';
  }
}

module.exports = new UsuarioController();