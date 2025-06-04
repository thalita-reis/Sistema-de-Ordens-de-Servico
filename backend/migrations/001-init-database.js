// ============================================
// 🗄️ CONFIGURAÇÃO DO BANCO COM MIGRAÇÃO AUTOMÁTICA
// ============================================
const { Pool } = require('pg');

let pool = null;
let dbConfigured = false;

// ============================================
// 🚀 SISTEMA DE MIGRAÇÃO AUTOMÁTICA
// ============================================
const runMigrations = async (currentPool) => {
  if (process.env.NODE_ENV === 'production') {
    try {
      console.log('🔄 Executando migrações automáticas em produção...');
      const { createInitialTables } = require('./migrations/001-init-database');
      await createInitialTables(currentPool);
      console.log('✅ Migrações executadas com sucesso!');
      return true;
    } catch (error) {
      console.error('❌ Erro nas migrações automáticas:', error.message);
      return false;
    }
  }
  return true;
};

async function initDatabase() {
  try {
    const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    
    if (!databaseUrl) {
      console.log('⚠️ DATABASE_URL não encontrada - modo degradado');
      return false;
    }

    if (dbConfigured && pool) {
      return true;
    }
    
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: process.env.VERCEL ? 5 : 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: process.env.VERCEL ? 5000 : 10000,
    });

    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    dbConfigured = true;
    console.log('✅ PostgreSQL conectado!');
    
    // ✅ EXECUTAR MIGRAÇÕES AUTOMÁTICAS EM PRODUÇÃO
    const migrationSuccess = await runMigrations(pool);
    if (migrationSuccess) {
      console.log('✅ Sistema de banco inicializado completamente!');
    }
    
    return true;
    
  } catch (error) {
    console.log('⚠️ Falha na conexão PostgreSQL:', error.message);
    return false;
  }
}