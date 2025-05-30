require('dotenv').config();

// Testa importar seu database.js
console.log('🔍 Testando importação do database.js...');

try {
  const database = require('./src/config/database');
  console.log('✅ Database.js importado com sucesso!');
  
  // Verifica o que foi exportado
  console.log('📦 Tipo do export:', typeof database);
  
  if (typeof database === 'object' && database.query) {
    // É um pool diretamente
    console.log('📊 Detectado: Pool do PostgreSQL exportado diretamente');
    testarPool(database);
  } else if (typeof database === 'object' && database.pool) {
    // É um objeto com pool
    console.log('📊 Detectado: Objeto com propriedade pool');
    testarPool(database.pool);
  } else {
    console.log('⚠️  Formato não reconhecido. Conteúdo:', database);
  }
  
} catch (error) {
  console.error('❌ Erro ao importar database.js:', error.message);
  console.log('');
  console.log('🔧 Possíveis causas:');
  console.log('- Arquivo database.js tem erro de sintaxe');
  console.log('- Falta alguma dependência (pg, dotenv)');
  console.log('- Caminho incorreto');
}

async function testarPool(pool) {
  console.log('');
  console.log('🧪 Iniciando teste de conexão...');
  console.log('=====================================');
  
  // Mostrar configurações do .env
  console.log('📋 Configurações detectadas:');
  console.log(`   DB_HOST: ${process.env.DB_HOST || 'não definido'}`);
  console.log(`   DB_PORT: ${process.env.DB_PORT || 'não definido'}`);
  console.log(`   DB_NAME: ${process.env.DB_NAME || 'não definido'}`);
  console.log(`   DB_USER: ${process.env.DB_USER || 'não definido'}`);
  console.log(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? '✅ definida' : '❌ não definida'}`);
  console.log('');

  try {
    // Teste de conexão
    console.log('🔌 Conectando ao PostgreSQL...');
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida!');
    
    // Teste básico
    const resultado = await client.query('SELECT NOW(), current_database()');
    console.log(`🕐 Servidor: ${resultado.rows[0].now}`);
    console.log(`🗄️  Banco: ${resultado.rows[0].current_database}`);
    
    // Testar tabela clientes (que você criou)
    console.log('');
    console.log('👥 Testando tabela clientes...');
    
    const clientes = await client.query(`
      SELECT COUNT(*) as total,
             COUNT(*) FILTER (WHERE ativo = true) as ativos
      FROM clientes
    `);
    
    console.log(`   📊 Total: ${clientes.rows[0].total} clientes`);
    console.log(`   ✅ Ativos: ${clientes.rows[0].ativos} clientes`);
    
    // Mostrar alguns clientes
    const lista = await client.query('SELECT nome, cpf FROM clientes LIMIT 3');
    if (lista.rows.length > 0) {
      console.log('   👤 Clientes encontrados:');
      lista.rows.forEach((cliente, i) => {
        console.log(`      ${i + 1}. ${cliente.nome} (${cliente.cpf})`);
      });
    }
    
    client.release();
    
    console.log('');
    console.log('🎉 TESTE COMPLETO COM SUCESSO!');
    console.log('✅ Seu database.js está funcionando perfeitamente!');
    console.log('✅ Conexão com PostgreSQL OK!');
    console.log('✅ Tabela clientes acessível!');
    console.log('');
    console.log('🚀 Próximo passo: Atualizar ClienteService.js');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.log('');
    
    if (error.message.includes('relation "clientes" does not exist')) {
      console.log('💡 A tabela clientes não foi encontrada no banco conectado');
      console.log('   Verifique se está conectando ao banco correto (sistema_macedo_dev)');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('💡 Banco não existe. Seu .env aponta para o banco correto?');
    } else if (error.message.includes('authentication failed')) {
      console.log('💡 Erro de autenticação. Verifique senha no .env');
    }
  } finally {
    // Encerrar pool se possível
    if (pool.end) {
      await pool.end();
    }
  }
}
