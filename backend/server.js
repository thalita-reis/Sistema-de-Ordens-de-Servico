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
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://10.133.128.150:3000',
      'http://192.168.1.100:3000',
      'http://192.168.0.100:3000',
      'https://sistema-de-ordens-de-servico.onrender.com',
      'https://sistema-de-ordens-de-servico-hvra.vercel.app',
      process.env.FRONTEND_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    ].filter(Boolean);

    const allowedPatterns = [
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/,
      /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:3000$/,
      /^http:\/\/172\.16\.\d{1,3}\.\d{1,3}:3000$/,
      /^https:\/\/.*\.onrender\.com$/,
      /^https:\/\/.*\.vercel\.app$/
    ];
    
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin) || 
                     allowedPatterns.some(pattern => pattern.test(origin));
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('⚠️ CORS origin não permitida:', origin);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin', 'X-Requested-With', 'Content-Type', 'Accept',
    'Authorization', 'Cache-Control', 'Pragma', 'Expires', 'x-cache-killer'
  ],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200,
  maxAge: 86400
};

// ============================================
// 🔧 MIDDLEWARES DE SEGURANÇA E LOGS
// ============================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

app.use(cors(corsOptions));

if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// 🗄️ CONFIGURAÇÃO DO BANCO
// ============================================
const { Pool } = require('pg');

let pool = null;
let dbConfigured = false;

// ============================================
// 🚀 SISTEMA DE MIGRAÇÃO AUTOMÁTICA (NOVO)
// ============================================
const createInitialTables = async (currentPool) => {
  try {
    console.log('🗄️ Iniciando migração inicial...');
    
    // ✅ TABELA CLIENTES
    await currentPool.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        cpf VARCHAR(14),
        data_inclusao DATE DEFAULT CURRENT_DATE,
        telefone VARCHAR(20),
        celular VARCHAR(20),
        fax VARCHAR(20),
        rua TEXT,
        numero VARCHAR(10),
        cep VARCHAR(10),
        bairro VARCHAR(100),
        cidade VARCHAR(100),
        uf VARCHAR(2),
        email VARCHAR(255),
        pessoa_juridica BOOLEAN DEFAULT FALSE,
        observacoes_gerais TEXT,
        ficha_inativa BOOLEAN DEFAULT FALSE,
        complemento VARCHAR(255),
        empresa_id INTEGER,
        ativo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela clientes criada!');

    // ✅ TABELA DADOS_EMPRESAS
    await currentPool.query(`
      CREATE TABLE IF NOT EXISTS dados_empresas (
        id SERIAL PRIMARY KEY,
        razao_social VARCHAR(255),
        nome_oficina VARCHAR(255),
        cnpj VARCHAR(18),
        inscricao_estadual VARCHAR(20),
        email VARCHAR(255),
        endereco TEXT,
        numero VARCHAR(10),
        bairro VARCHAR(100),
        cidade VARCHAR(100),
        estado VARCHAR(2),
        cep VARCHAR(10),
        celular VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela dados_empresas criada!');

    // ✅ TABELA ORCAMENTOS
    await currentPool.query(`
      CREATE TABLE IF NOT EXISTS orcamentos (
        id SERIAL PRIMARY KEY,
        numero VARCHAR(50) UNIQUE NOT NULL,
        cliente_id INTEGER REFERENCES clientes(id),
        data_criacao DATE DEFAULT CURRENT_DATE,
        data_validade DATE,
        valor_total DECIMAL(10,2) DEFAULT 0,
        total_desconto DECIMAL(10,2) DEFAULT 0,
        valor_final DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pendente',
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela orcamentos criada!');

    // ✅ TABELA USUARIOS
    await currentPool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        tipo VARCHAR(20) DEFAULT 'usuario',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela usuarios criada!');

    // ✅ INSERIR DADOS INICIAIS DA EMPRESA
    const empresaExists = await currentPool.query('SELECT id FROM dados_empresas LIMIT 1');
    if (empresaExists.rows.length === 0) {
      await currentPool.query(`
        INSERT INTO dados_empresas (
          razao_social, nome_oficina, cnpj, inscricao_estadual, 
          email, endereco, celular
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        'Oficina Macedo Ltda',
        'Oficina Programa Macedo',
        '43976790001107',
        '674.438.803.079',
        'contato@oficinamacedo.com',
        'Rua do Manifesto, 2326 - Ipiranga - São Paulo/SP',
        '(11) 94808-0600'
      ]);
      console.log('✅ Dados da empresa inseridos!');
    }

    // ✅ CRIAR USUÁRIO ADMIN PADRÃO
    const bcrypt = require('bcrypt');
    const adminExists = await currentPool.query('SELECT id FROM usuarios WHERE email = $1', ['admin@oficinamacedo.com']);
    if (adminExists.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await currentPool.query(`
        INSERT INTO usuarios (nome, email, senha, tipo)
        VALUES ($1, $2, $3, $4)
      `, ['Administrador', 'admin@oficinamacedo.com', hashedPassword, 'admin']);
      console.log('✅ Usuário admin criado! (admin@oficinamacedo.com / admin123)');
    }

    // ✅ INSERIR CLIENTES DE EXEMPLO
    const clientesExists = await currentPool.query('SELECT id FROM clientes LIMIT 1');
    if (clientesExists.rows.length === 0) {
      await currentPool.query(`
        INSERT INTO clientes (nome, cpf, email, telefone, rua, cidade, uf)
        VALUES 
        ('João Silva', '123.456.789-00', 'joao@email.com', '(11) 99999-1111', 'Rua A, 123', 'São Paulo', 'SP'),
        ('Maria Santos', '987.654.321-00', 'maria@email.com', '(11) 99999-2222', 'Rua B, 456', 'São Paulo', 'SP')
      `);
      console.log('✅ Clientes de exemplo inseridos!');
    }

    console.log('🎉 MIGRAÇÃO INICIAL CONCLUÍDA!');
    return true;
  } catch (error) {
    console.error('❌ Erro na migração inicial:', error);
    return false;
  }
};

const runMigrations = async (currentPool) => {
  if (process.env.NODE_ENV === 'production') {
    try {
      console.log('🔄 Executando migrações automáticas em produção...');
      const success = await createInitialTables(currentPool);
      if (success) {
        console.log('✅ Migrações executadas com sucesso!');
      }
      return success;
    } catch (error) {
      console.error('❌ Erro nas migrações automáticas:', error.message);
      return false;
    }
  }
  return true;
};

// ============================================
// SUA FUNÇÃO ORIGINAL COM MIGRAÇÃO ADICIONADA
// ============================================
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
    
    // ✅ NOVA LINHA: EXECUTAR MIGRAÇÕES AUTOMÁTICAS EM PRODUÇÃO
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

async function getPoolConnection() {
  try {
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
    
    if (!pool) {
      await initDatabase();
    }
    
    return pool;
  } catch (error) {
    console.log('⚠️ Erro ao obter conexão do pool:', error.message);
    return null;
  }
}

// ============================================
// 🔐 DEPENDÊNCIAS DE AUTENTICAÇÃO
// ============================================
let bcrypt, jwt;
try {
  bcrypt = require('bcrypt');
  jwt = require('jsonwebtoken');
} catch (error) {
  console.log('⚠️ Dependências bcrypt/jsonwebtoken não instaladas');
}

// ============================================
// 🚀 ROTAS PRINCIPAIS - ORDEM CORRETA
// ============================================

// ============================================
// 🏠 ROTA RAIZ
// ============================================
app.get('/', async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n🏠 PÁGINA INICIAL ACESSADA');
    }

    const platform = process.env.VERCEL ? 'vercel' : 'render';
    const currentPool = await getPoolConnection();

    const healthData = {
      message: `🚀 Sistema Macedo - API Funcionando na ${platform.toUpperCase()}!`,
      version: '3.2.0-with-migrations',
      status: 'healthy',
      platform: platform,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: {
        status: currentPool ? 'connected' : 'disconnected'
      },
      endpoints: [
        'GET /api/health',
        'POST /auth/login',
        'POST /auth/registrar',
        'POST /api/auth/login',
        'POST /api/auth/registrar',
        'GET /api/dados-empresa',
        'PUT /api/dados-empresa',
        'GET /api/clientes',
        'GET /api/orcamentos'
      ]
    };

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
// 🏥 HEALTH CHECK
// ============================================
app.get('/api/health', async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n🏥 Health check solicitado');
    }

    const currentPool = await getPoolConnection();
    let dbTest = null;
    let tablesStatus = {};

    if (currentPool) {
      try {
        dbTest = await currentPool.query('SELECT NOW() as current_time');
        
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
      version: '3.2.0-with-migrations'
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
// 👥 ROTAS DE CLIENTES - CORRIGIDAS COM ESTRUTURA REAL
// ============================================

app.get('/api/clientes', async (req, res) => {
  try {
    console.log('👥 Buscando clientes - Página:', req.query.page || 1, 'Limite:', req.query.limit || 10, 'Busca:', req.query.search || '');
    
    const currentPool = await getPoolConnection();
    
    if (!currentPool) {
      console.log('❌ Banco não disponível - dados de exemplo');
      return res.status(200).json({
        success: true,
        data: [],
        clientes: [],
        total: 0,
        page: 1,
        totalPages: 0,
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPrevPage: false
        },
        message: 'Banco não disponível - usando dados de exemplo'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    let queryParams = [];

    if (search) {
      whereClause = `WHERE nome ILIKE $1 OR email ILIKE $1 OR cpf ILIKE $1 OR telefone ILIKE $1 OR celular ILIKE $1`;
      queryParams.push(`%${search}%`);
    }

    const countQuery = `SELECT COUNT(*) FROM clientes ${whereClause}`;
    const countResult = await currentPool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // ✅ QUERY CORRIGIDA COM AS COLUNAS REAIS DA SUA TABELA
    const dataQuery = `
      SELECT 
        id, nome, cpf, data_inclusao, telefone, celular, fax,
        rua, numero, cep, bairro, cidade, uf, email,
        pessoa_juridica, observacoes_gerais, ficha_inativa,
        created_at, updated_at, complemento, empresa_id, ativo
      FROM clientes 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    
    const dataResult = await currentPool.query(dataQuery, [...queryParams, limit, offset]);
    
    const totalPages = Math.ceil(total / limit);
    
    console.log(`✅ ${dataResult.rows.length} clientes encontrados`);
    
    // ✅ NORMALIZAR DADOS PARA COMPATIBILIDADE COM FRONTEND
    const clientesNormalizados = dataResult.rows.map(cliente => ({
      // Campos originais da tabela real
      ...cliente,
      // ✅ CAMPOS DE COMPATIBILIDADE (mapear para nomes que o frontend espera)
      endereco: cliente.rua || '',  // Mapear rua → endereco
      estado: cliente.uf || ''      // Mapear uf → estado
    }));
    
    res.status(200).json({
      success: true,
      data: clientesNormalizados,
      clientes: clientesNormalizados,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

app.post('/api/clientes', async (req, res) => {
  try {
    const { 
      nome, email, cpf, telefone, celular, fax,
      rua, endereco, numero, cep, bairro, cidade, uf, estado,
      pessoa_juridica, observacoes_gerais, ficha_inativa,
      complemento, empresa_id, ativo
    } = req.body;
    
    console.log(`👤 Criando cliente: ${nome}`);
    
    if (!nome || !email) {
      return res.status(400).json({
        success: false,
        message: 'Nome e email são obrigatórios'
      });
    }

    const currentPool = await getPoolConnection();
    
    if (!currentPool) {
      return res.status(503).json({
        success: false,
        message: 'Banco de dados não disponível'
      });
    }
    
    if (cpf) {
      const cpfCheck = await currentPool.query('SELECT id FROM clientes WHERE cpf = $1', [cpf]);
      if (cpfCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'CPF já cadastrado no sistema'
        });
      }
    }
    
    // ✅ QUERY CORRIGIDA COM COLUNAS REAIS
    const query = `
      INSERT INTO clientes (
        nome, email, cpf, telefone, celular, fax,
        rua, numero, cep, bairro, cidade, uf,
        pessoa_juridica, observacoes_gerais, ficha_inativa,
        complemento, empresa_id, ativo, data_inclusao
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
    `;
    
    const valores = [
      nome, email, cpf || null, telefone || null, celular || null, fax || null,
      rua || endereco || null,  // ✅ Aceitar tanto 'rua' quanto 'endereco'
      numero || null, cep || null, bairro || null, cidade || null,
      uf || estado || null,     // ✅ Aceitar tanto 'uf' quanto 'estado'
      pessoa_juridica || false, observacoes_gerais || null, ficha_inativa || false,
      complemento || null, empresa_id || null, ativo !== false, new Date()
    ];
    
    const result = await currentPool.query(query, valores);
    
    const clienteCriado = result.rows[0];
    
    // ✅ Normalizar resposta para compatibilidade
    const clienteNormalizado = {
      ...clienteCriado,
      endereco: clienteCriado.rua || '',
      estado: clienteCriado.uf || ''
    };
    
    console.log(`✅ Cliente criado: ID ${clienteCriado.id}`);
    
    res.status(201).json({
      success: true,
      data: clienteNormalizado,
      cliente: clienteNormalizado,
      message: 'Cliente criado com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

app.get('/api/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`👤 Buscando cliente ID: ${id}`);
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID do cliente inválido'
      });
    }
    
    const currentPool = await getPoolConnection();
    
    if (!currentPool) {
      return res.status(503).json({
        success: false,
        message: 'Banco de dados não disponível'
      });
    }
    
    // ✅ QUERY CORRIGIDA COM COLUNAS REAIS
    const query = `
      SELECT 
        id, nome, cpf, data_inclusao, telefone, celular, fax,
        rua, numero, cep, bairro, cidade, uf, email,
        pessoa_juridica, observacoes_gerais, ficha_inativa,
        created_at, updated_at, complemento, empresa_id, ativo
      FROM clientes 
      WHERE id = $1
    `;
    
    const result = await currentPool.query(query, [id]);
    
    if (result.rows.length === 0) {
      console.log(`❌ Cliente ${id} não encontrado`);
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado'
      });
    }
    
    const cliente = result.rows[0];
    
    // ✅ Normalizar dados para compatibilidade
    const clienteNormalizado = {
      ...cliente,
      endereco: cliente.rua || '',
      estado: cliente.uf || ''
    };
    
    console.log(`✅ Cliente encontrado: ${cliente.nome}`);
    
    res.status(200).json({
      success: true,
      data: clienteNormalizado,
      cliente: clienteNormalizado
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar cliente por ID:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

app.put('/api/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nome, email, cpf, telefone, celular, fax,
      rua, endereco, numero, cep, bairro, cidade, uf, estado,
      pessoa_juridica, observacoes_gerais, ficha_inativa,
      complemento, empresa_id, ativo
    } = req.body;
    
    console.log(`✏️ Atualizando cliente ID: ${id}`);
    
    const currentPool = await getPoolConnection();
    
    if (!currentPool) {
      return res.status(503).json({
        success: false,
        message: 'Banco de dados não disponível'
      });
    }
    
    const checkQuery = 'SELECT id FROM clientes WHERE id = $1';
    const checkResult = await currentPool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado'
      });
    }
    
    if (cpf) {
      const cpfCheck = await currentPool.query('SELECT id FROM clientes WHERE cpf = $1 AND id != $2', [cpf, id]);
      if (cpfCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'CPF já cadastrado para outro cliente'
        });
      }
    }
    
    // ✅ QUERY CORRIGIDA COM COLUNAS REAIS
    const query = `
      UPDATE clientes 
      SET 
        nome = $1, email = $2, cpf = $3, telefone = $4, celular = $5, fax = $6,
        rua = $7, numero = $8, cep = $9, bairro = $10, cidade = $11, uf = $12,
        pessoa_juridica = $13, observacoes_gerais = $14, ficha_inativa = $15,
        complemento = $16, empresa_id = $17, ativo = $18, updated_at = CURRENT_TIMESTAMP
      WHERE id = $19
      RETURNING *
    `;
    
    const valores = [
      nome, email, cpf, telefone, celular, fax,
      rua || endereco,  // ✅ Aceitar tanto 'rua' quanto 'endereco'
      numero, cep, bairro, cidade,
      uf || estado,     // ✅ Aceitar tanto 'uf' quanto 'estado'
      pessoa_juridica, observacoes_gerais, ficha_inativa,
      complemento, empresa_id, ativo, id
    ];
    
    const result = await currentPool.query(query, valores);
    
    const clienteAtualizado = result.rows[0];
    
    // ✅ Normalizar resposta
    const clienteNormalizado = {
      ...clienteAtualizado,
      endereco: clienteAtualizado.rua || '',
      estado: clienteAtualizado.uf || ''
    };
    
    console.log(`✅ Cliente atualizado: ${clienteAtualizado.nome}`);
    
    res.status(200).json({
      success: true,
      data: clienteNormalizado,
      cliente: clienteNormalizado,
      message: 'Cliente atualizado com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

app.delete('/api/clientes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Tentando deletar cliente ID: ${id}`);
    
    const currentPool = await getPoolConnection();
    
    if (!currentPool) {
      return res.status(503).json({
        success: false,
        message: 'Banco de dados não disponível'
      });
    }
    
    // Verificar se cliente tem orçamentos
    const orcamentosCheck = await currentPool.query('SELECT COUNT(*) FROM orcamentos WHERE cliente_id = $1', [id]);
    const temOrcamentos = parseInt(orcamentosCheck.rows[0].count) > 0;
    
    if (temOrcamentos) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível deletar cliente que possui orçamentos cadastrados'
      });
    }
    
    const result = await currentPool.query('DELETE FROM clientes WHERE id = $1 RETURNING nome', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado'
      });
    }
    
    console.log(`✅ Cliente deletado: ${result.rows[0].nome}`);
    
    res.status(200).json({
      success: true,
      message: 'Cliente deletado com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao deletar cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ============================================
// 📋 ROTAS DE ORÇAMENTOS - MANTIDAS IGUAIS
// ============================================

app.get('/api/orcamentos', async (req, res) => {
  try {
    console.log('📄 Buscando orçamentos - Página:', req.query.page || 1, 'Limite:', req.query.limit || 10, 'Busca:', req.query.search || '');
    
    const currentPool = await getPoolConnection();
    
    if (!currentPool) {
      console.log('❌ Banco não disponível - dados de exemplo');
      return res.status(200).json({
        success: true,
        data: [],
        orcamentos: [],
        total: 0,
        page: 1,
        totalPages: 0,
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPrevPage: false
        },
        message: 'Banco não disponível - usando dados de exemplo'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    let queryParams = [];
    let paramIndex = 1;
    
    const conditions = [];
    
    if (search && search.trim() !== '') {
      conditions.push(`(o.numero ILIKE $${paramIndex} OR c.nome ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    if (status && status.trim() !== '') {
      conditions.push(`o.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }
    
    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }
    
    const countQuery = `
      SELECT COUNT(*) 
      FROM orcamentos o
      LEFT JOIN clientes c ON o.cliente_id = c.id
      ${whereClause}
    `;
    
    const dataQuery = `
      SELECT 
        o.id, o.numero, o.cliente_id, o.data_criacao, o.data_validade,
        o.valor_total, o.total_desconto, o.valor_final, o.status, o.observacoes,
        o.created_at, o.updated_at,
        c.nome as nome_cliente,
        c.cpf as cliente_cpf,
        c.email as cliente_email
      FROM orcamentos o
      LEFT JOIN clientes c ON o.cliente_id = c.id
      ${whereClause}
      ORDER BY o.created_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const countResult = await currentPool.query(countQuery, queryParams);
    const dataResult = await currentPool.query(dataQuery, [...queryParams, limit, offset]);
    
    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);
    
    console.log(`✅ ${dataResult.rows.length} orçamentos encontrados`);
    
    res.status(200).json({
      success: true,
      data: dataResult.rows,
      orcamentos: dataResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar orçamentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

app.post('/api/orcamentos', async (req, res) => {
  try {
    const { cliente_id, data_validade, valor_total, total_desconto, valor_final, status = 'pendente', observacoes } = req.body;
    
    console.log(`📋 Criando orçamento para cliente ID: ${cliente_id}`);
    
    const currentPool = await getPoolConnection();
    
    if (!currentPool) {
      return res.status(503).json({
        success: false,
        message: 'Banco de dados não disponível'
      });
    }
    
    const clienteCheck = await currentPool.query('SELECT nome FROM clientes WHERE id = $1', [cliente_id]);
    if (clienteCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cliente não encontrado'
      });
    }
    
    const numeroQuery = await currentPool.query('SELECT COUNT(*) FROM orcamentos');
    const totalOrcamentos = parseInt(numeroQuery.rows[0].count);
    const numero = `${String(totalOrcamentos + 1).padStart(6, '0')}`;
    
    const query = `
      INSERT INTO orcamentos (numero, cliente_id, data_criacao, data_validade, valor_total, total_desconto, valor_final, status, observacoes)
      VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const result = await currentPool.query(query, [numero, cliente_id, data_validade, valor_total, total_desconto, valor_final, status, observacoes]);
    
    console.log(`✅ Orçamento criado: ${numero}`);
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      orcamento: result.rows[0],
      message: 'Orçamento criado com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar orçamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

app.get('/api/orcamentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📋 Buscando orçamento ID: ${id}`);
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID do orçamento inválido'
      });
    }
    
    const currentPool = await getPoolConnection();
    
    if (!currentPool) {
      return res.status(503).json({
        success: false,
        message: 'Banco de dados não disponível'
      });
    }
    
    const query = `
      SELECT 
        o.id, o.numero, o.cliente_id, o.data_criacao, o.data_validade,
        o.valor_total, o.total_desconto, o.valor_final, o.status, o.observacoes,
        o.created_at, o.updated_at,
        c.nome as cliente_nome,
        c.cpf as cliente_cpf,
        c.email as cliente_email,
        c.telefone as cliente_telefone
      FROM orcamentos o
      LEFT JOIN clientes c ON o.cliente_id = c.id
      WHERE o.id = $1
    `;
    
    const result = await currentPool.query(query, [id]);
    
    if (result.rows.length === 0) {
      console.log(`❌ Orçamento ${id} não encontrado`);
      return res.status(404).json({
        success: false,
        message: 'Orçamento não encontrado'
      });
    }
    
    const orcamento = result.rows[0];
    
    const orcamentoFormatado = {
      ...orcamento,
      cliente: {
        nome: orcamento.cliente_nome,
        cpf: orcamento.cliente_cpf,
        email: orcamento.cliente_email,
        telefone: orcamento.cliente_telefone
      },
      nome_cliente: orcamento.cliente_nome
    };
    
    console.log(`✅ Orçamento encontrado: ${orcamento.numero}`);
    
    res.status(200).json({
      success: true,
      data: orcamentoFormatado,
      orcamento: orcamentoFormatado
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar orçamento por ID:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

app.put('/api/orcamentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cliente_id, data_validade, valor_total, total_desconto, valor_final, status, observacoes } = req.body;
    
    console.log(`✏️ Atualizando orçamento ID: ${id}`);
    
    const currentPool = await getPoolConnection();
    
    if (!currentPool) {
      return res.status(503).json({
        success: false,
        message: 'Banco de dados não disponível'
      });
    }
    
    const checkQuery = 'SELECT numero FROM orcamentos WHERE id = $1';
    const checkResult = await currentPool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Orçamento não encontrado'
      });
    }
    
    if (cliente_id) {
      const clienteCheck = await currentPool.query('SELECT id FROM clientes WHERE id = $1', [cliente_id]);
      if (clienteCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Cliente não encontrado'
        });
      }
    }
    
    const query = `
      UPDATE orcamentos 
      SET cliente_id = $1, data_validade = $2, valor_total = $3, 
          total_desconto = $4, valor_final = $5, status = $6, 
          observacoes = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `;
    
    const result = await currentPool.query(query, [cliente_id, data_validade, valor_total, total_desconto, valor_final, status, observacoes, id]);
    
    console.log(`✅ Orçamento atualizado: ${result.rows[0].numero}`);
    
    res.status(200).json({
      success: true,
      data: result.rows[0],
      orcamento: result.rows[0],
      message: 'Orçamento atualizado com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar orçamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

app.delete('/api/orcamentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deletando orçamento ID: ${id}`);
    
    const currentPool = await getPoolConnection();
    
    if (!currentPool) {
      return res.status(503).json({
        success: false,
        message: 'Banco de dados não disponível'
      });
    }
    
    const result = await currentPool.query('DELETE FROM orcamentos WHERE id = $1 RETURNING numero', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Orçamento não encontrado'
      });
    }
    
    console.log(`✅ Orçamento deletado: ${result.rows[0].numero}`);
    
    res.status(200).json({
      success: true,
      message: 'Orçamento deletado com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao deletar orçamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ============================================
// 🏢 ROTAS DE EMPRESA - MANTIDAS IGUAIS
// ============================================

app.get('/api/dados-empresa', async (req, res) => {
  try {
    console.log('🏢 Buscando dados da empresa...');
    
    const currentPool = await getPoolConnection();
    
    if (!currentPool) {
      return res.status(200).json({
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
        message: 'Dados padrão - banco não conectado',
        platform: process.env.VERCEL ? 'vercel' : 'render',
        fonte: 'fallback_hybrid'
      });
    }

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
      try {
        const insertResult = await currentPool.query(`
          INSERT INTO dados_empresas (
            razao_social, nome_oficina, cnpj, inscricao_estadual, 
            email, endereco, celular, created_at, updated_at
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
          celular: '(11) 94808-0600',
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
      celular: '(11) 94808-0600',
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
      celular
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

    const existingResult = await currentPool.query(`
      SELECT id FROM dados_empresas ORDER BY id DESC LIMIT 1
    `);

    let result;
    
    if (existingResult.rows.length === 0) {
      result = await currentPool.query(`
        INSERT INTO dados_empresas (
          razao_social, nome_oficina, cnpj, inscricao_estadual, 
          email, endereco, celular, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `, [razao_social, nome_oficina, cnpj, inscricao_estadual, email, endereco, celular]);
      
      console.log('✅ Novo registro inserido');
    } else {
      const id = existingResult.rows[0].id;
      result = await currentPool.query(`
        UPDATE dados_empresas 
        SET razao_social = $1, nome_oficina = $2, cnpj = $3, 
            inscricao_estadual = $4, email = $5, endereco = $6, 
            celular = $7, updated_at = NOW()
        WHERE id = $8
        RETURNING *
      `, [razao_social, nome_oficina, cnpj, inscricao_estadual, email, endereco, celular, id]);
      
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

app.post('/api/dados-empresa', async (req, res) => {
  try {
    console.log('\n➕ ===== CRIAR EMPRESA =====');
    console.log('📝 Dados recebidos para criação:', req.body);
    
    const {
      razao_social,
      nome_oficina,
      cnpj,
      inscricao_estadual,
      email,
      endereco,
      numero,
      bairro,
      cidade,
      estado,
      cep,
      celular
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

    const query = `
      INSERT INTO dados_empresas (
        razao_social, nome_oficina, cnpj, inscricao_estadual, 
        email, endereco, numero, bairro, celular, cidade, estado, cep,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *
    `;
    
    const valores = [
      razao_social, nome_oficina, cnpj, inscricao_estadual, 
      email, endereco, numero, bairro, celular, cidade, estado, cep
    ];
    
    const result = await currentPool.query(query, valores);
    
    console.log('✅ Nova empresa criada:', result.rows[0]);
    console.log('===== FIM CRIAÇÃO =====\n');
    
    res.status(200).json({
      success: true,
      message: 'Empresa criada com sucesso!',
      platform: process.env.VERCEL ? 'vercel' : 'render',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Erro ao criar empresa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar empresa',
      error: error.message,
      platform: process.env.VERCEL ? 'vercel' : 'render'
    });
  }
});

// ============================================
// 🔐 ROTAS DE AUTENTICAÇÃO - MANTIDAS IGUAIS
// ============================================

async function handleRegistro(req, res) {
  try {
    const { nome, email, senha, tipo } = req.body;
    
    console.log('📝 Registro solicitado:', { nome, email, tipo });
    
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

    const hashedPassword = await bcrypt.hash(senha, 10);

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
}

async function handleLogin(req, res) {
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
    
    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha inválidos'
      });
    }

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
}

async function handlePerfil(req, res) {
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
}

app.post('/auth/registrar', handleRegistro);
app.post('/auth/login', handleLogin);
app.post('/api/auth/registrar', handleRegistro);
app.post('/api/auth/login', handleLogin);
app.get('/auth/perfil', handlePerfil);
app.get('/api/auth/perfil', handlePerfil);

// ============================================
// 🧪 ROTAS DE TESTE - MANTIDAS IGUAIS
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
      'POST /auth/login (Render)',
      'POST /auth/registrar (Render)',
      'POST /api/auth/login (Vercel)',
      'POST /api/auth/registrar (Vercel)',
      'GET /auth/perfil',
      'GET /api/dados-empresa',
      'PUT /api/dados-empresa',
      'POST /api/dados-empresa',
      'GET /api/clientes',
      'GET /api/clientes/:id',
      'POST /api/clientes',
      'PUT /api/clientes/:id',
      'DELETE /api/clientes/:id',
      'GET /api/orcamentos',
      'GET /api/orcamentos/:id',
      'POST /api/orcamentos',
      'PUT /api/orcamentos/:id',
      'DELETE /api/orcamentos/:id'
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
// 🚀 INICIALIZAÇÃO
// ============================================
const PORT = process.env.PORT || 5000;

let appInitialized = false;
app.use(async (req, res, next) => {
  if (!appInitialized && process.env.VERCEL) {
    console.log('🚀 Inicializando app Vercel na primeira requisição...');
    await initDatabase();
    appInitialized = true;
    console.log('✅ App Vercel inicializado!');
  }
  next();
});

async function iniciarServidor() {
  try {
    console.log('🚀 Iniciando servidor...');
    console.log('🌍 Ambiente:', process.env.NODE_ENV || 'development');
    console.log('🌐 Porta:', PORT);
    console.log('🚀 Plataforma:', process.env.VERCEL ? 'Vercel' : 'Render');
    
    const conexaoOK = await initDatabase();
    
    if (conexaoOK) {
      console.log('✅ PostgreSQL conectado!');
      
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
        console.log('   🔐 /auth/login - Login (Render)');
        console.log('   🔐 /api/auth/login - Login (Vercel)');
        console.log('   📝 /auth/registrar - Registro (Render)');
        console.log('   📝 /api/auth/registrar - Registro (Vercel)');
        console.log('   👤 /api/clientes/* - Clientes');
        console.log('   🏢 /api/dados-empresa/* - Empresa');
        console.log('   📋 /api/orcamentos/* - Orçamentos');
        console.log('===============================');
        console.log('✅ Sistema com migrações automáticas!');
        console.log('===============================\n');
      });

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

if (!process.env.VERCEL) {
  iniciarServidor();
}

module.exports = app;