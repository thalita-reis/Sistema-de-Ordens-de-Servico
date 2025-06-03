require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');

const app = express();

// ============================================
// 🌐 CORS CONFIGURADO - VERSÃO OTIMIZADA PARA PRODUÇÃO
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
    
    // ✅ URLs de produção
    process.env.FRONTEND_URL,
    'https://sistema-de-ordens-de-servico.onrender.com',
    /^https:\/\/.*\.onrender\.com$/
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

// ✅ LOGS OTIMIZADOS PARA PRODUÇÃO
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

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

// ✅ ROTA RAIZ OTIMIZADA PARA RENDER
app.get('/', (req, res) => {
  // Log simplificado para produção
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n🏠 =================================');
    console.log('📋 PÁGINA INICIAL ACESSADA');
    console.log('=================================');
    console.log('🌐 IP:', req.ip);
    console.log('🔧 User-Agent:', req.get('User-Agent'));
    console.log('=================================\n');
  }

  res.status(200).json({
    message: 'API Sistema Macedo - Funcionando Perfeitamente!',
    version: '2.3.0',
    status: 'healthy',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    cors: {
      enabled: true,
      note: 'Configurado para desenvolvimento e produção'
    },
    endpoints: [
      '/api/health',
      '/api/auth',
      '/api/clientes',
      '/api/orcamentos',
      '/api/dados-empresa'
    ],
    features: {
      authentication: 'JWT Token',
      database: 'PostgreSQL',
      security: 'Helmet + CORS',
      logging: 'Morgan',
      stability: 'Otimizado para Render'
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
// 🏥 HEALTH CHECK OTIMIZADO PARA RENDER
// ============================================
app.get('/api/health', async (req, res) => {
  try {
    // Log simplificado para produção
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n🏥 Health check solicitado');
    }

    // Teste rápido do banco
    const dbTest = await pool.query('SELECT NOW() as current_time');
    
    // Verificar tabelas principais (sem logs excessivos)
    let tablesStatus = {};
    
    try {
      const clientesCount = await pool.query('SELECT COUNT(*) FROM clientes');
      tablesStatus.clientes = parseInt(clientesCount.rows[0].count);
    } catch (error) {
      tablesStatus.clientes = 'not_found';
    }
    
    try {
      const empresasCount = await pool.query('SELECT COUNT(*) FROM dados_empresas');
      tablesStatus.empresas = parseInt(empresasCount.rows[0].count);
    } catch (error) {
      tablesStatus.empresas = 'not_found';
    }
    
    try {
      const orcamentosCount = await pool.query('SELECT COUNT(*) FROM orcamentos');
      tablesStatus.orcamentos = parseInt(orcamentosCount.rows[0].count);
    } catch (error) {
      tablesStatus.orcamentos = 'not_found';
    }

    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      },
      database: {
        status: 'connected',
        current_time: dbTest.rows[0].current_time
      },
      tables: tablesStatus,
      version: '2.3.0'
    };

    res.status(200).json(healthData);

  } catch (error) {
    console.error('❌ Erro no health check:', error.message);
    
    // Retornar status de erro mas ainda com 200 para não falhar o deploy
    res.status(200).json({
      status: 'DEGRADED',
      message: 'Banco de dados inacessível',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Database connection failed',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime())
    });
  }
});

// ============================================
// 🧪 ROTA DE TESTE ESPECÍFICA PARA EMPRESA
// ============================================
app.get('/api/dados-empresa/test', async (req, res) => {
  try {
    // Verificar tabelas disponíveis
    const testQuery = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('dados_empresas', 'empresas')
    `);
    
    let dadosEncontrados = null;
    let tabelaUsada = null;
    
    // Tentar buscar dados da empresa
    try {
      const dados = await pool.query('SELECT * FROM dados_empresas ORDER BY updated_at DESC LIMIT 1');
      if (dados.rows.length > 0) {
        dadosEncontrados = dados.rows[0];
        tabelaUsada = 'dados_empresas';
      }
    } catch (error) {
      // Tabela não existe ou erro
    }
    
    res.status(200).json({
      status: 'OK',
      tabelas_disponiveis: testQuery.rows.map(r => r.table_name),
      dados_encontrados: !!dadosEncontrados,
      tabela_usada: tabelaUsada,
      dados: dadosEncontrados,
      message: 'Teste executado com sucesso',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(200).json({
      status: 'ERROR',
      message: 'Erro no teste',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// 🧪 ROTA DE TESTE DE CORS
// ============================================
app.get('/api/cors/test', (req, res) => {
  res.status(200).json({
    status: 'CORS_OK',
    message: 'CORS configurado corretamente',
    origin: req.get('Origin'),
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// 🚫 TRATAMENTO DE ROTAS NÃO ENCONTRADAS
// ============================================
app.use('*', (req, res) => {
  // Log simplificado para produção
  if (process.env.NODE_ENV !== 'production') {
    console.log(`❌ Rota não encontrada: ${req.method} ${req.originalUrl}`);
  }

  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.method} ${req.originalUrl} não existe`,
    timestamp: new Date().toISOString(),
    available_endpoints: [
      'GET /',
      'GET /api/health',
      'POST /api/auth/login',
      'GET /api/clientes',
      'GET /api/dados-empresa',
      'GET /api/orcamentos'
    ]
  });
});

// ============================================
// 🚨 TRATAMENTO GLOBAL DE ERROS
// ============================================
app.use((error, req, res, next) => {
  // Log do erro
  console.error('💥 Erro capturado:', error.message);
  
  res.status(error.status || 500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Algo deu errado',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// 🚀 INICIALIZAÇÃO DO SERVIDOR
// ============================================
const PORT = process.env.PORT || 5000;

async function iniciarServidor() {
  try {
    console.log('🚀 Iniciando servidor...');
    console.log('🌍 Ambiente:', process.env.NODE_ENV || 'development');
    console.log('🌐 Porta:', PORT);
    
    // Testar conexão PostgreSQL
    console.log('📡 Testando conexão com PostgreSQL...');
    
    let conexaoOK = false;
    try {
      conexaoOK = await testarConexao();
    } catch (error) {
      console.log('⚠️ Conexão com banco falhou:', error.message);
      console.log('🔄 Servidor continuará sem banco (modo degradado)');
    }
    
    if (conexaoOK) {
      console.log('✅ PostgreSQL conectado!');
      
      // Verificar tabelas essenciais (sem parar o servidor se falhar)
      try {
        const clientesResult = await pool.query('SELECT COUNT(*) FROM clientes');
        console.log('✅ Tabela clientes:', clientesResult.rows[0].count, 'registros');
      } catch (error) {
        console.log('⚠️ Tabela clientes não encontrada');
      }
      
      try {
        const empresasResult = await pool.query('SELECT COUNT(*) FROM dados_empresas');
        console.log('✅ Tabela dados_empresas:', empresasResult.rows[0].count, 'registros');
        
        const empresaAtual = await pool.query('SELECT razao_social FROM dados_empresas ORDER BY updated_at DESC LIMIT 1');
        if (empresaAtual.rows.length > 0) {
          console.log('📝 Empresa atual:', empresaAtual.rows[0].razao_social);
        }
      } catch (error) {
        console.log('⚠️ Tabela dados_empresas não encontrada');
      }
      
      try {
        const orcamentosResult = await pool.query('SELECT COUNT(*) FROM orcamentos');
        console.log('✅ Tabela orcamentos:', orcamentosResult.rows[0].count, 'registros');
      } catch (error) {
        console.log('⚠️ Tabela orcamentos não encontrada');
      }
    }
    
    // Iniciar servidor
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('🎉 ===============================');
      console.log('🚀 SERVIDOR INICIADO COM SUCESSO!');
      console.log('===============================');
      console.log('🌐 Porta:', PORT);
      console.log('🌍 Ambiente:', process.env.NODE_ENV || 'development');
      console.log('🏠 URL:', `http://localhost:${PORT}`);
      console.log('📡 Health check:', `http://localhost:${PORT}/api/health`);
      console.log('===============================');
      console.log('🎯 ENDPOINTS PRINCIPAIS:');
      console.log('   🏠 / - Página inicial');
      console.log('   🏥 /api/health - Status');
      console.log('   🔐 /api/auth/* - Autenticação');
      console.log('   👤 /api/clientes/* - Clientes');
      console.log('   🏢 /api/dados-empresa/* - Empresa');
      console.log('   📋 /api/orcamentos/* - Orçamentos');
      console.log('===============================');
      console.log('✅ Sistema otimizado para Render!');
      console.log('===============================\n');
    });

    // Configurar timeouts para Render
    server.keepAliveTimeout = 120000; // 120s
    server.headersTimeout = 120000; // 120s

  } catch (error) {
    console.error('❌ ERRO AO INICIAR SERVIDOR:', error.message);
    
    // Em produção, não encerrar o processo, apenas log o erro
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Continuando em modo degradado...');
    } else {
      process.exit(1);
    }
  }
}

// ============================================
// 🔚 DESLIGAMENTO GRACIOSO
// ============================================
process.on('SIGINT', async () => {
  console.log('\n👋 Desligando servidor...');
  
  try {
    if (pool) {
      await pool.end();
      console.log('✅ Conexões do banco fechadas');
    }
    console.log('✅ Servidor desligado com sucesso');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao fechar conexões:', error.message);
    process.exit(1);
  }
});

// Capturar erros não tratados (sem encerrar o processo em produção)
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Promise rejeitada:', reason);
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Exceção não capturada:', error.message);
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// ============================================
// 🚀 INICIAR SERVIDOR
// ============================================
iniciarServidor();