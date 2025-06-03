// ============================================
// CONFIGURAÇÃO POSTGRESQL - SISTEMA OS
// ============================================
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost', 
  database: 'sistema_os',  // FORÇAR BANCO CORRETO
  password: process.env.DB_PASSWORD || 'Luk@30043015',
  port: process.env.DB_PORT || 5432,
  // CONFIGURAÇÕES CRÍTICAS PARA RESOLVER O PROBLEMA
  schema: 'public',  // Forçar schema public
  searchPath: ['public'],  // Search path explícito
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,  // Aumentado para debug
});

// Log de conexão detalhado
pool.on('connect', (client) => {
  console.log('✅ PostgreSQL conectado!');
  console.log('📊 Database: sistema_os');
  console.log('📋 Schema: public');
  console.log('👤 User: postgres');
  
  // Definir search_path na conexão
  client.query('SET search_path TO public', (err) => {
    if (err) {
      console.error('❌ Erro ao definir search_path:', err.message);
    } else {
      console.log('✅ Search path definido: public');
    }
  });
});

pool.on('error', (err, client) => {
  console.error('❌ Erro PostgreSQL:', err.message);
  console.error('🔍 Code:', err.code);
  console.error('🔍 Detail:', err.detail);
});

// FUNÇÃO TESTAR CONEXÃO ROBUSTA
async function testarConexao() {
  try {
    console.log('\n🔄 ===== TESTANDO CONEXÃO POSTGRESQL =====');
    
    const client = await pool.connect();
    
    // Verificar conexão básica
    const basicTest = await client.query(`
      SELECT 
        current_database() as database,
        current_schema() as schema,
        current_user as user
    `);
    
    console.log('✅ Conectado em:', basicTest.rows[0]);
    
    // Definir search_path explicitamente
    await client.query('SET search_path TO public');
    console.log('✅ Search path definido: public');
    
    // Verificar se dados_empresas existe
    const tableCheck = await client.query(`
      SELECT COUNT(*) as total 
      FROM information_schema.tables 
      WHERE table_name = 'dados_empresas' 
      AND table_schema = 'public'
    `);
    
    if (tableCheck.rows[0].total > 0) {
      console.log('✅ Tabela dados_empresas encontrada!');
      
      // Testar query simples
      const dataTest = await client.query('SELECT COUNT(*) as registros FROM dados_empresas');
      console.log('✅ Total de registros:', dataTest.rows[0].registros);
      
      // Verificar ID 3
      const id3Test = await client.query('SELECT id, razao_social FROM dados_empresas WHERE id = 3');
      if (id3Test.rows.length > 0) {
        console.log('✅ ID 3 encontrado:', id3Test.rows[0].razao_social);
      }
    } else {
      console.log('❌ Tabela dados_empresas NÃO encontrada');
    }
    
    console.log('✅ PostgreSQL configurado e funcionando!');
    console.log('==========================================\n');
    
    client.release();
    return true;
    
  } catch (error) {
    console.error('\n❌ ===== ERRO DE CONEXÃO =====');
    console.error('💥 Erro:', error.message);
    console.error('🔢 Code:', error.code);
    console.error('🔍 Detail:', error.detail);
    console.error('================================\n');
    return false;
  }
}

// Função para query com log detalhado
async function queryWithLog(text, params = []) {
  const start = Date.now();
  try {
    console.log('🔍 Executando query:', text.substring(0, 100) + '...');
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('✅ Query executada em', duration, 'ms');
    console.log('📊 Linhas retornadas:', res.rows.length);
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('❌ Query falhou em', duration, 'ms');
    console.error('💥 Erro:', error.message);
    console.error('🔢 Code:', error.code);
    console.error('📝 Query:', text);
    throw error;
  }
}

// Exportar pool, função de teste e função de query com log
module.exports = { 
  pool, 
  testarConexao,
  query: queryWithLog
};