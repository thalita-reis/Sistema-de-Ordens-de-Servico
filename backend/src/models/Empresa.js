const { Pool } = require('pg');

class Empresa {
  constructor() {
    // Configuração do PostgreSQL (ajuste conforme sua configuração)
    this.pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'sistema_os',
      password: process.env.DB_PASS || 'postgres',
      port: process.env.DB_PORT || 5432,
    });
  }

  // Buscar empresa por ID
  async buscarPorId(id) {
    try {
      const query = 'SELECT * FROM empresas WHERE id = $1';
      const result = await this.pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao buscar empresa por ID:', error);
      throw error;
    }
  }

  // Buscar empresa principal (primeira empresa)
  async buscarPrincipal() {
    try {
      const query = 'SELECT * FROM empresas ORDER BY id LIMIT 1';
      const result = await this.pool.query(query);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Erro ao buscar empresa principal:', error);
      throw error;
    }
  }

  // Listar todas as empresas
  async listarTodas() {
    try {
      const query = 'SELECT * FROM empresas ORDER BY nome';
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Erro ao listar empresas:', error);
      throw error;
    }
  }

  // Criar nova empresa
  async criar(dadosEmpresa) {
    try {
      const query = `
        INSERT INTO empresas (nome, cnpj, email, telefone, endereco, logo) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *
      `;
      
      const values = [
        dadosEmpresa.nome,
        dadosEmpresa.cnpj,
        dadosEmpresa.email || null,
        dadosEmpresa.telefone || null,
        dadosEmpresa.endereco || null,
        dadosEmpresa.logo || null
      ];
      
      const result = await this.pool.query(query, values);
      return { sucesso: true, empresa: result.rows[0] };
      
    } catch (error) {
      if (error.code === '23505' && error.constraint === 'empresas_cnpj_key') {
        return { sucesso: false, erro: 'CNPJ já cadastrado' };
      }
      console.error('Erro ao criar empresa:', error);
      throw error;
    }
  }

  // Atualizar empresa
  async atualizar(id, dadosEmpresa) {
    try {
      const query = `
        UPDATE empresas 
        SET nome = $1, email = $2, telefone = $3, endereco = $4, logo = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6 
        RETURNING *
      `;
      
      const values = [
        dadosEmpresa.nome,
        dadosEmpresa.email,
        dadosEmpresa.telefone,
        dadosEmpresa.endereco,
        dadosEmpresa.logo,
        id
      ];
      
      const result = await this.pool.query(query, values);
      
      if (result.rows.length === 0) {
        return { sucesso: false, erro: 'Empresa não encontrada' };
      }
      
      return { sucesso: true, empresa: result.rows[0] };
      
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      throw error;
    }
  }

  // Verificar se empresa existe por CNPJ
  async existePorCnpj(cnpj) {
    try {
      const query = 'SELECT id FROM empresas WHERE cnpj = $1';
      const result = await this.pool.query(query, [cnpj]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Erro ao verificar CNPJ:', error);
      throw error;
    }
  }

  // Obter estatísticas da empresa
  async obterEstatisticas(empresaId = 1) {
    try {
      const query = `
        SELECT 
          (SELECT COUNT(*) FROM usuarios WHERE empresa_id = $1) as total_usuarios,
          (SELECT COUNT(*) FROM clientes WHERE empresa_id = $1) as total_clientes,
          (SELECT COUNT(*) FROM orcamentos WHERE empresa_id = $1) as total_orcamentos,
          (SELECT COUNT(*) FROM ordem_servicos WHERE empresa_id = $1) as total_os,
          (SELECT SUM(valor_total) FROM orcamentos WHERE empresa_id = $1 AND status = 'aprovado') as faturamento_aprovado
      `;
      
      const result = await this.pool.query(query, [empresaId]);
      return result.rows[0];
      
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  // Fechar conexão
  async fecharConexao() {
    await this.pool.end();
  }
}

module.exports = Empresa;