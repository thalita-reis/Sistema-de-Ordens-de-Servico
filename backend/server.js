require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');

const app = express();

// CORS configurado para produção
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL,
        'https://seu-sistema.vercel.app', // Substitua pelo seu domínio
        'https://sistema-macedo.vercel.app' // Exemplo
      ]
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Para permitir uploads e arquivos estáticos
  crossOriginEmbedderPolicy: false
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Limite para uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Morgan com configuração para produção
app.use(process.env.NODE_ENV === 'production' ? morgan('combined') : morgan('dev'));

// Importar rotas
const authRoutes = require('./src/routes/authRoutes');
const clienteRoutes = require('./src/routes/clienteRoutes');
const orcamentoRoutes = require('./src/routes/orcamentoRoutes');
const dadosEmpresaRoutes = require('./src/routes/dadosEmpresaRoutes');

// Usar rotas
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/orcamentos', orcamentoRoutes);
app.use('/api/dados-empresa', dadosEmpresaRoutes);

// Servir arquivos estáticos (IMPORTANTE: Render não persiste arquivos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rota de teste melhorada
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor funcionando!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Rota raiz para verificação
app.get('/', (req, res) => {
  res.json({
    message: 'API Sistema Macedo - Funcionando!',
    endpoints: [
      '/api/health',
      '/api/auth',
      '/api/clientes',
      '/api/orcamentos',
      '/api/dados-empresa'
    ]
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.originalUrl 
  });
});

// Error handling melhorado
app.use((err, req, res, next) => {
  console.error('Erro capturado:', err.stack);
  
  // Log detalhado em desenvolvimento
  if (process.env.NODE_ENV !== 'production') {
    console.error('Detalhes do erro:', err);
  }
  
  res.status(err.status || 500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

// Inicializar banco de dados e servidor
const db = require('./src/models');

// Função para inicializar o servidor
const initializeServer = async () => {
  try {
    // Testar conexão com banco
    await db.sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida');
    
    // Sincronizar modelos (CUIDADO em produção!)
    const syncOptions = process.env.NODE_ENV === 'production' 
      ? { alter: false } // Não alterar estrutura em produção
      : { alter: true };
    
    await db.sequelize.sync(syncOptions);
    console.log('✅ Banco de dados sincronizado');
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 Health check: ${process.env.NODE_ENV === 'production' ? 'https://seu-app.onrender.com' : `http://localhost:${PORT}`}/api/health`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
};

// Inicializar
initializeServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Recebido SIGTERM, fechando servidor graciosamente...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 Recebido SIGINT, fechando servidor graciosamente...');
  process.exit(0);
});