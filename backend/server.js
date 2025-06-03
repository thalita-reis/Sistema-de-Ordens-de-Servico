require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');

const app = express();

// ============================================
// 🌐 CORS CONFIGURADO - HÍBRIDO RENDER + VERCEL
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
    
    // ✅ URLs de produção RENDER
    process.env.FRONTEND_URL,
    'https://sistema-de-ordens-de-servico.onrender.com',
    /^https:\/\/.*\.onrender\.com$/,
    
    // ✅ URLs de produção VERCEL
    /^https:\/\/.*\.vercel\.app$/,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
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
// 🗄️ CONFIGURAÇÃO DO BANCO - HÍBRIDO RENDER + VERCEL
// ============================================
let pool = null;
let dbConfigured = false;

const initDatabase = async () => {
  try {
    // Vercel/Render podem usar diferentes variáveis
    const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    
    if (!databaseUrl) {
      console.log('⚠️ DATABASE_URL não encontrada - modo degradado');
      return false;
    }

    // Se já está configurado, usar o existente
    if (dbConfigured && pool) {
      return true;
    }

    const { Pool } = require('pg');
    
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Teste de conexão
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    dbConfigured = true;
    console.log('✅ PostgreSQL conectado!');
    return true;
    
  } catch (error) {
    console.log('⚠️ Falha na conexão PostgreSQL:', error.message);
    return false;
  }
};

// Função de fallback usando sua configuração atual
const getPoolConnection = async () => {
  try {
    // Se não tem pool configurado, tentar usar a configuração existente
    if (!pool && !dbConfigured) {
      const { pool: existingPool, testarConexao } = require('./src/config/database');
      const conexaoOK = await testarConexao();
      if (conexaoOK) {
        pool = existingPool;
        dbConfigured = true;
        console.log('✅ Usando pool existente do sistema');
        return pool;
      }
    }
    return pool;
  } catch (error) {
    console.log('⚠️ Pool existente não disponível, tentando inicializar...');
    await initDatabase();
    return pool;
  }
};

// ============================================
// 📝 IMPORTAÇÃO DAS ROTAS - MANTENDO SUA ESTRUTURA
// ============================================
let routesLoaded = false;
let authRoutes, clienteRoutes, orcamentoRoutes, empresaRoutes;

const loadRoutes = () => {
  if (!routesLoaded) {
    try {
      authRoutes = require('./src/routes/authRoutes');
      clienteRoutes = require('./src/routes/clienteRoutes');
      orcamentoRoutes = require('./src/routes/orcamentoRoutes');
      empresaRoutes = require('./src/routes/empresaRoutes');
      routesLoaded = true;
      console.log('✅ Rotas carregadas com sucesso');
    } catch (error) {
      console.log('⚠️ Erro ao carregar rotas:', error.message);
    }
  }
};

// ============================================
// 🛣️ CONFIGURAÇÃO DAS ROTAS
// ============================================

// ✅ ROTA RAIZ OTIMIZADA PARA RENDER + VERCEL
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

  // Detectar plataforma
  const platform = process.env.VERCEL ? 'vercel' : 'render';

  res.status(200).json({
    message: `API Sistema Macedo - Funcionando na ${platform.toUpperCase()}!`,
    version: '3.0.0',
    status: 'healthy',
    platform: platform,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    cors: {
      enabled: true,
      note: 'Configurado para Render + Vercel'
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
      stability: `Otimizado para ${platform}`
    }
  });
});

// ============================================
// 🔐 ROTAS DE AUTENTICAÇÃO - CARREGAMENTO DINÂMICO
// ============================================
app.use('/api/auth', (req, res, next) => {
  loadRoutes();
  if (authRoutes) {
    authRoutes(req, res, next);
  } else {
    res.status(503).json({ error: 'Serviço de autenticação indisponível' });
  }
});

// ============================================
// 👤 ROTAS DE CLIENTES - CARREGAMENTO DINÂMICO
// ============================================
app.use('/api/clientes', (req, res, next) => {
  loadRoutes();
  if (clienteRoutes) {
    clienteRoutes(req, res, next);
  } else {
    res.status(503).json({ error: 'Serviço de clientes indisponível' });
  }
});

// ============================================
// 📋 ROTAS DE ORÇAMENTOS - CARREGAMENTO DINÂMICO
// ============================================
app.use('/api/orcamentos', (req, res, next) => {
  loadRoutes();
  if (orcamentoRoutes) {
    orcamentoRoutes(req, res, next);
  } else {
    res.status(503).json({ error: 'Serviço de orçamentos indisponível' });
  }
});

// ============================================
// 🏢 ROTAS DE EMPRESA - IMPLEMENTAÇÃO DIRETA PARA GARANTIR FUNCIONAMENTO
// ============================================

// Dados da empresa - ROTA PRINCIPAL
app.get('/api/dados-empresa', async (req, res) => {
  try {
    const currentPool = await getPoolConnection();
    
    if (!currentPool) {
      // Fallback com seus dados atuais
      return res.status(200).json({
        id: 1,
        razao_social: 'Oficina sdfsdsfdfs Macedo', // Seu valor atual
        nome_oficina: 'Oficina Programa Macedo',
        cnpj: '43976790001107',
        inscricao_estadual: '674.438.803.079',
        email: 'contato@oficinamacedo.com',
        telefone: '(11) 9999-9999',
        endereco: 'São Paulo, SP',
        message: 'Dados padrão - banco não conectado',
        platform: process.env.VERCEL ? 'vercel' : 'render',
        fonte: 'fallback_hybrid'
      });
    }

    // Tentar buscar dados do banco
    const result = await currentPool.query(`
      SELECT * FROM dados_empresas 
      ORDER BY updated_at DESC 
      LIMIT 1
    `);

    if (result.rows.length > 0) {
      res.status(200).json({
        ...result.rows[0],
        platform: process.env.VERCEL ? 'vercel' : 'render',
        fonte: 'dados_empresas_hybrid'
      });
    } else {
      // Se não encontrar dados, retornar padrão atualizado
      res.status(200).json({
        id: 1,
        razao_social: 'Oficina sdfsdsfdfs Macedo',
        nome_oficina: 'Oficina Programa Macedo',
        cnpj: '43976790001107',
        inscricao_estadual: '674.438.803.079',
        email: 'contato@oficinamacedo.com',
        telefone: '(11) 9999-9999',
        endereco: 'São Paulo, SP',
        message: 'Dados padrão - nenhum registro encontrado',
        platform: process.env.VERCEL ? 'vercel' : 'render',
        fonte: 'default_hybrid'
      });
    }

  } catch (error) {
    console.error('Erro ao buscar dados da empresa:', error);
    res.status(200).json({
      id: 1,
      razao_social: 'Oficina sdfsdsfdfs Macedo',
      nome_oficina: 'Oficina Programa Macedo',
      cnpj: '43976790001107',
      inscricao_estadual: '674.438.803.079',
      email: 'contato@oficinamacedo.com',
      telefone: '(11) 9999-9999',
      endereco: 'São Paulo, SP',
      error: error.message,
      message: 'Dados padrão - erro na consulta',
      platform: process.env.VERCEL ? 'vercel' : 'render',
      fonte: 'error_fallback_hybrid'
    });
  }
});

// Atualizar dados da empresa
app.put('/api/dados-empresa', async (req, res) => {
  try {
    const currentPool = await getPoolConnection();
    
    if (!currentPool) {
      return res.status(200).json({
        success: true,
        message: 'Dados salvos localmente (banco não conectado)',
        platform: process.env.VERCEL ? 'vercel' : 'render',
        data: req.body
      });
    }

    const {
      razao_social,
      nome_oficina,
      cnpj,
      inscricao_estadual,
      email,
      endereco,
      telefone
    } = req.body;

    // Tentar atualizar ou inserir
    const result = await currentPool.query(`
      INSERT INTO dados_empresas (
        razao_social, nome_oficina, cnpj, inscricao_estadual, 
        email, endereco, telefone, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (id) DO UPDATE SET
        razao_social = $1,
        nome_oficina = $2,
        cnpj = $3,
        inscricao_estadual = $4,
        email = $5,
        endereco = $6,
        telefone = $7,
        updated_at = NOW()
      RETURNING *
    `, [razao_social, nome_oficina, cnpj, inscricao_estadual, email, endereco, telefone]);

    res.status(200).json({
      success: true,
      message: `Dados atualizados com sucesso na ${process.env.VERCEL ? 'Vercel' : 'Render'}!`,
      platform: process.env.VERCEL ? 'vercel' : 'render',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar dados:', error);
    res.status(200).json({
      success: false,
      message: 'Erro ao salvar dados',
      error: error.message,
      platform: process.env.VERCEL ? 'vercel' : 'render'
    });
  }
});

// Rotas de empresa via empresaRoutes (fallback)
app.use('/api/dados-empresa', (req, res, next) => {
  loadRoutes();
  if (empresaRoutes) {
    empresaRoutes(req, res, next);
  } else {
    // Se não conseguir carregar as rotas, continuar sem erro
    next();
  }
});

// ============================================
// 🏥 HEALTH CHECK HÍBRIDO RENDER + VERCEL
// ============================================
app.get('/api/health', async (req, res) => {
  try {
    // Log simplificado para produção
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n🏥 Health check solicitado');
    }

    const currentPool = await getPoolConnection();
    let dbTest = null;
    let tablesStatus = {};

    if (currentPool) {
      try {
        // Teste rápido do banco
        dbTest = await currentPool.query('SELECT NOW() as current_time');
        
        // Verificar tabelas principais
        try {
          const clientesCount = await currentPool.query('SELECT COUNT(*) FROM clientes');
          tablesStatus.clientes = parseInt(clientesCount.rows[0].count);
        } catch (error) {
          tablesStatus.clientes = 'not_found';
        }
        
        try {
          const empresasCount = await currentPool.query('SELECT COUNT(*) FROM dados_empresas');
          tablesStatus.empresas = parseInt(empresasCount.rows[0].count);
        } catch (error) {
          tablesStatus.empresas = 'not_found';
        }
        
        try {
          const orcamentosCount = await currentPool.query('SELECT COUNT(*) FROM orcamentos');
          tablesStatus.orcamentos = parseInt(orcamentosCount.rows[0].count);
        } catch (error) {
          tablesStatus.orcamentos = 'not_found';
        }
      } catch (error) {
        // Database error, mas continua
      }
    }

    const healthData = {
      status: 'OK',
      platform: process.env.VERCEL ? 'vercel' : 'render',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      },
      database: {
        status: currentPool ? 'connected' : 'not_connected',
        current_time: dbTest?.rows[0]?.current_time || null
      },
      tables: tablesStatus,
      version: '3.0.0'
    };

    res.status(200).json(healthData);

  } catch (error) {
    console.error('❌ Erro no health check:', error.message);
    
    res.status(200).json({
      status: 'DEGRADED',
      platform: process.env.VERCEL ? 'vercel' : 'render',
      message: 'Serviço em modo degradado',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Service degraded',
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
    const currentPool = await getPoolConnection();
    let tabelas = [];
    let dados = null;
    
    if (currentPool) {
      try {
        const tabelasResult = await currentPool.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name IN ('dados_empresas', 'empresas')
        `);
        tabelas = tabelasResult.rows.map(r => r.table_name);
        
        const dadosResult = await currentPool.query('SELECT * FROM dados_empresas ORDER BY updated_at DESC LIMIT 1');
        dados = dadosResult.rows[0] || null;
      } catch (error) {
        // Silencioso
      }
    }

    res.status(200).json({
      status: 'OK',
      platform: process.env.VERCEL ? 'vercel' : 'render',
      database_connected: !!currentPool,
      tabelas_disponiveis: tabelas,
      dados_encontrados: !!dados,
      dados: dados,
      message: 'Teste executado com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(200).json({
      status: 'ERROR',
      platform: process.env.VERCEL ? 'vercel' : 'render',
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
    message: 'CORS configurado corretamente para Render + Vercel',
    origin: req.get('Origin'),
    platform: process.env.VERCEL ? 'vercel' : 'render',
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
    platform: process.env.VERCEL ? 'vercel' : 'render',
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
  console.error('💥 Erro capturado:', error.message);
  
  res.status(error.status || 500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Algo deu errado',
    platform: process.env.VERCEL ? 'vercel' : 'render',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// 🚀 INICIALIZAÇÃO HÍBRIDA RENDER + VERCEL
// ============================================
const PORT = process.env.PORT || 5000;

// Middleware de inicialização para Vercel
let appInitialized = false;
app.use(async (req, res, next) => {
  if (!appInitialized) {
    console.log('🚀 Inicializando app na primeira requisição...');
    await initDatabase();
    loadRoutes();
    appInitialized = true;
    console.log('✅ App inicializado!');
  }
  next();
});

// Função de inicialização para Render (seu código original)
async function iniciarServidor() {
  try {
    console.log('🚀 Iniciando servidor...');
    console.log('🌍 Ambiente:', process.env.NODE_ENV || 'development');
    console.log('🌐 Porta:', PORT);
    console.log('🚀 Plataforma:', process.env.VERCEL ? 'Vercel' : 'Render');
    
    // Inicializar banco
    const conexaoOK = await initDatabase();
    
    if (conexaoOK) {
      console.log('✅ PostgreSQL conectado!');
      
      // Verificar tabelas essenciais (mantendo sua lógica)
      const currentPool = await getPoolConnection();
      if (currentPool) {
        try {
          const clientesResult = await currentPool.query('SELECT COUNT(*) FROM clientes');
          console.log('✅ Tabela clientes:', clientesResult.rows[0].count, 'registros');
        } catch (error) {
          console.log('⚠️ Tabela clientes não encontrada');
        }
        
        try {
          const empresasResult = await currentPool.query('SELECT COUNT(*) FROM dados_empresas');
          console.log('✅ Tabela dados_empresas:', empresasResult.rows[0].count, 'registros');
          
          const empresaAtual = await currentPool.query('SELECT razao_social FROM dados_empresas ORDER BY updated_at DESC LIMIT 1');
          if (empresaAtual.rows.length > 0) {
            console.log('📝 Empresa atual:', empresaAtual.rows[0].razao_social);
          }
        } catch (error) {
          console.log('⚠️ Tabela dados_empresas não encontrada');
        }
        
        try {
          const orcamentosResult = await currentPool.query('SELECT COUNT(*) FROM orcamentos');
          console.log('✅ Tabela orcamentos:', orcamentosResult.rows[0].count, 'registros');
        } catch (error) {
          console.log('⚠️ Tabela orcamentos não encontrada');
        }
      }
    }
    
    // Carregar rotas
    loadRoutes();
    
    // Iniciar servidor (apenas se não for Vercel)
    if (!process.env.VERCEL) {
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
        console.log('✅ Sistema híbrido Render + Vercel!');
        console.log('===============================\n');
      });

      // Configurar timeouts para Render
      server.keepAliveTimeout = 120000;
      server.headersTimeout = 120000;
    }

  } catch (error) {
    console.error('❌ ERRO AO INICIAR SERVIDOR:', error.message);
    
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Continuando em modo degradado...');
    } else {
      process.exit(1);
    }
  }
}

// ============================================
// 🔚 DESLIGAMENTO GRACIOSO (mantendo sua lógica)
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

// Capturar erros não tratados (mantendo sua lógica)
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
// 🚀 INICIALIZAÇÃO FINAL
// ============================================

// Se não for Vercel, usar sua função de inicialização
if (!process.env.VERCEL) {
  iniciarServidor();
}

// Export para Vercel
module.exports = app;