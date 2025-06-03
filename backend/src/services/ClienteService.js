const database = require('../config/database');

class ClienteService {
  // LISTAR TODOS OS CLIENTES
  async listarTodos() {
    try {
      const query = `
        SELECT 
          id,
          nome,
          cpf,
          email,
          telefone,
          celular,
          fax,
          rua,
          numero,
          cep,
          bairro,
          cidade,
          uf,
          complemento,
          pessoa_juridica,
          observacoes_gerais,
          ficha_inativa,
          ativo,
          data_inclusao,
          created_at,
          updated_at,
          CASE 
            WHEN rua IS NOT NULL THEN 
              CONCAT(rua, 
                     CASE WHEN numero IS NOT NULL THEN ', ' || numero ELSE '' END,
                     CASE WHEN bairro IS NOT NULL THEN ' - ' || bairro ELSE '' END,
                     CASE WHEN cidade IS NOT NULL THEN ', ' || cidade ELSE '' END,
                     CASE WHEN uf IS NOT NULL THEN '/' || uf ELSE '' END)
            ELSE 'Endereço não informado'
          END as endereco_completo
        FROM clientes 
        WHERE (ativo = true OR ativo IS NULL) AND (ficha_inativa = false OR ficha_inativa IS NULL)
        ORDER BY nome ASC
      `;
      
      const result = await database.query(query);
      return result.rows;
    } catch (error) {
      console.error('Erro ao listar clientes:', error);
      throw new Error('Erro ao carregar lista de clientes');
    }
  }

  // BUSCAR CLIENTE POR CPF (CHAVE ÚNICA)
  async buscarPorCpf(cpf) {
    try {
      // Limpar CPF (remover formatação)
      const cpfLimpo = cpf.replace(/[^\d]/g, '');
      
      const query = `
        SELECT * FROM clientes 
        WHERE cpf = $1 AND (ativo = true OR ativo IS NULL) AND (ficha_inativa = false OR ficha_inativa IS NULL)
      `;
      
      const result = await database.query(query, [cpfLimpo]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao buscar cliente por CPF:', error);
      throw new Error('Erro ao buscar cliente');
    }
  }

  // BUSCAR CLIENTE POR ID (COMPATIBILIDADE)
  async buscarPorId(id) {
    try {
      const query = `
        SELECT 
          *,
          CASE 
            WHEN rua IS NOT NULL THEN 
              CONCAT(rua, 
                     CASE WHEN numero IS NOT NULL THEN ', ' || numero ELSE '' END,
                     CASE WHEN bairro IS NOT NULL THEN ' - ' || bairro ELSE '' END,
                     CASE WHEN cidade IS NOT NULL THEN ', ' || cidade ELSE '' END,
                     CASE WHEN uf IS NOT NULL THEN '/' || uf ELSE '' END)
            ELSE 'Endereço não informado'
          END as endereco_completo
        FROM clientes 
        WHERE id = $1 AND (ativo = true OR ativo IS NULL) AND (ficha_inativa = false OR ficha_inativa IS NULL)
      `;
      
      const result = await database.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao buscar cliente por ID:', error);
      throw new Error('Erro ao buscar cliente');
    }
  }

  // BUSCAR OU CRIAR CLIENTE (FUNCIONALIDADE PRINCIPAL)
  async buscarOuCriar(dadosCliente) {
    try {
      const cpfLimpo = dadosCliente.cpf.replace(/[^\d]/g, '');
      
      // Primeiro, verificar se cliente já existe
      let cliente = await this.buscarPorCpf(cpfLimpo);
      
      if (cliente) {
        return {
          sucesso: true,
          cliente: cliente,
          jaCadastrado: true,
          mensagem: `Cliente já existe: ${cliente.nome}`
        };
      }
      
      // Se não existe, criar novo cliente
      const novoCliente = await this.criar({
        ...dadosCliente,
        cpf: cpfLimpo
      });
      
      return {
        sucesso: true,
        cliente: novoCliente,
        jaCadastrado: false,
        mensagem: 'Cliente cadastrado com sucesso'
      };
      
    } catch (error) {
      console.error('Erro em buscarOuCriar:', error);
      return {
        sucesso: false,
        erro: error.message,
        mensagem: 'Erro ao processar cliente'
      };
    }
  }

  // VERIFICAR SE CPF EXISTE (para API)
  async verificarCpfExiste(cpf) {
    try {
      const cliente = await this.buscarPorCpf(cpf);
      return {
        existe: !!cliente,
        cliente: cliente
      };
    } catch (error) {
      console.error('Erro ao verificar CPF:', error);
      throw new Error('Erro ao verificar CPF');
    }
  }

  // CRIAR NOVO CLIENTE
  async criar(dadosCliente) {
    try {
      const cpfLimpo = dadosCliente.cpf.replace(/[^\d]/g, '');
      
      // Verificar se CPF já existe
      const clienteExistente = await this.buscarPorCpf(cpfLimpo);
      if (clienteExistente) {
        throw new Error('Cliente com este CPF já existe');
      }
      
      const query = `
        INSERT INTO clientes (
          nome, cpf, data_inclusao, telefone, celular, fax,
          rua, numero, cep, bairro, cidade, uf, email,
          pessoa_juridica, observacoes_gerais, ficha_inativa,
          complemento, empresa_id, ativo, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING *
      `;
      
      const valores = [
        dadosCliente.nome,
        cpfLimpo,
        dadosCliente.data_inclusao || new Date(),
        dadosCliente.telefone || null,
        dadosCliente.celular || null,
        dadosCliente.fax || null,
        dadosCliente.rua || null,
        dadosCliente.numero || null,
        dadosCliente.cep || null,
        dadosCliente.bairro || null,
        dadosCliente.cidade || null,
        dadosCliente.uf || null,
        dadosCliente.email || null,
        dadosCliente.pessoa_juridica || false,
        dadosCliente.observacoes_gerais || null,
        false, // ficha_inativa
        dadosCliente.complemento || null,
        dadosCliente.empresa_id || 1, // Empresa padrão
        true // ativo
      ];
      
      const result = await database.query(query, valores);
      return result.rows[0];
      
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      throw new Error('Erro ao cadastrar cliente: ' + error.message);
    }
  }

  // ATUALIZAR CLIENTE
  async atualizar(id, dadosCliente) {
    try {
      const query = `
        UPDATE clientes SET
          nome = $2,
          cpf = $3,
          telefone = $4,
          celular = $5,
          fax = $6,
          rua = $7,
          numero = $8,
          cep = $9,
          bairro = $10,
          cidade = $11,
          uf = $12,
          email = $13,
          pessoa_juridica = $14,
          observacoes_gerais = $15,
          complemento = $16,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND (ativo = true OR ativo IS NULL)
        RETURNING *
      `;
      
      const valores = [
        id,
        dadosCliente.nome,
        dadosCliente.cpf ? dadosCliente.cpf.replace(/[^\d]/g, '') : null,
        dadosCliente.telefone,
        dadosCliente.celular,
        dadosCliente.fax,
        dadosCliente.rua,
        dadosCliente.numero,
        dadosCliente.cep,
        dadosCliente.bairro,
        dadosCliente.cidade,
        dadosCliente.uf,
        dadosCliente.email,
        dadosCliente.pessoa_juridica || false,
        dadosCliente.observacoes_gerais,
        dadosCliente.complemento
      ];
      
      const result = await database.query(query, valores);
      
      if (result.rows.length === 0) {
        throw new Error('Cliente não encontrado');
      }
      
      return result.rows[0];
      
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      throw new Error('Erro ao atualizar cliente: ' + error.message);
    }
  }

  // INATIVAR CLIENTE (em vez de deletar)
  async inativar(id) {
    try {
      const query = `
        UPDATE clientes SET
          ficha_inativa = true,
          ativo = false,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await database.query(query, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Cliente não encontrado');
      }
      
      return result.rows[0];
      
    } catch (error) {
      console.error('Erro ao inativar cliente:', error);
      throw new Error('Erro ao inativar cliente');
    }
  }

  // DELETAR CLIENTE
  async deletar(id) {
    try {
      const query = 'DELETE FROM clientes WHERE id = $1 RETURNING *';
      const result = await database.query(query, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Cliente não encontrado');
      }
      
      return result.rows[0];
      
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      throw new Error('Erro ao deletar cliente');
    }
  }

  // BUSCAR CLIENTES COM ORÇAMENTOS
  async buscarComOrcamentos(cpf) {
    try {
      const cpfLimpo = cpf.replace(/[^\d]/g, '');
      
      const query = `
        SELECT 
          c.*,
          COUNT(o.id) as total_orcamentos,
          COALESCE(SUM(o.valor_total), 0) as valor_total_orcamentos
        FROM clientes c
        LEFT JOIN orcamentos o ON (c.cpf = o.cliente_cpf OR c.id = o.cliente_id)
        WHERE c.cpf = $1 AND (c.ativo = true OR c.ativo IS NULL)
        GROUP BY c.id
      `;
      
      const result = await database.query(query, [cpfLimpo]);
      return result.rows[0] || null;
      
    } catch (error) {
      console.error('Erro ao buscar cliente com orçamentos:', error);
      throw new Error('Erro ao buscar histórico do cliente');
    }
  }

  // PESQUISAR CLIENTES
  async pesquisar(termo) {
    try {
      const query = `
        SELECT * FROM clientes 
        WHERE (ativo = true OR ativo IS NULL) AND (ficha_inativa = false OR ficha_inativa IS NULL) AND (
          nome ILIKE $1 OR 
          cpf LIKE $1 OR 
          email ILIKE $1 OR
          telefone LIKE $1 OR
          celular LIKE $1
        )
        ORDER BY nome ASC
        LIMIT 50
      `;
      
      const result = await database.query(query, [`%${termo}%`]);
      return result.rows;
      
    } catch (error) {
      console.error('Erro ao pesquisar clientes:', error);
      throw new Error('Erro na pesquisa de clientes');
    }
  }

  // FORMATAR CPF PARA EXIBIÇÃO
  formatarCpf(cpf) {
    if (!cpf) return '';
    const cpfLimpo = cpf.replace(/[^\d]/g, '');
    return cpfLimpo.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  // LIMPAR CPF
  limparCpf(cpf) {
    if (!cpf) return '';
    return cpf.replace(/[^\d]/g, '');
  }

  // VALIDAR CPF
  validarCpf(cpf) {
    const cpfLimpo = cpf.replace(/[^\d]/g, '');
    
    if (cpfLimpo.length !== 11) {
      return false;
    }
    
    // Validação básica (todos os dígitos iguais)
    if (/^(\d)\1+$/.test(cpfLimpo)) {
      return false;
    }
    
    return true;
  }
}

module.exports = new ClienteService();