const { pool } = require('../config/database'); // Importa a conexão PostgreSQL

class ClienteService {
  
  async buscarOuCriar(dadosCliente) {
    try {
      const { cpf, nome, email, telefone, endereco, empresa_id } = dadosCliente;
      
      // Primeiro, busca se já existe
      let resultado = await pool.query(
        'SELECT * FROM clientes WHERE cpf = $1',
        [cpf]
      );
      
      if (resultado.rows.length > 0) {
        const cliente = resultado.rows[0];
        
        // Se estava inativo, reativa
        if (!cliente.ativo) {
          await pool.query(
            'UPDATE clientes SET ativo = true, updated_at = NOW() WHERE cpf = $1',
            [cpf]
          );
          cliente.ativo = true;
        }
        
        return {
          sucesso: true,
          cliente,
          jaCadastrado: true,
          mensagem: 'Cliente já cadastrado no sistema'
        };
      }
      
      // Cliente não existe, cria novo
      resultado = await pool.query(`
        INSERT INTO clientes (cpf, nome, email, telefone, endereco, empresa_id) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *
      `, [cpf, nome, email, telefone, endereco, empresa_id]);
      
      return {
        sucesso: true,
        cliente: resultado.rows[0],
        jaCadastrado: false,
        mensagem: 'Cliente criado com sucesso'
      };
      
    } catch (error) {
      console.error('Erro no ClienteService.buscarOuCriar:', error);
      
      if (error.code === '23505') {
        return {
          sucesso: false,
          erro: 'CPF já cadastrado no sistema'
        };
      }
      
      return {
        sucesso: false,
        erro: 'Erro interno do serviço'
      };
    }
  }
  
  async buscarPorCpf(cpf) {
    try {
      const resultado = await pool.query(
        'SELECT * FROM clientes WHERE cpf = $1 AND ativo = true',
        [cpf]
      );
      
      return resultado.rows[0] || null;
      
    } catch (error) {
      console.error('Erro ao buscar cliente por CPF:', error);
      throw error;
    }
  }
  
  async buscarPorId(id) {
    try {
      const resultado = await pool.query(
        'SELECT * FROM clientes WHERE id = $1 AND ativo = true',
        [id]
      );
      
      return resultado.rows[0] || null;
      
    } catch (error) {
      console.error('Erro ao buscar cliente por ID:', error);
      throw error;
    }
  }
  
  async listarPorEmpresa(empresaId, opcoes = {}) {
    try {
      const { 
        limite = 50, 
        offset = 0, 
        busca = '', 
        apenasAtivos = true 
      } = opcoes;
      
      let query = 'SELECT * FROM clientes WHERE empresa_id = $1';
      let params = [empresaId];
      
      if (apenasAtivos) {
        query += ' AND ativo = true';
      }
      
      if (busca) {
        query += ` AND (nome ILIKE $${params.length + 1} OR cpf ILIKE $${params.length + 1})`;
        params.push(`%${busca}%`);
      }
      
      query += ` ORDER BY nome LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limite, offset);
      
      const resultado = await pool.query(query, params);
      return resultado.rows;
      
    } catch (error) {
      console.error('Erro ao listar clientes:', error);
      throw error;
    }
  }
  
  async criar(dadosCliente) {
    try {
      const { cpf, nome, email, telefone, endereco, empresa_id = 1 } = dadosCliente;
      
      const resultado = await pool.query(`
        INSERT INTO clientes (cpf, nome, email, telefone, endereco, empresa_id) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *
      `, [cpf, nome, email, telefone, endereco, empresa_id]);
      
      return resultado.rows[0];
      
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw error;
    }
  }
  
  async atualizar(cpf, dadosAtualizacao) {
    try {
      const { nome, email, telefone, endereco } = dadosAtualizacao;
      
      const resultado = await pool.query(`
        UPDATE clientes 
        SET nome = $1, email = $2, telefone = $3, endereco = $4, updated_at = NOW()
        WHERE cpf = $5 AND ativo = true
        RETURNING *
      `, [nome, email, telefone, endereco, cpf]);
      
      if (resultado.rows.length === 0) {
        return {
          sucesso: false,
          erro: 'Cliente não encontrado'
        };
      }
      
      return {
        sucesso: true,
        cliente: resultado.rows[0],
        mensagem: 'Cliente atualizado com sucesso'
      };
      
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      throw error;
    }
  }
  
  async desativar(cpf) {
    try {
      const resultado = await pool.query(
        'UPDATE clientes SET ativo = false, updated_at = NOW() WHERE cpf = $1 RETURNING id',
        [cpf]
      );
      
      return resultado.rows.length > 0;
      
    } catch (error) {
      console.error('Erro ao desativar cliente:', error);
      throw error;
    }
  }
  
  async buscarHistoricoCompleto(cpf) {
    try {
      const query = `
        SELECT 
          c.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', os.id,
                'numero', os.numero,
                'descricao', os.descricao,
                'status', os.status,
                'valor_total', os.valor_total,
                'data_criacao', os.created_at
              ) ORDER BY os.created_at DESC
            ) FILTER (WHERE os.id IS NOT NULL), 
            '[]'
          ) as ordens_servico
        FROM clientes c
        LEFT JOIN ordens_servico os ON c.id = os.cliente_id
        WHERE c.cpf = $1
        GROUP BY c.id
      `;
      
      const resultado = await pool.query(query, [cpf]);
      return resultado.rows[0] || null;
      
    } catch (error) {
      console.error('Erro ao buscar histórico completo:', error);
      throw error;
    }
  }
  
  async obterEstatisticas(empresaId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_clientes,
          COUNT(*) FILTER (WHERE ativo = true) as clientes_ativos,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as novos_mes,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as novos_semana
        FROM clientes 
        WHERE empresa_id = $1
      `;
      
      const resultado = await pool.query(query, [empresaId]);
      return resultado.rows[0];
      
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }
}

module.exports = ClienteService;