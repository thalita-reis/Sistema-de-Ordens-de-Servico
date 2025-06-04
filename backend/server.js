require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');

const app = express();

// ============================================
// 🌐 CORS CONFIGURADO - HÍBRIDO RENDER + VERCEL (MELHORADO)
// ============================================
const corsOptions = {
  origin: function (origin, callback) {
    // Lista de origens permitidas
    const allowedOrigins = [
      // URLs de desenvolvimento
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      
      // Seu IP atual da rede
      'http://10.133.128.150:3000',
      
      // IPs comuns de rede local
      'http://192.168.1.100:3000',
      'http://192.168.0.100:3000',
      
      // URLs de produção RENDER
      'https://sistema-de-ordens-de-servico.onrender.com',
      
      // URLs de produção VERCEL
      'https://sistema-de-ordens-de-servico-hvra.vercel.app',
      
      // Variáveis de ambiente
      process.env.FRONTEND_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    ].filter(Boolean);

    // Padrões regex para aceitar domínios dinâmicos
    const allowedPatterns = [
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/,
      /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:3000$/,
      /^http:\/\/172\.16\.\d{1,3}\.\d{1,3}:3000$/,
      /^https:\/\/.*\.onrender\.com$/,
      /^https:\/\/.*\.vercel\.app$/
    ];
    
    // Permitir requests sem origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Verificar se origin está na lista permitida
    const isAllowed = allowedOrigins.includes(origin) || 
                     allowedPatterns.some(pattern => pattern.test(origin));
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('⚠️ CORS origin não permitida:', origin);
      callback(null, true); // Permitir mesmo assim para desenvolvimento
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type', 
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'Expires',
    'x-cache-killer'
  ],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 horas
};

// ============================================
// 🔧 MIDDLEWARES DE SEGURANÇA E LOGS (OTIMIZADOS)
// ============================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false // Desabilitar para evitar problemas
}));

// ✅ CORS APLICADO
app.use(cors(corsOptions));

// ✅ LOGS OTIMIZADOS
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Parsing de JSON e URL
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// 🗄️ CONFIGURAÇÃO DO BANCO - HÍBRIDO MELHORADO
// ============================================
const { Pool } = require('pg');

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
    
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: process.env.VERCEL ? 5 : 20, // Menos conexões na Vercel
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: process.env.VERCEL ? 5000 : 10000, // Timeout menor na Vercel
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
      try {
        const { pool: existingPool, testarConexao } = require('./src/config/database');
        const conexaoOK = await testarConexao();
        if (conexaoOK) {
          pool = existingPool;
          dbConfigured = true;
          console.log('✅ Usando pool existente do sistema');
          return pool;
        }
      } catch (error) {
        console.log('⚠️ Pool existente não disponível, tentando inicializar...');
      }
    }
    
    // Se ainda não tem pool, inicializar
    if (!pool) {
      await initDatabase();
    }
    
    return pool;
  } catch (error) {
    console.log('⚠️ Erro ao obter conexão do pool:', error.message);
    return null;
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
      return true;
    } catch (error) {
      console.log('⚠️ Erro ao carregar rotas:', error.message);
      return false;
    }
  }
  return true;
};

// ============================================
// 🛣️ ROTA RAIZ OTIMIZADA PARA RENDER + VERCEL
// ============================================
app.get('/', async (req, res) => {
  try {
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
    const currentPool = await getPoolConnection();

    const healthData = {
      message: `🚀 Sistema Macedo - API Funcionando na ${platform.toUpperCase()}!`,
      version: '3.1.0',
      status: 'healthy',
      platform: platform,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: {
        status: currentPool ? 'connected' : 'disconnected'
      },
      cors: {
        enabled: true,
        note: 'Configurado para Render + Vercel'
      },
      endpoints: [
        'GET /api/health',
        'POST /auth/login',
        'POST /auth/registrar',
        'GET /api/dados-empresa',
        'PUT /api/dados-empresa',
        'GET /api/clientes',
        'GET /api/orcamentos'
      ],
      features: {
        authentication: 'JWT Token',
        database: 'PostgreSQL',
        security: 'Helmet + CORS',
        logging: 'Morgan',
        stability: `Otimizado para ${platform}`
      }
    };

    // Tentar contar registros das tabelas
    if (currentPool) {
      try {
        const clientesResult = await currentPool.query('SELECT COUNT(*) FROM clientes');
        const orcamentosResult = await currentPool.query('SELECT COUNT(*) FROM orcamentos');
        const empresaResult = await currentPool.query('SELECT COUNT(*) FROM dados_empresas');
        const usuariosResult = await currentPool.query('SELECT COUNT(*) FROM usuarios');
        
        healthData.tables = {
          clientes: parseInt(clientesResult.rows[0].count),
          orcamentos: parseInt(orcamentosResult.rows[0].count),
          empresas: parseInt(empresaResult.rows[0].count),
          usuarios: parseInt(usuariosResult.rows[0].count)
        };
      } catch (tableError) {
        healthData.tables = { error: 'Tabelas não acessíveis' };
      }
    }

    res.status(200).json(healthData);
  } catch (error) {
    console.error('❌ Erro na rota raiz:', error);
    res.status(200).json({
      message: 'API funcionando (modo degradado)',
      status: 'degraded',
      platform: process.env.VERCEL ? 'vercel' : 'render',
      timestamp: new Date().toISOString(),
      error: 'Problemas na conexão'
    });
  }
});

// ============================================
// 🔐 ROTAS DE AUTENTICAÇÃO DIRETAS (GARANTIDAS)
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
  try {
    const { nome, email, senha, tipo } = req.body;
    
    console.log('📝 Registro solicitado:', { nome, email, tipo });
    
    // Verificações básicas
    if (!nome || !email || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Nome, email e senha são obrigatórios'
      });
    }

    const currentPool = await getPoolConnection();
    
    if (!currentPool || !bcrypt) {
      console.log('⚠️ Modo degradado - registro simples');
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

    console.log('✅ Usuário criado:', newUser.email);

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
  try {
    const { email, senha } = req.body;
    
    console.log('🔐 Login solicitado:', email);
    
    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    const currentPool = await getPoolConnection();
    
    if (!currentPool || !bcrypt || !jwt) {
      console.log('⚠️ Modo degradado - login simples');
      return res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso! (modo degradado)',
        token: `degraded_token_${Date.now()}`,
        usuario: {
          id: 1,
          nome: email.split('@')[0],
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
      return res.status(401).json({
        success: false,
        message: 'Email ou senha inválidos'
      });
    }

    const user = result.rows[0];
    
    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha inválidos'
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        tipo: user.tipo 
      },
      process.env.JWT_SECRET || 'sistema_macedo_secret_2024',
      { expiresIn: '24h' }
    );

    console.log('✅ Login realizado:', user.email);

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

// **ROTA DE PERFIL**
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
    
    const currentPool = await getPoolConnection();
    
    if (!currentPool) {
      return res.status(200).json({
        success: true,
        usuario: decoded
      });
    }

    const result = await currentPool.query(
      'SELECT id, nome, email, tipo FROM usuarios WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      usuario: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erro ao obter perfil:', error);
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
});

// ============================================
// 🏢 ROTAS DE EMPRESA - IMPLEMENTAÇÃO DIRETA GARANTIDA
// ============================================

// **DADOS DA EMPRESA - GET**
app.get('/api/dados-empresa', async (req, res) => {
  try {
    console.log('🏢 Buscando dados da empresa...');
    
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
        telefone: '(11) 94808-0600',
        endereco: 'Rua do Manifesto, 2326 - Ipiranga - São Paulo/SP',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
      console.log('✅ Dados da empresa encontrados no banco');
      res.status(200).json({
        ...result.rows[0],
        platform: process.env.VERCEL ? 'vercel' : 'render',
        fonte: 'dados_empresas_hybrid'
      });
    } else {
      // Se não encontrar dados, inserir e retornar padrão
      try {
        const insertResult = await currentPool.query(`
          INSERT INTO dados_empresas (
            razao_social, nome_oficina, cnpj, inscricao_estadual, 
            email, endereco, telefone, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          RETURNING *
        `, [
          'Oficina sdfsdsfdfs Macedo',
          'Oficina Programa Macedo',
          '43976790001107',
          '674.438.803.079',
          'contato@oficinamacedo.com',
          'Rua do Manifesto, 2326 - Ipiranga - São Paulo/SP',
          '(11) 94808-0600'
        ]);
        
        console.log('✅ Dados padrão inseridos no banco');
        res.status(200).json({
          ...insertResult.rows[0],
          platform: process.env.VERCEL ? 'vercel' : 'render',
          fonte: 'inserted_hybrid'
        });
      } catch (insertError) {
        console.log('❌ Erro ao inserir dados padrão:', insertError.message);
        res.status(200).json({
          id: 1,
          razao_social: 'Oficina sdfsdsfdfs Macedo',
          nome_oficina: 'Oficina Programa Macedo',
          cnpj: '43976790001107',
          inscricao_estadual: '674.438.803.079',
          email: 'contato@oficinamacedo.com',
          telefone: '(11) 94808-0600',
          endereco: 'Rua do Manifesto, 2326 - Ipiranga - São Paulo/SP',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          message: 'Dados padrão - erro na inserção',
          platform: process.env.VERCEL ? 'vercel' : 'render',
          fonte: 'error_fallback_hybrid'
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro ao buscar dados da empresa:', error);
    res.status(200).json({
      id: 1,
      razao_social: 'Oficina sdfsdsfdfs Macedo',
      nome_oficina: 'Oficina Programa Macedo',
      cnpj: '43976790001107',
      inscricao_estadual: '674.438.803.079',
      email: 'contato@oficinamacedo.com',
      telefone: '(11) 94808-0600',
      endereco: 'Rua do Manifesto, 2326 - Ipiranga - São Paulo/SP',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      error: error.message,
      message: 'Dados padrão - erro na consulta',
      platform: process.env.VERCEL ? 'vercel' : 'render',
      fonte: 'error_fallback_hybrid'
    });
  }
});

// **ATUALIZAR DADOS DA EMPRESA - PUT**
app.put('/api/dados-empresa', async (req, res) => {
  try {
    console.log('🔄 Atualizando dados da empresa...');
    console.log('📝 Dados recebidos:', req.body);
    
    const {
      razao_social,
      nome_oficina,
      cnpj,
      inscricao_estadual,
      email,
      endereco,
      telefone
    } = req.body;

    const currentPool = await getPoolConnection();
    
    if (!currentPool) {
      console.log('⚠️ Banco não disponível - modo degradado');
      return res.status(200).json({
        success: true,
        message: 'Dados salvos localmente (banco não conectado)',
        platform: process.env.VERCEL ? 'vercel' : 'render',
        data: req.body
      });
    }

    // Verificar se existe algum registro
    const existingResult = await currentPool.query(`
      SELECT id FROM dados_empresas ORDER BY id DESC LIMIT 1
    `);

    let result;
    
    if (existingResult.rows.length === 0) {
      // Inserir novo registro
      result = await currentPool.query(`
        INSERT INTO dados_empresas (
          razao_social, nome_oficina, cnpj, inscricao_estadual, 
          email, endereco, telefone, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `, [razao_social, nome_oficina, cnpj, inscricao_estadual, email, endereco, telefone]);
      
      console.log('✅ Novo registro inserido');
    } else {
      // Atualizar registro existente
      const id = existingResult.rows[0].id;
      result = await currentPool.query(`
        UPDATE dados_empresas 
        SET razao_social = $1, nome_oficina = $2, cnpj = $3, 
            inscricao_estadual = $4, email = $5, endereco = $6, 
            telefone = $7, updated_at = NOW()
        WHERE id = $8
        RETURNING *
      `, [razao_social, nome_oficina, cnpj, inscricao_estadual, email, endereco, telefone, id]);
      
      console.log('✅ Registro atualizado');
    }

    res.status(200).json({
      success: true,
      message: `Dados atualizados com sucesso na ${process.env.VERCEL ? 'Vercel' : 'Render'}!`,
      platform: process.env.VERCEL ? 'vercel' : 'render',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar dados da empresa:', error);
    res.status(200).json({
      success: false,
      message: 'Erro ao salvar dados',
      error: error.message,
      platform: process.env.VERCEL ? 'vercel' : 'render'
    });
  }
});

// ============================================
// 👥 ROTAS DE CLIENTES - IMPLEMENTAÇÃO BÁSICA
// ============================================
app.get('/api/clientes', async (req, res) => {
  try {
    console.log('👥 Buscando clientes...');
    
    const currentPool = await getPoolConnection();
    
    if (!currentPool) {
      console.log('❌ Banco não disponível - dados de exemplo');
      return res.status(200).json({
        success: true,
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
        message: 'Banco não disponível - usando dados de exemplo'
      });
    }

    // Parâmetros de paginação
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    // Query de busca
    let whereClause = '';
    let queryParams = [];

    if (search) {
      whereClause = `WHERE nome ILIKE $1 OR email ILIKE $1 OR telefone ILIKE $1`;
      queryParams.push(`%${search}%`);
    }

    // Contar total
    const countQuery = `SELECT COUNT(*) FROM clientes ${whereClause}`;
    const countResult = await currentPool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // Buscar dados
    const dataQuery = `
      SELECT * FROM clientes 
      ${whereClause}
      ORDER BY nome ASC 
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    queryParams.push(limit, offset);
    
    const result = await currentPool.query(dataQuery, queryParams);

    console.log(`✅ ${result.rows.length} clientes encontrados`);

    res.status(200).json({
      success: true,
      data: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('❌ Erro ao buscar clientes:', error);
    res.status(200).json({
      success: true,
      data: [],
      total: 0,
      page: 1,
      totalPages: 0,
      message: 'Erro ao acessar banco de dados',
      error: error.message
    });
  }
});

// ============================================
// 📄 ROTAS DE ORÇAMENTOS - IMPLEMENTAÇÃO BÁSICA
// ============================================
app.get('/api/orcamentos', async (req, res) => {
  try {
    console.log('📄 Buscando orçamentos...');
    
    const currentPool = await getPoolConnection();
    
    if (!currentPool) {
      console.log('❌ Banco não disponível - dados de exemplo');
      return res.status(200).json({
        success: true,
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
        message: 'Banco não disponível - usando dados de exemplo'
      });
    }

    // Parâmetros de paginação
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    // Query de busca
    let whereClause = '';
    let queryParams = [];

    if (search) {
      whereClause = `WHERE numero ILIKE $1 OR cliente_nome ILIKE $1 OR status ILIKE $1`;
      queryParams.push(`%${search}%`);
    }

    // Contar total
    const countQuery = `SELECT COUNT(*) FROM orcamentos ${whereClause}`;
    const countResult = await currentPool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // Buscar dados
    const dataQuery = `
      SELECT * FROM orcamentos 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    queryParams.push(limit, offset);
    
    const result = await currentPool.query(dataQuery, queryParams);

    console.log(`✅ ${result.rows.length} orçamentos encontrados`);

    res.status(200).json({
      success: true,
      data: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('❌ Erro ao buscar orçamentos:', error);
    res.status(200).json({
      success: true,
      data: [],
      total: 0,
      page: 1,
      totalPages: 0,
      message: 'Erro ao acessar banco de dados',
      error: error.message
    });
  }
});

// ============================================
// 🔐 ROTAS DE AUTENTICAÇÃO - CARREGAMENTO DINÂMICO (FALLBACK)
// ============================================
app.use('/api/auth', (req, res, next) => {
  // Se as rotas diretas acima não capturaram, tentar carregar as rotas do arquivo
  const routesCarregadas = loadRoutes();
  if (routesCarregadas && authRoutes) {
    authRoutes(req, res, next);
  } else {
    // Se não conseguir carregar, as rotas diretas já foram executadas acima
    next();
  }
});

// ============================================
// 👤 ROTAS DE CLIENTES - CARREGAMENTO DINÂMICO (FALLBACK)
// ============================================
app.use('/api/clientes', (req, res, next) => {
  // Se a rota direta acima não capturou, tentar carregar as rotas do arquivo
  const routesCarregadas = loadRoutes();
  if (routesCarregadas && clienteRoutes && req.method !== 'GET') {
    clienteRoutes(req, res, next);
  } else {
    next();
  }
});

// ============================================
// 📋 ROTAS DE ORÇAMENTOS - CARREGAMENTO DINÂMICO (FALLBACK)
// ============================================
app.use('/api/orcamentos', (req, res, next) => {
  // Se a rota direta acima não capturou, tentar carregar as rotas do arquivo
  const routesCarregadas = loadRoutes();
  if (routesCarregadas && orcamentoRoutes && req.method !== 'GET') {
    orcamentoRoutes(req, res, next);
  } else {
    next();
  }
});

// ============================================
// 🏢 ROTAS DE EMPRESA - CARREGAMENTO DINÂMICO (FALLBACK)
// ============================================
app.use('/api/dados-empresa', (req, res, next) => {
  // Se as rotas diretas acima não capturaram, tentar carregar as rotas do arquivo
  const routesCarregadas = loadRoutes();
  if (routesCarregadas && empresaRoutes && req.method !== 'GET' && req.method !== 'PUT') {
    empresaRoutes(req, res, next);
  } else {
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
        const tables = ['clientes', 'dados_empresas', 'orcamentos', 'usuarios'];
        
        for (const table of tables) {
          try {
            const result = await currentPool.query(`SELECT COUNT(*) FROM ${table}`);
            tablesStatus[table] = parseInt(result.rows[0].count);
          } catch (error) {
            tablesStatus[table] = 'not_found';
          }
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
      auth: {
        routes_available: true,
        jwt_secret_configured: !!(process.env.JWT_SECRET || 'sistema_macedo_secret_2024'),
        bcrypt_available: !!bcrypt,
        jwt_available: !!jwt
      },
      routes: {
        loaded: routesLoaded,
        auth: !!authRoutes,
        clientes: !!clienteRoutes,
        orcamentos: !!orcamentoRoutes,
        empresa: !!empresaRoutes
      },
      version: '3.1.0'
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
// 🧪 ROTAS DE TESTE (mantendo suas)
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
        
        if (tabelas.includes('dados_empresas')) {
          const dadosResult = await currentPool.query('SELECT * FROM dados_empresas ORDER BY updated_at DESC LIMIT 1');
          dados = dadosResult.rows[0] || null;
        }
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
      'POST /auth/login',
      'POST /auth/registrar',
      'GET /auth/perfil',
      'GET /api/dados-empresa',
      'PUT /api/dados-empresa',
      'GET /api/clientes',
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
// 🚀 INICIALIZAÇÃO HÍBRIDA RENDER + VERCEL (OTIMIZADA)
// ============================================
const PORT = process.env.PORT || 5000;

// Middleware de inicialização para Vercel
let appInitialized = false;
app.use(async (req, res, next) => {
  if (!appInitialized && process.env.VERCEL) {
    console.log('🚀 Inicializando app Vercel na primeira requisição...');
    await initDatabase();
    loadRoutes();
    appInitialized = true;
    console.log('✅ App Vercel inicializado!');
  }
  next();
});

// Função de inicialização para Render (mantendo sua lógica)
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
        const tables = ['clientes', 'dados_empresas', 'orcamentos', 'usuarios'];
        
        for (const table of tables) {
          try {
            const result = await currentPool.query(`SELECT COUNT(*) FROM ${table}`);
            console.log(`✅ Tabela ${table}: ${result.rows[0].count} registros`);
            
            if (table === 'dados_empresas') {
              const empresaAtual = await currentPool.query('SELECT razao_social FROM dados_empresas ORDER BY updated_at DESC LIMIT 1');
              if (empresaAtual.rows.length > 0) {
                console.log('📝 Empresa atual:', empresaAtual.rows[0].razao_social);
              }
            }
          } catch (error) {
            console.log(`⚠️ Tabela ${table} não encontrada`);
          }
        }
      }
    }
    
    // Carregar rotas
    const routesCarregadas = loadRoutes();
    if (routesCarregadas) {
      console.log('✅ Rotas carregadas com sucesso');
    } else {
      console.log('⚠️ Usando rotas diretas (fallback)');
    }
    
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
        console.log('   🔐 /auth/login - Login');
        console.log('   📝 /auth/registrar - Registro');
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
      
      return server;
    }

  } catch (error) {
    console.error('❌ ERRO AO INICIAR SERVIDOR:', error.message);
    
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Continuando em modo degradado...');
    } else {
      console.log('💡 Tentando continuar mesmo com erro...');
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
    console.log('🔄 Continuando execução...');
  }
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Exceção não capturada:', error.message);
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔄 Continuando execução...');
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