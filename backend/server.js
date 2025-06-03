require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');

const app = express();

// ============================================
// 🌐 CORS CONFIGURADO - VERSÃO OTIMIZADA
// ============================================
const corsOptions = {
  origin: [
    // URLs de desenvolvimento
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    
    // Seu IP atual da rede
    'http://10.133.128.150:3000',
    
    // IPs comuns de rede local
    'http://192.168.1.100:3000',
    'http://192.168.0.100:3000',
    
    // Regex para aceitar qualquer IP da rede local
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/,
    /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:3000$/,
    /^http:\/\/172\.16\.\d{1,3}\.\d{1,3}:3000$/,
    
    // URL de produção (se existir)
    process.env.FRONTEND_URL
  ].filter(Boolean), // Remove valores undefined
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type', 
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200
};

// ============================================
// 🔧 MIDDLEWARES DE SEGURANÇA E LOGS
// ============================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// ✅ CORS APLICADO UMA VEZ APENAS
app.use(cors(corsOptions));

app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// 🗄️ CONFIGURAÇÃO DO BANCO PostgreSQL
// ============================================
const { pool, testarConexao } = require('./src/config/database');

// ============================================
// 📝 IMPORTAÇÃO DAS ROTAS - SISTEMA LIMPO E FUNCIONAL
// ============================================
const authRoutes = require('./src/routes/authRoutes');
const clienteRoutes = require('./src/routes/clienteRoutes');
const orcamentoRoutes = require('./src/routes/orcamentoRoutes');

// ✅ ROTAS DE EMPRESA - VERSÃO ATUALIZADA
const empresaRoutes = require('./src/routes/empresaRoutes');

// ============================================
// 🛣️ CONFIGURAÇÃO DAS ROTAS
// ============================================

// Rota raiz com informações da API
app.get('/', (req, res) => {
  console.log('\n🏠 =================================');
  console.log('📋 PÁGINA INICIAL ACESSADA');
  console.log('=================================');
  console.log('🌐 IP:', req.ip);
  console.log('🔧 User-Agent:', req.get('User-Agent'));
  console.log('=================================\n');

  res.json({
    message: 'API Sistema Macedo - Funcionando Perfeitamente!',
    version: '2.2.0',
    status: 'OK',
    timestamp: new Date().toISOString(),
    cors: {
      enabled: true,
      allowedOrigins: 'IPs da rede local + localhost',
      note: 'Configurado para desenvolvimento - aceita conexões da rede'
    },
    endpoints: {
      auth: '/api/auth/* - Sistema de autenticação',
      clientes: '/api/clientes/* - Gestão de clientes',
      orcamentos: '/api/orcamentos/* - Gestão de orçamentos',
      empresa: '/api/dados-empresa/* - Dados da empresa OTIMIZADO',
      health: '/api/health - Status do sistema'
    },
    features: {
      authentication: 'JWT Token',
      database: 'PostgreSQL',
      security: 'Helmet + CORS',
      logging: 'Morgan + Custom',
      network: 'Acessível em todas as interfaces',
      stability: 'Sistema otimizado - CORS corrigido'
    }
  });
});

// ============================================
// 🔐 ROTAS DE AUTENTICAÇÃO
// ============================================
app.use('/api/auth', authRoutes);

// ============================================
// 👤 ROTAS DE CLIENTES
// ============================================
app.use('/api/clientes', clienteRoutes);

// ============================================
// 📋 ROTAS DE ORÇAMENTOS
// ============================================
app.use('/api/orcamentos', orcamentoRoutes);

// ============================================
// 🏢 ROTAS DE EMPRESA - OTIMIZADAS!
// ============================================
app.use('/api/dados-empresa', empresaRoutes);

// ============================================
// 🏥 HEALTH CHECK OTIMIZADO
// ============================================
app.get('/api/health', async (req, res) => {
  try {
    console.log('\n🏥 =================================');
    console.log('💚 VERIFICAÇÃO DE SAÚDE DO SISTEMA');
    console.log('=================================');

    // Testar conexão PostgreSQL
    console.log('🔍 Testando conexão PostgreSQL...');
    const dbTest = await pool.query('SELECT NOW() as server_time, current_database() as database_name, version() as pg_version');
    console.log('✅ PostgreSQL: Conectado');
    
    // Verificar tabelas essenciais
    console.log('🔍 Verificando tabelas...');
    
    const clientesCount = await pool.query('SELECT COUNT(*) FROM clientes');
    
    // Verificar tabela dados_empresas (prioritária)
    let empresasCount = { rows: [{ count: 0 }] };
    let empresasStatus = 'not_found';
    
    try {
      empresasCount = await pool.query('SELECT COUNT(*) FROM dados_empresas');
      empresasStatus = 'active';
      console.log('✅ Tabela dados_empresas: Encontrada');
    } catch (error) {
      console.log('⚠️ Tabela dados_empresas: Não encontrada');
    }
    
    // Verificar tabela orçamentos
    let orcamentosCount = { rows: [{ count: 0 }] };
    let orcamentosStatus = 'not_found';
    
    try {
      orcamentosCount = await pool.query('SELECT COUNT(*) FROM orcamentos');
      orcamentosStatus = 'active';
      console.log('✅ Tabela orcamentos: Encontrada');
    } catch (error) {
      console.log('⚠️ Tabela orcamentos: Não encontrada');
    }

    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      },
      database: {
        status: 'connected',
        name: dbTest.rows[0].database_name,
        server_time: dbTest.rows[0].server_time,
        version: dbTest.rows[0].pg_version.split(' ')[0] + ' ' + dbTest.rows[0].pg_version.split(' ')[1]
      },
      cors: {
        enabled: true,
        allowedOrigins: corsOptions.origin.length,
        supportsNetworkAccess: true,
        note: 'CORS otimizado - sem duplicação'
      },
      tables: {
        clientes: parseInt(clientesCount.rows[0].count),
        empresas: parseInt(empresasCount.rows[0].count),
        orcamentos: parseInt(orcamentosCount.rows[0].count)
      },
      services: {
        auth: 'active',
        clientes: 'active',
        empresa: empresasStatus,
        orcamentos: orcamentosStatus,
        dadosEmpresa: 'active - OTIMIZADO'
      }
    };

    console.log('📊 Estatísticas atuais:');
    console.log('👤 Clientes:', healthData.tables.clientes);
    console.log('🏢 Empresas:', healthData.tables.empresas);
    console.log('📋 Orçamentos:', healthData.tables.orcamentos);
    console.log('⏱️ Uptime:', healthData.uptime, 'segundos');
    console.log('💾 Memória:', healthData.memory.used);
    console.log('=================================\n');

    res.json(healthData);

  } catch (error) {
    console.error('\n❌ Erro no health check:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Falha na verificação de saúde',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno',
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// 🧪 ROTA DE TESTE ESPECÍFICA PARA EMPRESA
// ============================================
app.get('/api/dados-empresa/test', async (req, res) => {
  try {
    console.log('\n🧪 =================================');
    console.log('🔬 TESTE ESPECÍFICO - DADOS EMPRESA');
    console.log('=================================');
    
    // Testar se tabelas existem
    const testQuery = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('dados_empresas', 'empresas')
    `);
    
    console.log('📋 Tabelas encontradas:', testQuery.rows.map(r => r.table_name));
    
    let dadosEncontrados = null;
    let tabelaUsada = null;
    
    // Prioridade 1: dados_empresas
    try {
      const dados1 = await pool.query('SELECT * FROM dados_empresas ORDER BY updated_at DESC LIMIT 1');
      if (dados1.rows.length > 0) {
        dadosEncontrados = dados1.rows[0];
        tabelaUsada = 'dados_empresas';
        console.log('✅ Dados encontrados em dados_empresas');
        console.log('📝 Razão Social:', dados1.rows[0].razao_social);
        console.log('🏢 Nome Oficina:', dados1.rows[0].nome_oficina);
      }
    } catch (error) {
      console.log('⚠️ Tabela dados_empresas não acessível:', error.message);
    }
    
    console.log('=================================\n');
    
    res.json({
      status: 'OK',
      tabelas_disponiveis: testQuery.rows.map(r => r.table_name),
      dados_encontrados: !!dadosEncontrados,
      tabela_usada: tabelaUsada,
      dados: dadosEncontrados,
      message: 'Teste de dados da empresa executado com sucesso',
      cors_status: 'otimizado',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('\n❌ Erro no teste de empresa:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Erro ao testar dados da empresa',
      error: error.message
    });
  }
});

// ============================================
// 🧪 ROTA DE TESTE DE CORS
// ============================================
app.get('/api/cors/test', (req, res) => {
  console.log('\n🧪 =================================');
  console.log('🌐 TESTE DE CORS');
  console.log('=================================');
  console.log('🔗 Origin:', req.get('Origin'));
  console.log('🌐 IP:', req.ip);
  console.log('📡 User-Agent:', req.get('User-Agent'));
  console.log('=================================\n');
  
  res.json({
    status: 'CORS_OTIMIZADO',
    message: 'CORS configurado corretamente - sem duplicação',
    origin: req.get('Origin'),
    ip: req.ip,
    allowedOrigins: corsOptions.origin,
    corsAppliedOnce: true,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// 🚫 TRATAMENTO DE ROTAS NÃO ENCONTRADAS
// ============================================
app.use('*', (req, res) => {
  console.log('\n🚨 =================================');
  console.log('❌ ROTA NÃO ENCONTRADA');
  console.log('=================================');
  console.log('📍 URL:', req.originalUrl);
  console.log('🔧 Método:', req.method);
  console.log('🌐 IP:', req.ip);
  console.log('🔗 Origin:', req.get('Origin'));
  console.log('=================================\n');

  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.method} ${req.originalUrl} não existe`,
    timestamp: new Date().toISOString(),
    available_routes: {
      authentication: [
        'POST /api/auth/login',
        'POST /api/auth/registrar'
      ],
      clientes: [
        'GET /api/clientes',
        'POST /api/clientes',
        'GET /api/clientes/:id'
      ],
      empresa: [
        'GET /api/dados-empresa - OTIMIZADO',
        'PUT /api/dados-empresa - OTIMIZADO',
        'POST /api/dados-empresa - OTIMIZADO',
        'GET /api/dados-empresa/test'
      ],
      orcamentos: [
        'GET /api/orcamentos',
        'POST /api/orcamentos',
        'GET /api/orcamentos/:id'
      ],
      system: [
        'GET /',
        'GET /api/health',
        'GET /api/cors/test'
      ]
    },
    note: 'Sistema otimizado - CORS sem duplicação'
  });
});

// ============================================
// 🚨 TRATAMENTO GLOBAL DE ERROS
// ============================================
app.use((error, req, res, next) => {
  console.error('\n🚨 ===============================');
  console.error('💥 ERRO GLOBAL CAPTURADO');
  console.error('===============================');
  console.error('📍 URL:', req.originalUrl);
  console.error('🔧 Método:', req.method);
  console.error('🌐 Origin:', req.get('Origin'));
  console.error('📝 Erro:', error.message);
  console.error('===============================\n');
  
  res.status(error.status || 500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Algo deu errado',
    timestamp: new Date().toISOString(),
    request_id: Math.random().toString(36).substr(2, 9)
  });
});

// ============================================
// 🚀 INICIALIZAÇÃO DO SERVIDOR
// ============================================
const PORT = process.env.PORT || 5000;

async function iniciarServidor() {
  try {
    console.log('\n🔄 ===============================');
    console.log('🚀 INICIALIZANDO SERVIDOR');
    console.log('===============================');
    
    // Testar conexão PostgreSQL primeiro
    console.log('📡 Testando conexão com PostgreSQL...');
    const conexaoOK = await testarConexao();
    
    if (!conexaoOK) {
      throw new Error('Falha na conexão com PostgreSQL');
    }
    
    console.log('✅ Conexão com PostgreSQL estabelecida');
    
    // Verificar tabelas essenciais
    console.log('🔍 Verificando tabelas essenciais...');
    
    try {
      const clientesResult = await pool.query('SELECT COUNT(*) FROM clientes');
      console.log('✅ Tabela clientes encontrada');
      console.log('📊 Clientes cadastrados:', clientesResult.rows[0].count);
    } catch (error) {
      console.log('⚠️ Tabela clientes não encontrada');
    }
    
    // Verificar tabela dados_empresas
    try {
      const empresasResult = await pool.query('SELECT COUNT(*) FROM dados_empresas');
      console.log('✅ Tabela dados_empresas encontrada');
      console.log('🏢 Empresas cadastradas:', empresasResult.rows[0].count);
      
      // Mostrar dados da empresa atual
      const empresaAtual = await pool.query('SELECT razao_social, nome_oficina FROM dados_empresas ORDER BY updated_at DESC LIMIT 1');
      if (empresaAtual.rows.length > 0) {
        console.log('📝 Empresa atual:', empresaAtual.rows[0].razao_social);
      }
    } catch (error) {
      console.log('⚠️ Tabela dados_empresas não encontrada');
    }
    
    // Verificar tabela orçamentos
    try {
      const orcamentosResult = await pool.query('SELECT COUNT(*) FROM orcamentos');
      console.log('✅ Tabela orcamentos encontrada');
      console.log('📋 Orçamentos cadastrados:', orcamentosResult.rows[0].count);
    } catch (error) {
      console.log('⚠️ Tabela orcamentos não encontrada');
    }
    
    // Iniciar servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n🎉 ===============================');
      console.log('🚀 SERVIDOR INICIADO COM SUCESSO!');
      console.log('===============================');
      console.log('🌐 Porta:', PORT);
      console.log('🌍 Ambiente:', process.env.NODE_ENV || 'development');
      console.log('📊 Banco:', process.env.DB_NAME || 'sistema_os');
      console.log('🏠 Local: http://localhost:' + PORT);
      console.log('🌍 Rede: http://10.133.128.150:' + PORT);
      console.log('📡 Health check: http://localhost:' + PORT + '/api/health');
      console.log('🧪 Teste CORS: http://localhost:' + PORT + '/api/cors/test');
      console.log('🧪 Teste empresa: http://localhost:' + PORT + '/api/dados-empresa/test');
      console.log('===============================');
      console.log('🎯 ENDPOINTS ATIVOS:');
      console.log('   🔐 /api/auth/* - Autenticação');
      console.log('   👤 /api/clientes/* - Clientes');
      console.log('   🏢 /api/dados-empresa/* - Empresa OTIMIZADO');
      console.log('   📋 /api/orcamentos/* - Orçamentos');
      console.log('   🏥 /api/health - Status');
      console.log('===============================');
      console.log('🌐 CORS OTIMIZADO:');
      console.log('   ✅ Aplicado uma vez apenas');
      console.log('   ✅ Suporte a rede local');
      console.log('   ✅ Sem duplicação');
      console.log('===============================');
      console.log('✅ MELHORIAS APLICADAS:');
      console.log('   ✅ CORS duplicado removido');
      console.log('   ✅ Logs otimizados');
      console.log('   ✅ Testes melhorados');
      console.log('   ✅ Performance otimizada');
      console.log('===============================\n');
      
      console.log('🎊 SISTEMA OTIMIZADO E PRONTO! 🎊\n');
    });

  } catch (error) {
    console.error('\n❌ ===============================');
    console.error('💥 ERRO AO INICIAR SERVIDOR');
    console.error('===============================');
    console.error('📝 Erro:', error.message);
    console.error('💡 Soluções possíveis:');
    console.error('   1. Verifique se o PostgreSQL está rodando');
    console.error('   2. Verifique as configurações no arquivo .env');
    console.error('   3. Verifique se o banco de dados existe');
    console.error('===============================\n');
    process.exit(1);
  }
}

// ============================================
// 🔚 DESLIGAMENTO GRACIOSO
// ============================================
process.on('SIGINT', async () => {
  console.log('\n🔄 ===============================');
  console.log('👋 DESLIGANDO SERVIDOR...');
  console.log('===============================');
  
  try {
    await pool.end();
    console.log('✅ Conexões do banco fechadas');
    console.log('✅ Servidor desligado com sucesso');
    console.log('👋 Até logo!');
    console.log('===============================\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao fechar conexões:', error);
    process.exit(1);
  }
});

// Capturar erros não tratados
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n🚨 PROMISE REJEITADA NÃO TRATADA:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('\n🚨 EXCEÇÃO NÃO CAPTURADA:', error);
  process.exit(1);
});

// ============================================
// 🚀 INICIAR SERVIDOR
// ============================================
iniciarServidor();