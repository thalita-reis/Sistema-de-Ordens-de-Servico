// ============================================
// ARQUIVO CORRIGIDO: backend/src/config/database.js
// Substitua TODO o conteúdo atual por este código
// ============================================

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sistema_macedo_dev',
  password: process.env.DB_PASSWORD || 'Luk@30043015',
  port: process.env.DB_PORT || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Eventos de conexão
pool.on('connect', (client) => {
  console.log('🐘 PostgreSQL conectado com sucesso!');
  console.log(`📊 Banco: ${process.env.DB_NAME}`);
});

pool.on('error', (err, client) => {
  console.error('❌ Erro na conexão PostgreSQL:', err);
  // Removido process.exit(-1) para não matar o servidor
});

// Função para testar conexão
async function testarConexao() {
  try {
    const client = await pool.connect();
    console.log('✅ Teste de conexão PostgreSQL bem-sucedido!');
    console.log(`🏢 Conectado ao banco: ${process.env.DB_NAME}`);
    
    const resultado = await client.query('SELECT NOW(), current_database()');
    console.log('🕐 Hora do servidor:', resultado.rows[0].now);
    console.log('📋 Banco atual:', resultado.rows[0].current_database);
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Erro no teste de conexão:', error.message);
    
    // Mensagens de ajuda específicas
    if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('💡 SOLUÇÃO: Crie o banco "sistema_macedo_dev" no PostgreSQL');
    } else if (error.message.includes('authentication failed')) {
      console.log('💡 SOLUÇÃO: Verifique a senha no arquivo .env');
    } else if (error.message.includes('connection refused')) {
      console.log('💡 SOLUÇÃO: Verifique se o PostgreSQL está rodando');
    }
    
    return false;
  }
}

// Exporta pool e função de teste
module.exports = {
  pool,
  testarConexao
};