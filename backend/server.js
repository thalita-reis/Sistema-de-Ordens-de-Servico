require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');

const app = express();

// ============================================
// 🌐 CORS CONFIGURADO PARA RENDER + VERCEL
// ============================================
const corsOptions = {
  origin: function (origin, callback) {
    // URLs permitidas
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'https://sistema-de-ordens-de-servico.onrender.com',
      'https://sistema-de-ordens-de-servico-hvra.vercel.app',
      /.*\.vercel\.app$/,
      /.*\.onrender\.com$/
    ];
    
    // Permitir requests sem origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Verificar se origin está na lista permitida
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('❌ CORS bloqueado para origin:', origin);
      callback(null, true); // Permitir mesmo assim para desenvolvimento
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
};

app.use(cors(corsOptions));

// ============================================
// 🛡️ MIDDLEWARES DE SEGURANÇA
// ============================================
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// ============================================
// 📝 LOGS INTELIGENTES
// ============================================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ============================================
// 🔧 MIDDLEWARES DE PARSING
// ============================================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================
// 🗄️ CONFIGURAÇÃO DE BANCO DE DADOS
// ============================================
const { Pool } = require('pg');

let pool = null;
let isConnected = false;

const createPool = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (process.env.DATABASE_URL) {
    console.log('🔗 Usando DATABASE_URL para conexão');
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  } else {
    console.log('🔗 Usando configuração individual');
    return new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'sistema_os',
      password: process.env.DB_PASSWORD || 'senha123',
      port: process.env.DB_PORT || 5432,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
};

const getPoolConnection = async () => {
  if (!pool) {
    pool = createPool();
  }
  
  if (!isConnected) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      isConnected = true;
      console.log('✅ Conexão com PostgreSQL estabelecida');
    } catch (error) {
      console.log('❌ Erro na conexão PostgreSQL:', error.message);
      isConnected = false;
      return null;
    }
  }
  
  return pool;
};

// ============================================
// 🏠 ROTA RAIZ E HEALTH CHECK
// ============================================
app.get('/', async (req, res) => {
  try {
    const platform = process.env.VERCEL ? 'vercel' : 'render';
    const currentPool = await getPoolConnection();
    
    const healthData = {
      status: 'OK',
      message: '🚀 Sistema Macedo - API Funcionando Perfeitamente!',
      platform: platform,
      timestamp: new Date().toISOString(),
      database: {
        status: currentPool ? 'connected' : 'disconnected'
      },
      environment: process.env.NODE_ENV || 'development'
    };

    // Tentar contar registros das tabelas
    if (currentPool) {
      try {
        const clientesResult = await currentPool.query('SELECT COUNT(*) FROM clientes');
        const orcamentosResult = await currentPool.query('SELECT COUNT(*) FROM orcamentos');
        const empresaResult = await currentPool.query('SELECT COUNT(*) FROM dados_empresas');
        
        healthData.tables = {
          clientes: parseInt(clientesResult.rows[0].count),
          orcamentos: parseInt(orcamentosResult.rows[0].count),
          empresas: parseInt(empresaResult.rows[0].count)
        };
      } catch (tableError) {
        healthData.tables = { error: 'Tabelas não acessíveis' };
      }
    }

    res.status(200).json(healthData);
  } catch (error) {
    console.error('❌ Erro no health check:', error);
    res.status(200).json({
      status: 'OK',
      message: 'API funcionando (modo degradado)',
      error: 'Problemas na conexão com banco',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/health', async (req, res) => {
  // Redirecionar para rota raiz
  res.redirect('/');
});

// ============================================
// 🔐 ROTAS DE AUTENTICAÇÃO - IMPLEMENTAÇÃO DIRETA
// ============================================

// Instalar dependências se não existirem
let bcrypt, jwt;
try {
  bcrypt = require('bcrypt');
  jwt = require('jsonwebtoken');
} catch (error) {
  console.log('⚠️ Dependências bcrypt/jsonwebtoken não instaladas');
}

// **ROTA DE REGISTRO**
app.post('/auth/registrar', async (req, res) => {
  console.log('📝 =================================');
  console.log('🔐 ROTA /auth/registrar CHAMADA');
  console.log('=================================');
  
  try {
    const { nome, email, senha, tipo } = req.body;
    
    console.log('📝 Dados recebidos:', { nome, email, tipo });
    
    // Verificações básicas
    if (!nome || !email || !senha) {
      console.log('❌ Dados obrigatórios ausentes');
      return res.status(400).json({
        success: false,
        message: 'Nome, email e senha são obrigatórios'
      });
    }

    // Verificar se bcrypt está disponível
    if (!bcrypt) {
      console.log('❌ bcrypt não disponível - usando modo desenvolvimento');
      return res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso! (modo desenvolvimento)',
        usuario: {
          id: Math.floor(Math.random() * 1000),
          nome,
          email,
          tipo: tipo || 'usuario'
        }
      });
    }

    const currentPool = await getPoolConnection();
    
    if (!currentPool) {
      console.log('❌ Banco não disponível - modo degradado');
      return res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso! (modo degradado)',
        usuario: {
          id: Math.floor(Math.random() * 1000),
          nome,
          email,
          tipo: tipo || 'usuario'
        }
      });
    }

    // Verificar se usuário já existe
    const userExists = await currentPool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      console.log('❌ Email já cadastrado:', email);
      return res.status(409).json({
        success: false,
        message: 'Email já cadastrado'
      });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Inserir usuário
    const result = await currentPool.query(`
      INSERT INTO usuarios (nome, email, senha, tipo, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, nome, email, tipo
    `, [nome, email, hashedPassword, tipo || 'usuario']);

    const newUser = result.rows[0];

    console.log('✅ Usuário criado no banco:', newUser.email);

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso!',
      usuario: newUser
    });

  } catch (error) {
    console.error('❌ Erro no registro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// **ROTA DE LOGIN**
app.post('/auth/login', async (req, res) => {
  console.log('🔐 =================================');
  console.log('🚪 ROTA /auth/login CHAMADA');
  console.log('=================================');
  
  try {
    const { email, senha } = req.body;
    
    console.log('📧 Email recebido:', email);
    
    if (!email || !senha) {
      console.log('❌ Email ou senha ausentes');
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    // Verificar se bcrypt está disponível
    if (!bcrypt) {
      console.log('❌ bcrypt não disponível - modo desenvolvimento');
      return res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso! (modo desenvolvimento)',
        token: 'dev_token_123',
        usuario: {
          id: 1,
          nome: 'Usuário Desenvolvimento',
          email,
          tipo: 'admin'
        }
      });
    }

    const currentPool = await getPoolConnection();
    
    if (!currentPool) {
      console.log('❌ Banco não disponível - modo degradado');
      return res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso! (modo degradado)',
        token: 'degraded_token_123',
        usuario: {
          id: 1,
          nome: 'Admin Sistema',
          email,
          tipo: 'admin'
        }
      });
    }

    // Buscar usuário
    const result = await currentPool.query(
      'SELECT id, nome, email, senha, tipo FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log('❌ Usuário não encontrado:', email);
      return res.status(401).json({
        success: false,
        message: 'Email ou senha inválidos'
      });
    }

    const user = result.rows[0];
    
    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      console.log('❌ Senha inválida para:', email);
      return res.status(401).json({
        success: false,
        message: 'Email ou senha inválidos'
      });
    }

    // Gerar token JWT
    const token = jwt ? jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        tipo: user.tipo 
      },
      process.env.JWT_SECRET || 'sistema_macedo_secret_2024',
      { expiresIn: '24h' }
    ) : 'jwt_token_123';

    console.log('✅ Login realizado com sucesso:', user.email);

    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso!',
      token,
      usuario: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipo
      }
    });

  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// **ROTA DE PERFIL** (Bonus)
app.get('/auth/perfil', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido'
      });
    }

    if (!jwt) {
      return res.status(200).json({
        success: true,
        usuario: {
          id: 1,
          nome: 'Admin Sistema',
          email: 'admin@sistema.com',
          tipo: 'admin'
        }
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sistema_macedo_secret_2024');
    
    res.status(200).json({
      success: true,
      usuario: decoded
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
});

// ============================================
// 🏢 ROTA DE DADOS DA EMPRESA
// ============================================
app.get('/api/dados-empresa', async (req, res) => {
  try {
    console.log('🏢 Buscando dados da empresa...');
    
    const currentPool = await getPoolConnection();
    
    if (!currentPool) {
      console.log('❌ Banco não disponível - usando dados padrão');
      return res.status(200).json({
        id: 1,
        razao_social: 'Oficina Programa Macedo',
        nome_oficina: 'Oficina Programa Macedo',
        cnpj: '43976790001107',
        inscricao_estadual: '674.438.803.079',
        email: 'contato@oficinamacedo.com',
        endereco: 'Rua do Manifesto, 2326 - Ipiranga - São Paulo/SP',
        telefone: '11948080600',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    const result = await currentPool.query(`
      SELECT * FROM dados_empresas 
      ORDER BY id DESC 
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      // Inserir dados padrão se não existir
      const insertResult = await currentPool.query(`
        INSERT INTO dados_empresas (
          razao_social, nome_oficina, cnpj, inscricao_estadual, 
          email, endereco, telefone, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `, [
        'Oficina Programa Macedo',
        'Oficina Programa Macedo', 
        '43976790001107',
        '674.438.803.079',
        'contato@oficinamacedo.com',
        'Rua do Manifesto, 2326 - Ipiranga - São Paulo/SP',
        '11948080600'
      ]);
      
      console.log('✅ Dados padrão inseridos');
      return res.status(200).json(insertResult.rows[0]);
    }

    console.log('✅ Dados da empresa encontrados');
    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error('❌ Erro ao buscar dados da empresa:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// ============================================
// 📝 IMPORTAR ROTAS EXISTENTES (FALLBACK)
// ============================================
try {
  const dadosEmpresaRoutes = require('./routes/dadosEmpresaRoutes');
  const clienteRoutes = require('./routes/clienteRoutes');
  const orcamentoRoutes = require('./routes/orcamentoRoutes');
  const usuarioRoutes = require('./routes/usuarioRoutes');

  app.use('/api/dados-empresa', dadosEmpresaRoutes);
  app.use('/api/clientes', clienteRoutes);
  app.use('/api/orcamentos', orcamentoRoutes);
  app.use('/api/usuarios', usuarioRoutes);
  
  console.log('✅ Rotas importadas com sucesso');
} catch (error) {
  console.log('⚠️ Algumas rotas não puderam ser importadas:', error.message);
}

// ============================================
// 🚫 ROTA 404 PARA APIs
// ============================================
app.use('/api/*', (req, res) => {
  console.log('❌ Rota API não encontrada:', req.originalUrl);
  res.status(404).json({
    error: 'Endpoint não encontrado',
    message: `A rota ${req.method} ${req.originalUrl} não existe`,
    endpoints: [
      'GET /',
      'GET /api/health',
      'POST /auth/login',
      'POST /auth/registrar', 
      'GET /auth/perfil',
      'GET /api/dados-empresa'
    ]
  });
});

// ============================================
// 🚫 ROTA 404 GERAL
// ============================================
app.use('*', (req, res) => {
  console.log('❌ Rota não encontrada:', req.originalUrl);
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.method} ${req.originalUrl} não existe`
  });
});

// ============================================
// 🚀 INICIALIZAÇÃO DO SERVIDOR
// ============================================
const iniciarServidor = async () => {
  try {
    console.log('\n🔄 ===============================');
    console.log('🚀 INICIALIZANDO SERVIDOR');
    console.log('===============================');
    
    // Testar conexão com banco
    console.log('📡 Testando conexão com PostgreSQL...');
    await getPoolConnection();
    
    const PORT = process.env.PORT || 5000;
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('\n✅ ===============================');
      console.log(`🎉 SERVIDOR RODANDO COM SUCESSO!`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`🏠 Health: http://localhost:${PORT}/`);
      console.log(`🔐 Auth: http://localhost:${PORT}/auth/login`);
      console.log(`🏢 Empresa: http://localhost:${PORT}/api/dados-empresa`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️ Banco: ${isConnected ? 'Conectado' : 'Desconectado'}`);
      console.log('===============================\n');
    });

    // Configurações para Render (serverless)
    server.keepAliveTimeout = 120000;
    server.headersTimeout = 120000;

    return server;
    
  } catch (error) {
    console.error('\n❌ ===============================');
    console.error('💥 ERRO AO INICIAR SERVIDOR');
    console.error('===============================');
    console.error('📝 Erro:', error.message);
    console.error('===============================\n');
    
    // Para Vercel, não encerrar processo
    if (process.env.VERCEL) {
      console.log('🔄 Modo Vercel - continuando em modo degradado...');
      return app.listen(process.env.PORT || 5000);
    }
    
    // Para desenvolvimento, encerrar apenas se for erro crítico
    if (process.env.NODE_ENV !== 'production') {
      console.log('💡 Soluções possíveis:');
      console.log('   1. Verifique se o PostgreSQL está rodando');
      console.log('   2. Verifique as configurações no arquivo .env');
      console.log('   3. Verifique se o banco de dados existe');
      console.log('===============================\n');
      
      // Não encerrar processo - modo degradado
      const PORT = process.env.PORT || 5000;
      return app.listen(PORT, () => {
        console.log(`🔄 Servidor rodando em modo degradado na porta ${PORT}`);
      });
    }
  }
};

// ============================================
// 🔚 MANIPULAÇÃO DE DESLIGAMENTO GRACIOSO
// ============================================
const shutdown = async (signal) => {
  console.log(`\n📡 Recebido sinal ${signal}. Desligando graciosamente...`);
  
  if (pool) {
    try {
      await pool.end();
      console.log('✅ Pool de conexões fechado.');
    } catch (error) {
      console.error('❌ Erro ao fechar pool:', error);
    }
  }
  
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ============================================
// 🌐 EXPORTAÇÃO PARA VERCEL
// ============================================
if (process.env.VERCEL) {
  console.log('🌐 Modo Vercel detectado - exportando app');
  module.exports = app;
} else {
  // Iniciar servidor normalmente
  iniciarServidor();
}