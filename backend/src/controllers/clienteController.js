﻿const database = require('../config/database').pool;

class ClienteController {
  // GET /api/clientes - Listar todos os clientes (com suporte à paginação)
  async listarTodos(req, res) {
    try {
      const { page = 1, limit = 50, search = '' } = req.query;
      console.log('🔍 Listando clientes - Página:', page, 'Limite:', limit, 'Busca:', search);
      
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // Query compatível com SUA estrutura real
      let whereClause = `WHERE ativo = true`; // Filtrar apenas ativos
      let queryParams = [];
      let paramCount = 0;
      
      // Adicionar busca se fornecida
      if (search && search.trim() !== '') {
        paramCount++;
        whereClause += ` AND (
          LOWER(nome) LIKE LOWER($${paramCount}) OR 
          LOWER(email) LIKE LOWER($${paramCount}) OR 
          cpf LIKE $${paramCount}
        )`;
        queryParams.push(`%${search.trim()}%`);
      }
      
      // Query para contar total
      const countQuery = `
        SELECT COUNT(*) as total
        FROM clientes 
        ${whereClause}
      `;
      
      // Query para buscar dados - APENAS colunas que EXISTEM na sua tabela
      const dataQuery = `
        SELECT 
          id,
          nome,
          cpf,
          email,
          telefone,
          celular,
          rua,
          numero,
          complemento,
          bairro,
          cidade,
          uf,
          cep,
          pessoa_juridica,
          observacoes_gerais,
          ficha_inativa,
          ativo,
          data_inclusao,
          created_at,
          updated_at,
          empresa_id
        FROM clientes 
        ${whereClause}
        ORDER BY nome ASC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      
      queryParams.push(parseInt(limit), offset);
      
      // Executar queries
      const [countResult, dataResult] = await Promise.all([
        database.query(countQuery, search ? [queryParams[0]] : []),
        database.query(dataQuery, queryParams)
      ]);
      
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / parseInt(limit));
      
      console.log('✅ Clientes encontrados:', dataResult.rows.length, 'de', total, 'total');
      
      // Estrutura compatível com frontend
      const response = {
        data: dataResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          totalPages: totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        },
        success: true
      };
      
      res.json(response);
    } catch (error) {
      console.error('❌ Erro ao listar clientes:', error);
      res.status(500).json({ 
        erro: 'Erro ao carregar clientes',
        mensagem: error.message,
        success: false
      });
    }
  }

  // GET /api/clientes/:id - Buscar cliente por ID
  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      console.log('🔍 Buscando cliente ID:', id);
      
      const query = `
        SELECT 
          id,
          nome,
          cpf,
          email,
          telefone,
          celular,
          rua,
          numero,
          complemento,
          bairro,
          cidade,
          uf,
          cep,
          pessoa_juridica,
          observacoes_gerais,
          ficha_inativa,
          ativo,
          data_inclusao,
          created_at,
          updated_at,
          empresa_id
        FROM clientes 
        WHERE id = $1 AND ativo = true
      `;
      
      const result = await database.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ erro: 'Cliente não encontrado' });
      }
      
      console.log('✅ Cliente encontrado:', result.rows[0].nome);
      res.json(result.rows[0]);
    } catch (error) {
      console.error('❌ Erro ao buscar cliente:', error);
      res.status(500).json({ 
        erro: 'Erro ao buscar cliente',
        mensagem: error.message 
      });
    }
  }

  // GET /api/clientes/cpf/:cpf - Buscar cliente por CPF
  async buscarPorCpf(req, res) {
    try {
      const { cpf } = req.params;
      const cpfLimpo = cpf.replace(/[^\d]/g, '');
      console.log('🔍 Buscando cliente CPF:', cpfLimpo);
      
      const query = `
        SELECT * FROM clientes 
        WHERE cpf = $1 AND ativo = true
      `;
      
      const result = await database.query(query, [cpfLimpo]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ 
          erro: 'Cliente não encontrado',
          cpf: cpfLimpo
        });
      }
      
      console.log('✅ Cliente encontrado por CPF:', result.rows[0].nome);
      res.json(result.rows[0]);
    } catch (error) {
      console.error('❌ Erro ao buscar cliente por CPF:', error);
      res.status(500).json({ 
        erro: 'Erro ao buscar cliente por CPF',
        mensagem: error.message 
      });
    }
  }

  // GET /api/clientes/verificar-cpf/:cpf - Verificar se CPF existe
  async verificarCpfExiste(req, res) {
    try {
      const { cpf } = req.params;
      const cpfLimpo = cpf.replace(/[^\d]/g, '');
      console.log('🔍 Verificando CPF:', cpfLimpo);
      
      const query = `
        SELECT id, nome, cpf FROM clientes 
        WHERE cpf = $1 AND ativo = true
      `;
      
      const result = await database.query(query, [cpfLimpo]);
      
      const existe = result.rows.length > 0;
      
      console.log('✅ CPF', cpfLimpo, existe ? 'já existe' : 'disponível');
      
      res.json({
        existe: existe,
        cpf: cpfLimpo,
        cliente: existe ? result.rows[0] : null
      });
    } catch (error) {
      console.error('❌ Erro ao verificar CPF:', error);
      res.status(500).json({ 
        erro: 'Erro ao verificar CPF',
        mensagem: error.message 
      });
    }
  }

  // POST /api/clientes - Criar novo cliente
  async criar(req, res) {
    try {
      const dadosCliente = req.body;
      console.log('➕ Criando cliente:', dadosCliente.nome);
      
      // Validações básicas
      if (!dadosCliente.nome || dadosCliente.nome.trim() === '') {
        return res.status(400).json({ 
          erro: 'Nome é obrigatório',
          success: false
        });
      }
      
      const cpfLimpo = dadosCliente.cpf ? dadosCliente.cpf.replace(/[^\d]/g, '') : null;
      
      // Verificar se CPF já existe (apenas se CPF foi fornecido)
      if (cpfLimpo) {
        const cpfExistente = await database.query(
          'SELECT id FROM clientes WHERE cpf = $1',
          [cpfLimpo]
        );
        
        if (cpfExistente.rows.length > 0) {
          return res.status(400).json({
            erro: 'CPF já cadastrado',
            mensagem: `CPF ${dadosCliente.cpf} já está em uso`,
            success: false
          });
        }
      }
      
      // Criar cliente - APENAS com colunas que EXISTEM
      const query = `
        INSERT INTO clientes (
          nome, cpf, email, telefone, celular,
          rua, numero, complemento, bairro, cidade, uf, cep,
          pessoa_juridica, observacoes_gerais,
          data_inclusao, created_at, updated_at,
          empresa_id, ativo
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10, $11, $12,
          $13, $14,
          NOW(), NOW(), NOW(),
          $15, true
        ) RETURNING *
      `;
      
      const valores = [
        dadosCliente.nome.trim(),
        cpfLimpo,
        dadosCliente.email || null,
        dadosCliente.telefone || null,
        dadosCliente.celular || null,
        dadosCliente.rua || null,
        dadosCliente.numero || null,
        dadosCliente.complemento || null,
        dadosCliente.bairro || null,
        dadosCliente.cidade || null,
        dadosCliente.uf || null,
        dadosCliente.cep || null,
        dadosCliente.pessoa_juridica || false,
        dadosCliente.observacoes_gerais || null,
        dadosCliente.empresa_id || 1 // Empresa padrão
      ];
      
      const result = await database.query(query, valores);
      console.log('✅ Cliente criado com sucesso:', result.rows[0].nome);
      
      res.status(201).json({
        sucesso: true,
        success: true,
        cliente: result.rows[0],
        mensagem: 'Cliente cadastrado com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao criar cliente:', error);
      res.status(500).json({ 
        erro: 'Erro ao cadastrar cliente',
        mensagem: error.message,
        success: false
      });
    }
  }

  // PUT /api/clientes/:id - Atualizar cliente
  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const dadosCliente = req.body;
      console.log('🔄 Atualizando cliente ID:', id);
      
      const cpfLimpo = dadosCliente.cpf ? dadosCliente.cpf.replace(/[^\d]/g, '') : null;
      
      // Verificar se CPF já existe em outro cliente
      if (cpfLimpo) {
        const cpfExistente = await database.query(
          'SELECT id FROM clientes WHERE cpf = $1 AND id != $2',
          [cpfLimpo, id]
        );
        
        if (cpfExistente.rows.length > 0) {
          return res.status(400).json({
            erro: 'CPF já cadastrado em outro cliente',
            success: false
          });
        }
      }
      
      const query = `
        UPDATE clientes SET
          nome = $1,
          cpf = $2,
          email = $3,
          telefone = $4,
          celular = $5,
          rua = $6,
          numero = $7,
          complemento = $8,
          bairro = $9,
          cidade = $10,
          uf = $11,
          cep = $12,
          pessoa_juridica = $13,
          observacoes_gerais = $14,
          updated_at = NOW()
        WHERE id = $15 AND ativo = true
        RETURNING *
      `;
      
      const valores = [
        dadosCliente.nome,
        cpfLimpo,
        dadosCliente.email || null,
        dadosCliente.telefone || null,
        dadosCliente.celular || null,
        dadosCliente.rua || null,
        dadosCliente.numero || null,
        dadosCliente.complemento || null,
        dadosCliente.bairro || null,
        dadosCliente.cidade || null,
        dadosCliente.uf || null,
        dadosCliente.cep || null,
        dadosCliente.pessoa_juridica || false,
        dadosCliente.observacoes_gerais || null,
        id
      ];
      
      const result = await database.query(query, valores);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ 
          erro: 'Cliente não encontrado',
          success: false
        });
      }
      
      console.log('✅ Cliente atualizado:', result.rows[0].nome);
      res.json({
        sucesso: true,
        success: true,
        cliente: result.rows[0],
        mensagem: 'Cliente atualizado com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar cliente:', error);
      res.status(500).json({ 
        erro: 'Erro ao atualizar cliente',
        mensagem: error.message,
        success: false
      });
    }
  }

  // DELETE /api/clientes/:id - Inativar cliente (soft delete)
  async inativar(req, res) {
    try {
      const { id } = req.params;
      console.log('🗑️ Inativando cliente ID:', id);
      
      const query = `
        UPDATE clientes SET 
          ativo = false, 
          updated_at = NOW() 
        WHERE id = $1 
        RETURNING *
      `;
      
      const result = await database.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ 
          erro: 'Cliente não encontrado',
          success: false
        });
      }
      
      console.log('✅ Cliente inativado:', result.rows[0].nome);
      res.json({
        sucesso: true,
        success: true,
        mensagem: 'Cliente inativado com sucesso'
      });
    } catch (error) {
      console.error('❌ Erro ao inativar cliente:', error);
      res.status(500).json({ 
        erro: 'Erro ao inativar cliente',
        mensagem: error.message,
        success: false
      });
    }
  }

  // Alias para deletar
  async deletar(req, res) {
    return this.inativar(req, res);
  }

  // GET /api/clientes/pesquisar/:termo - Pesquisar clientes
  async pesquisar(req, res) {
    try {
      const { termo } = req.params;
      console.log('🔍 Pesquisando clientes por:', termo);
      
      const query = `
        SELECT * FROM clientes 
        WHERE ativo = true AND (
          LOWER(nome) LIKE LOWER($1) OR 
          LOWER(email) LIKE LOWER($1) OR 
          cpf LIKE $1
        )
        ORDER BY nome ASC
        LIMIT 20
      `;
      
      const result = await database.query(query, [`%${termo}%`]);
      
      console.log('✅ Encontrados', result.rows.length, 'clientes');
      res.json(result.rows);
    } catch (error) {
      console.error('❌ Erro ao pesquisar clientes:', error);
      res.status(500).json({ 
        erro: 'Erro ao pesquisar clientes',
        mensagem: error.message 
      });
    }
  }

  // POST /api/clientes/buscar-ou-criar - Buscar ou criar cliente (CPF único)
  async buscarOuCriar(req, res) {
    try {
      const { cpf, nome } = req.body;
      const cpfLimpo = cpf.replace(/[^\d]/g, '');
      
      console.log('🔍 Buscar ou criar cliente CPF:', cpfLimpo);
      
      // Primeiro, tentar buscar
      const clienteExistente = await database.query(
        'SELECT * FROM clientes WHERE cpf = $1 AND ativo = true',
        [cpfLimpo]
      );
      
      if (clienteExistente.rows.length > 0) {
        console.log('✅ Cliente encontrado:', clienteExistente.rows[0].nome);
        return res.json({
          cliente: clienteExistente.rows[0],
          novo: false,
          mensagem: 'Cliente já cadastrado'
        });
      }
      
      // Se não existe, criar novo
      const novoCliente = await database.query(`
        INSERT INTO clientes (cpf, nome, empresa_id, ativo, created_at, updated_at)
        VALUES ($1, $2, 1, true, NOW(), NOW())
        RETURNING *
      `, [cpfLimpo, nome]);
      
      console.log('✅ Novo cliente criado:', novoCliente.rows[0].nome);
      res.status(201).json({
        cliente: novoCliente.rows[0],
        novo: true,
        mensagem: 'Novo cliente criado'
      });
    } catch (error) {
      console.error('❌ Erro ao buscar ou criar cliente:', error);
      res.status(500).json({ 
        erro: 'Erro ao buscar ou criar cliente',
        mensagem: error.message 
      });
    }
  }

  // POST /api/clientes/validar-cpf - Validar CPF
  async validarCpf(req, res) {
    try {
      const { cpf } = req.body;
      const cpfLimpo = cpf.replace(/[^\d]/g, '');
      
      // Validação básica de CPF
      if (cpfLimpo.length !== 11) {
        return res.json({
          valido: false,
          erro: 'CPF deve ter 11 dígitos'
        });
      }
      
      // Verificar se todos os dígitos são iguais
      if (/^(\d)\1{10}$/.test(cpfLimpo)) {
        return res.json({
          valido: false,
          erro: 'CPF inválido'
        });
      }
      
      res.json({
        valido: true,
        cpf: cpfLimpo,
        formatado: cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      });
    } catch (error) {
      console.error('❌ Erro ao validar CPF:', error);
      res.status(500).json({
        erro: 'Erro ao validar CPF',
        mensagem: error.message
      });
    }
  }
}

module.exports = new ClienteController();