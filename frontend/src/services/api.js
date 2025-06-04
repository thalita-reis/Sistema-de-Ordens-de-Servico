import axios from 'axios';

// ============================================
// 🚀 CONFIGURAÇÃO INTELIGENTE HÍBRIDA
// ============================================

const getBaseURL = () => {
  const hostname = window.location.hostname;
  
  // VERCEL: Detecta domínio .vercel.app
  if (hostname.includes('vercel.app')) {
    console.log('🌟 Ambiente: VERCEL detectado - usando rotas serverless');
    return window.location.origin; // https://seu-projeto.vercel.app (SEM /api no final)
  }
  
  // RENDER: Detecta domínio .onrender.com  
  if (hostname.includes('onrender.com')) {
    console.log('🔥 Ambiente: RENDER detectado - usando backend dedicado');
    return 'https://sistema-de-ordens-de-servico.onrender.com';
  }
  
  // LOCAL: Detecta localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('🏠 Ambiente: LOCAL detectado');
    return 'http://localhost:5000';
  }
  
  // REDE LOCAL: IP da rede
  console.log('🌐 Ambiente: REDE LOCAL detectada:', hostname);
  return `http://${hostname}:5000`;
};

const getAuthRoutes = () => {
  const hostname = window.location.hostname;
  
  // VERCEL: Precisa de /api/auth/*
  if (hostname.includes('vercel.app')) {
    return {
      login: '/api/auth/login',
      register: '/api/auth/registrar',
      profile: '/api/auth/perfil'
    };
  }
  
  // OUTROS: Usar /auth/* (seu padrão atual)
  return {
    login: '/auth/login',
    register: '/auth/registrar', 
    profile: '/auth/perfil'
  };
};

// ============================================
// 🔧 CONFIGURAÇÃO DO AXIOS
// ============================================

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: window.location.hostname.includes('vercel.app') ? 30000 : 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// 🔄 INTERCEPTOR DE REQUEST (Baseado no seu código)
// ============================================
api.interceptors.request.use(
  (config) => {
    // Seus logs detalhados mantidos
    if (process.env.NODE_ENV === 'development') {
      console.log('\n🚀 =================================');
      console.log('📡 FAZENDO REQUISIÇÃO');
      console.log('=================================');
      console.log('🎯 URL Completa:', config.baseURL + config.url);
      console.log('🔧 Método:', config.method?.toUpperCase());
      console.log('🌍 Ambiente:', process.env.NODE_ENV);
      console.log('🔗 Base URL:', config.baseURL);
      console.log('🏠 Hostname Frontend:', window.location.hostname);
      console.log('🌐 Porta Frontend:', window.location.port);
      
      if (config.data) {
        console.log('📝 Dados enviados:', config.data);
      }
      console.log('=================================\n');
    }
    
    // Adicionar token (sua lógica mantida)
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      if (process.env.NODE_ENV === 'development') {
        console.log('🔑 Token encontrado:', token.substring(0, 20) + '...');
      }
    }
    
    return config;
  },
  (error) => {
    console.error('💥 ERRO NO INTERCEPTOR DE REQUEST:', error);
    return Promise.reject(error);
  }
);

// ============================================
// 📥 INTERCEPTOR DE RESPONSE (Seu código aprimorado)
// ============================================
api.interceptors.response.use(
  (response) => {
    // Seus logs de sucesso mantidos
    if (process.env.NODE_ENV === 'development') {
      console.log('\n✅ =================================');
      console.log('📨 RESPOSTA RECEBIDA');
      console.log('=================================');
      console.log('🎯 Status:', response.status);
      console.log('🔗 URL:', response.config.url);
      console.log('📊 Dados recebidos:', typeof response.data === 'object' ? 'Object' : response.data);
      if (response.data?.data && Array.isArray(response.data.data)) {
        console.log('📋 Itens retornados:', response.data.data.length);
      }
      console.log('=================================\n');
    }
    
    return response;
  },
  (error) => {
    // Seus logs de erro detalhados mantidos
    if (process.env.NODE_ENV === 'development') {
      console.log('\n❌ =================================');
      console.log('💥 ERRO NA REQUISIÇÃO');
      console.log('=================================');
      
      if (error.response) {
        console.log('📊 Status:', error.response.status);
        console.log('📝 Mensagem:', error.response.data?.message || error.response.data?.erro || error.response.data);
        console.log('🔗 URL:', error.response.config?.url);
        console.log('🌐 Base URL:', error.response.config?.baseURL);
        
        switch (error.response.status) {
          case 401:
            console.log('🚪 Token expirado ou inválido');
            break;
          case 403:
            console.log('🚫 Acesso negado');
            break;
          case 404:
            console.log('🔍 Endpoint não encontrado');
            break;
          case 500:
            console.log('🔧 Erro interno do servidor');
            break;
          default:
            console.log('❓ Erro desconhecido');
        }
        
      } else if (error.request) {
        console.log('📡 ERRO DE CONEXÃO:');
        console.log('- Request enviado mas sem resposta');
        console.log('- Verifique se o backend está rodando');
        console.log('- URL tentada:', error.config?.baseURL);
        console.log('- Hostname atual:', window.location.hostname);
        
        if (window.location.hostname !== 'localhost') {
          console.log('💡 DICA: Backend deve estar rodando em:', `http://${window.location.hostname}:5000`);
          console.log('💡 COMANDO: cd backend && npm run dev');
        } else {
          console.log('💡 DICA: Backend deve estar rodando em: http://localhost:5000');
        }
        
      } else {
        console.log('⚙️ ERRO DE CONFIGURAÇÃO:', error.message);
      }
      
      console.log('=================================\n');
    }
    
    // Logout automático (sua lógica mantida)
    if (error.response?.status === 401) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Removendo dados de autenticação...');
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      if (!window.location.pathname.includes('/login')) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🚪 Redirecionando para login...');
        }
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// 🔐 FUNÇÕES DE AUTENTICAÇÃO COM ROTAS DINÂMICAS
// ============================================

export const login = async (email, senha) => {
  try {
    const routes = getAuthRoutes();
    console.log(`🔑 Tentando login com rota: ${routes.login}`);
    
    const response = await api.post(routes.login, { email, senha });
    
    if (response.data.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.usuario || response.data.user));
      console.log('✅ Login realizado com sucesso!');
      return response.data;
    }
    
    throw new Error(response.data.message || 'Erro no login');
  } catch (error) {
    console.error('❌ Erro no login:', error);
    throw error;
  }
};

export const registrar = async (nome, email, senha) => {
  try {
    const routes = getAuthRoutes();
    console.log(`📝 Tentando registro com rota: ${routes.register}`);
    
    const response = await api.post(routes.register, { nome, email, senha });
    
    if (response.data.success) {
      console.log('✅ Usuário registrado com sucesso!');
      return response.data;
    }
    
    throw new Error(response.data.message || 'Erro no registro');
  } catch (error) {
    console.error('❌ Erro no registro:', error);
    throw error;
  }
};

export const getPerfil = async () => {
  try {
    const routes = getAuthRoutes();
    const response = await api.get(routes.profile);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar perfil:', error);
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  console.log('🚪 Logout realizado');
};

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// ============================================
// 🧪 SUAS FUNÇÕES DE TESTE MANTIDAS
// ============================================

export const testApiConnection = async () => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('\n🧪 =================================');
      console.log('🔍 TESTANDO CONEXÃO COM API');
      console.log('=================================');
      const healthUrl = api.defaults.baseURL + (window.location.hostname.includes('vercel.app') ? '/api/health' : '/api/health');
      console.log('🎯 URL de teste:', healthUrl);
      console.log('🏠 Frontend rodando em:', window.location.origin);
      console.log('🌐 Backend esperado em:', api.defaults.baseURL);
    }
    
    const healthEndpoint = window.location.hostname.includes('vercel.app') ? '/api/health' : '/api/health';
    const response = await api.get(healthEndpoint);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ CONEXÃO SUCCESSFUL!');
      console.log('📊 Status:', response.status);
      console.log('📝 Resposta:', response.data);
      console.log('=================================\n');
    }
    
    return { success: true, data: response.data };
    
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ FALHA NA CONEXÃO!');
      console.log('💥 Erro:', error.message);
      
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error') || error.message.includes('CONNECTION_REFUSED')) {
        const backendUrl = api.defaults.baseURL;
        console.log('🔧 SOLUÇÕES POSSÍVEIS:');
        console.log(`   1. Verifique se o backend está rodando em ${backendUrl}`);
        console.log('   2. Execute: cd backend && npm run dev');
        console.log('   3. Verifique se a porta 5000 está disponível');
        console.log('   4. Teste diretamente:', backendUrl + '/api/health');
      }
      
      console.log('=================================\n');
    }
    return { success: false, error: error.message };
  }
};

export const getApiInfo = () => {
  const info = {
    baseURL: api.defaults.baseURL,
    frontendHostname: window.location.hostname,
    frontendPort: window.location.port,
    frontendOrigin: window.location.origin,
    environment: process.env.NODE_ENV,
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    platform: window.location.hostname.includes('vercel.app') ? 'vercel' : window.location.hostname.includes('onrender.com') ? 'render' : 'local',
    hasToken: !!localStorage.getItem('token'),
    authRoutes: getAuthRoutes()
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.log('\n📋 =================================');
    console.log('ℹ️ INFORMAÇÕES DA API');
    console.log('=================================');
    console.log('🔗 Base URL API:', info.baseURL);
    console.log('🏠 Frontend Hostname:', info.frontendHostname);
    console.log('📡 Frontend Origin:', info.frontendOrigin);
    console.log('🌍 Environment:', info.environment);
    console.log('🚀 Plataforma:', info.platform);
    console.log('🔑 Tem Token:', info.hasToken);
    console.log('🛣️ Rotas Auth:', info.authRoutes);
    console.log('=================================\n');
  }
  
  return info;
};

export const testAuth = async (email = 'admin@sistema.com', senha = 'password') => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('\n🔐 =================================');
      console.log('🧪 TESTANDO AUTENTICAÇÃO');
      console.log('=================================');
      console.log('📧 Email:', email);
      console.log('🔒 Senha:', '*'.repeat(senha.length));
    }
    
    const response = await login(email, senha);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ LOGIN SUCCESSFUL!');
      console.log('🎫 Token recebido:', response.token?.substring(0, 20) + '...');
      console.log('👤 Usuário:', response.usuario?.nome || response.user?.nome);
      console.log('=================================\n');
    }
    
    return { success: true, data: response };
    
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ FALHA NO LOGIN!');
      console.log('💥 Erro:', error.response?.data?.message || error.message);
      console.log('=================================\n');
    }
    
    return { success: false, error: error.response?.data || error.message };
  }
};

// ============================================
// 👥 FUNÇÕES DE CLIENTES - ATUALIZADAS PARA ESTRUTURA REAL
// ============================================

export const getClientes = async (page = 1, limit = 10, search = '') => {
  try {
    console.log(`👥 Buscando clientes... (página ${page}, limite ${limit})`);
    
    const response = await api.get('/api/clientes', {
      params: { page, limit, search }
    });
    
    console.log(`✅ ${response.data.clientes?.length || response.data.data?.length || 0} clientes encontrados`);
    
    // ✅ NORMALIZAÇÃO PARA COMPATIBILIDADE
    const clientesData = response.data.clientes || response.data.data || [];
    const clientesNormalizados = clientesData.map(cliente => ({
      // Campos da estrutura real da tabela
      id: cliente.id,
      nome: cliente.nome || '',
      cpf: cliente.cpf || '',
      data_inclusao: cliente.data_inclusao,
      telefone: cliente.telefone || '',
      celular: cliente.celular || '',
      fax: cliente.fax || '',
      rua: cliente.rua || '',
      numero: cliente.numero || '',
      cep: cliente.cep || '',
      bairro: cliente.bairro || '',
      cidade: cliente.cidade || '',
      uf: cliente.uf || '',
      email: cliente.email || '',
      pessoa_juridica: cliente.pessoa_juridica || false,
      observacoes_gerais: cliente.observacoes_gerais || '',
      ficha_inativa: cliente.ficha_inativa || false,
      created_at: cliente.created_at,
      updated_at: cliente.updated_at,
      complemento: cliente.complemento || '',
      empresa_id: cliente.empresa_id,
      ativo: cliente.ativo !== false,
      
      // ✅ CAMPOS DE COMPATIBILIDADE (para componentes que esperam nomes antigos)
      endereco: cliente.endereco || cliente.rua || '',  // Mapear rua → endereco
      estado: cliente.estado || cliente.uf || ''        // Mapear uf → estado
    }));
    
    return {
      ...response.data,
      clientes: clientesNormalizados,
      data: clientesNormalizados,
      success: true
    };
    
  } catch (error) {
    console.error('❌ Erro ao buscar clientes:', error);
    // Fallback robusto para evitar quebrar a aplicação
    return { 
      clientes: [], 
      data: [],
      total: 0, 
      pages: 0,
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: limit,
        hasNextPage: false,
        hasPrevPage: false
      },
      success: false,
      message: 'Erro ao carregar clientes',
      error: error.response?.data?.message || error.message
    };
  }
};

export const getClienteById = async (id) => {
  try {
    console.log(`👤 Buscando cliente ID: ${id}`);
    
    const response = await api.get(`/api/clientes/${id}`);
    
    const cliente = response.data.cliente || response.data.data || response.data;
    
    // ✅ NORMALIZAÇÃO PARA COMPATIBILIDADE
    const clienteNormalizado = {
      // Campos da estrutura real
      id: cliente.id,
      nome: cliente.nome || '',
      cpf: cliente.cpf || '',
      data_inclusao: cliente.data_inclusao,
      telefone: cliente.telefone || '',
      celular: cliente.celular || '',
      fax: cliente.fax || '',
      rua: cliente.rua || '',
      numero: cliente.numero || '',
      cep: cliente.cep || '',
      bairro: cliente.bairro || '',
      cidade: cliente.cidade || '',
      uf: cliente.uf || '',
      email: cliente.email || '',
      pessoa_juridica: cliente.pessoa_juridica || false,
      observacoes_gerais: cliente.observacoes_gerais || '',
      ficha_inativa: cliente.ficha_inativa || false,
      created_at: cliente.created_at,
      updated_at: cliente.updated_at,
      complemento: cliente.complemento || '',
      empresa_id: cliente.empresa_id,
      ativo: cliente.ativo !== false,
      
      // ✅ CAMPOS DE COMPATIBILIDADE
      endereco: cliente.endereco || cliente.rua || '',
      estado: cliente.estado || cliente.uf || ''
    };
    
    console.log(`✅ Cliente encontrado: ${clienteNormalizado.nome}`);
    
    return {
      ...response.data,
      cliente: clienteNormalizado,
      data: clienteNormalizado
    };
    
  } catch (error) {
    console.error('❌ Erro ao buscar cliente:', error);
    throw error;
  }
};

export const createCliente = async (clienteData) => {
  try {
    console.log('👤 Criando novo cliente:', clienteData.nome);
    
    // ✅ MAPEAR DADOS PARA ESTRUTURA REAL DA TABELA
    const dadosParaBackend = {
      // Campos obrigatórios
      nome: clienteData.nome,
      email: clienteData.email,
      
      // Campos opcionais - mapear corretamente
      cpf: clienteData.cpf || null,
      telefone: clienteData.telefone || null,
      celular: clienteData.celular || null,
      fax: clienteData.fax || null,
      
      // ✅ ENDERECO: Aceitar tanto 'rua' quanto 'endereco'
      rua: clienteData.rua || clienteData.endereco || null,
      numero: clienteData.numero || null,
      cep: clienteData.cep || null,
      bairro: clienteData.bairro || null,
      cidade: clienteData.cidade || null,
      
      // ✅ ESTADO: Aceitar tanto 'uf' quanto 'estado'
      uf: clienteData.uf || clienteData.estado || null,
      
      // Campos específicos da tabela
      pessoa_juridica: clienteData.pessoa_juridica || false,
      observacoes_gerais: clienteData.observacoes_gerais || null,
      ficha_inativa: clienteData.ficha_inativa || false,
      complemento: clienteData.complemento || null,
      empresa_id: clienteData.empresa_id || null,
      ativo: clienteData.ativo !== false // Default true
    };
    
    const response = await api.post('/api/clientes', dadosParaBackend);
    
    console.log('✅ Cliente criado com sucesso!');
    return response.data;
    
  } catch (error) {
    console.error('❌ Erro ao criar cliente:', error);
    throw error;
  }
};

export const updateCliente = async (id, clienteData) => {
  try {
    console.log(`✏️ Atualizando cliente ID: ${id}`);
    
    // ✅ MAPEAR DADOS PARA ESTRUTURA REAL DA TABELA
    const dadosParaBackend = {
      nome: clienteData.nome,
      email: clienteData.email,
      cpf: clienteData.cpf,
      telefone: clienteData.telefone,
      celular: clienteData.celular,
      fax: clienteData.fax,
      
      // ✅ ENDERECO: Aceitar tanto 'rua' quanto 'endereco'
      rua: clienteData.rua || clienteData.endereco,
      numero: clienteData.numero,
      cep: clienteData.cep,
      bairro: clienteData.bairro,
      cidade: clienteData.cidade,
      
      // ✅ ESTADO: Aceitar tanto 'uf' quanto 'estado' 
      uf: clienteData.uf || clienteData.estado,
      
      pessoa_juridica: clienteData.pessoa_juridica,
      observacoes_gerais: clienteData.observacoes_gerais,
      ficha_inativa: clienteData.ficha_inativa,
      complemento: clienteData.complemento,
      empresa_id: clienteData.empresa_id,
      ativo: clienteData.ativo
    };
    
    const response = await api.put(`/api/clientes/${id}`, dadosParaBackend);
    
    console.log('✅ Cliente atualizado com sucesso!');
    return response.data;
    
  } catch (error) {
    console.error('❌ Erro ao atualizar cliente:', error);
    throw error;
  }
};

export const deleteCliente = async (id) => {
  try {
    console.log(`🗑️ Deletando cliente ID: ${id}`);
    
    const response = await api.delete(`/api/clientes/${id}`);
    
    console.log('✅ Cliente deletado com sucesso!');
    return response.data;
    
  } catch (error) {
    console.error('❌ Erro ao deletar cliente:', error);
    throw error;
  }
};

// ============================================
// 🔍 FUNÇÕES EXTRAS PARA CLIENTES
// ============================================

export const buscarClientesPorCPF = async (cpf) => {
  try {
    const response = await getClientes(1, 100, cpf);
    const clientesEncontrados = response.clientes.filter(cliente => 
      cliente.cpf && cliente.cpf.replace(/\D/g, '') === cpf.replace(/\D/g, '')
    );
    return clientesEncontrados;
  } catch (error) {
    console.error('❌ Erro ao buscar clientes por CPF:', error);
    return [];
  }
};

export const buscarTodosClientes = async () => {
  try {
    const response = await getClientes(1, 1000, '');
    return response.clientes || [];
  } catch (error) {
    console.error('❌ Erro ao buscar todos os clientes:', error);
    return [];
  }
};

export const validarCpfUnico = async (cpf, clienteIdExcluir = null) => {
  try {
    const clientesEncontrados = await buscarClientesPorCPF(cpf);
    const clientesComMesmoCpf = clientesEncontrados.filter(cliente => 
      clienteIdExcluir ? cliente.id !== clienteIdExcluir : true
    );
    return clientesComMesmoCpf.length === 0;
  } catch (error) {
    console.error('❌ Erro ao validar CPF único:', error);
    return true; // Em caso de erro, permitir (fallback)
  }
};

// ============================================
// 📋 FUNÇÕES DE ORÇAMENTOS - COMPLETAS (mantidas iguais)
// ============================================

export const getOrcamentos = async (page = 1, limit = 10, search = '') => {
  try {
    console.log(`📄 Buscando orçamentos... (página ${page}, limite ${limit})`);
    
    const response = await api.get('/api/orcamentos', {
      params: { page, limit, search }
    });
    
    console.log(`✅ ${response.data.orcamentos?.length || response.data.data?.length || 0} orçamentos encontrados`);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar orçamentos:', error);
    // Fallback para evitar quebrar a aplicação
    return { 
      orcamentos: [], 
      data: [],
      total: 0, 
      pages: 0,
      success: false,
      message: 'Erro ao carregar orçamentos'
    };
  }
};

export const getOrcamentoById = async (id) => {
  try {
    const response = await api.get(`/api/orcamentos/${id}`);
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar orçamento:', error);
    throw error;
  }
};

export const createOrcamento = async (orcamento) => {
  try {
    const response = await api.post('/api/orcamentos', orcamento);
    console.log('✅ Orçamento criado com sucesso!');
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao criar orçamento:', error);
    throw error;
  }
};

export const updateOrcamento = async (id, orcamento) => {
  try {
    const response = await api.put(`/api/orcamentos/${id}`, orcamento);
    console.log('✅ Orçamento atualizado com sucesso!');
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao atualizar orçamento:', error);
    throw error;
  }
};

export const deleteOrcamento = async (id) => {
  try {
    const response = await api.delete(`/api/orcamentos/${id}`);
    console.log('✅ Orçamento deletado com sucesso!');
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao deletar orçamento:', error);
    throw error;
  }
};

// ============================================
// 🏢 FUNÇÕES DE DADOS DA EMPRESA - COMPLETAS (mantidas iguais)
// ============================================

export const getDadosEmpresa = async () => {
  try {
    console.log('🏢 Buscando dados da empresa...');
    
    // Adicionar timestamp para evitar cache
    const timestamp = Date.now();
    const response = await api.get(`/api/dados-empresa?t=${timestamp}`);
    
    console.log('✅ Dados da empresa carregados com sucesso');
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar dados da empresa:', error);
    // Fallback com dados padrão
    return {
      nome: 'Empresa Padrão',
      endereco: 'Endereço não configurado',
      telefone: '(00) 0000-0000',
      email: 'contato@empresa.com',
      cnpj: '00.000.000/0001-00',
      success: false,
      message: 'Dados da empresa não disponíveis'
    };
  }
};

export const salvarDadosEmpresa = async (dados) => {
  try {
    console.log('💾 Salvando dados da empresa...');
    
    const response = await api.put('/api/dados-empresa', dados);
    
    console.log('✅ Dados da empresa salvos com sucesso!');
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao salvar dados da empresa:', error);
    throw error;
  }
};

// ============================================
// 📊 FUNÇÕES DE DASHBOARD E ESTATÍSTICAS
// ============================================

export const getDashboardStats = async () => {
  try {
    const response = await api.get('/api/dashboard/stats');
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    // Fallback com dados vazios
    return {
      totalClientes: 0,
      totalOrcamentos: 0,
      orcamentosAbertos: 0,
      orcamentosFechados: 0,
      valorTotal: 0
    };
  }
};

// ============================================
// 🛡️ FUNÇÕES DE SAÚDE E STATUS DA API
// ============================================

export const getHealthStatus = async () => {
  try {
    const response = await api.get('/api/health');
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao verificar saúde da API:', error);
    return { status: 'error', message: error.message };
  }
};

// ============================================
// 🎯 SUAS FUNÇÕES UTILITÁRIAS MANTIDAS
// ============================================

export const isDevelopment = () => process.env.NODE_ENV === 'development';
export const isProduction = () => process.env.NODE_ENV === 'production';
export const getCurrentBaseURL = () => api.defaults.baseURL;

export const checkBackendStatus = async () => {
  try {
    const healthUrl = api.defaults.baseURL + (window.location.hostname.includes('vercel.app') ? '/api/health' : '/api/health');
    const response = await fetch(healthUrl);
    return response.ok;
  } catch (error) {
    return false;
  }
};

export const debugSystem = async () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('\n🔍 =================================');
    console.log('🛠️ DEBUG COMPLETO DO SISTEMA');
    console.log('=================================');
    
    getApiInfo();
    
    console.log('🔍 Verificando se backend está acessível...');
    const backendOk = await checkBackendStatus();
    console.log('🎯 Backend status:', backendOk ? '✅ Acessível' : '❌ Inacessível');
    
    const connectionTest = await testApiConnection();
    
    if (connectionTest.success) {
      await testAuth();
    }
    
    console.log('🏁 Debug completo finalizado!\n');
  }
};

export const setBaseURL = (newBaseURL) => {
  api.defaults.baseURL = newBaseURL;
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Base URL alterada para:', newBaseURL);
  }
};

export default api;