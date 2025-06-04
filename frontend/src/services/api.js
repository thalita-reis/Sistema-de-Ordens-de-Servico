import axios from 'axios';

// ============================================
// 🚀 CONFIGURAÇÃO INTELIGENTE HÍBRIDA ATUALIZADA
// ============================================

const getBaseURL = () => {
  const hostname = window.location.hostname;
  
  // ✅ CORREÇÃO CRÍTICA: SEMPRE usar backend Render
  // Vercel é só frontend, backend sempre no Render
  if (hostname.includes('vercel.app')) {
    console.log('🌟 Ambiente: VERCEL detectado - conectando com backend Render');
    return 'https://sistema-de-ordens-de-servico.onrender.com';
  }
  
  // RENDER: Se estiver no próprio Render
  if (hostname.includes('onrender.com')) {
    console.log('🔥 Ambiente: RENDER detectado - usando backend local');
    return window.location.origin;
  }
  
  // LOCAL: Desenvolvimento
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('🏠 Ambiente: LOCAL detectado');
    return 'http://localhost:5000';
  }
  
  // FALLBACK: Sempre usar Render em produção
  console.log('🌐 Ambiente: PRODUÇÃO - usando backend Render');
  return 'https://sistema-de-ordens-de-servico.onrender.com';
};

const getAuthRoutes = () => {
  const hostname = window.location.hostname;
  
  // ✅ CORREÇÃO: SEMPRE usar rotas do backend Render (/auth/*)
  // Independente da plataforma, o backend está no Render
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
  timeout: 30000, // Timeout maior para produção
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// 🔄 INTERCEPTOR DE REQUEST
// ============================================
api.interceptors.request.use(
  (config) => {
    // Logs detalhados mantidos
    if (process.env.NODE_ENV === 'development') {
      console.log('\n🚀 =================================');
      console.log('📡 FAZENDO REQUISIÇÃO');
      console.log('=================================');
      console.log('🎯 URL Completa:', config.baseURL + config.url);
      console.log('🔧 Método:', config.method?.toUpperCase());
      console.log('🌍 Ambiente:', process.env.NODE_ENV);
      console.log('🔗 Base URL:', config.baseURL);
      console.log('🏠 Hostname Frontend:', window.location.hostname);
      
      if (config.data) {
        console.log('📝 Dados enviados:', config.data);
      }
      console.log('=================================\n');
    }
    
    // Adicionar token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('💥 ERRO NO INTERCEPTOR DE REQUEST:', error);
    return Promise.reject(error);
  }
);

// ============================================
// 📥 INTERCEPTOR DE RESPONSE
// ============================================
api.interceptors.response.use(
  (response) => {
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
    if (process.env.NODE_ENV === 'development') {
      console.log('\n❌ =================================');
      console.log('💥 ERRO NA REQUISIÇÃO');
      console.log('=================================');
      
      if (error.response) {
        console.log('📊 Status:', error.response.status);
        console.log('📝 Mensagem:', error.response.data?.message || error.response.data?.erro || error.response.data);
        console.log('🔗 URL:', error.response.config?.url);
        console.log('🌐 Base URL:', error.response.config?.baseURL);
      } else if (error.request) {
        console.log('📡 ERRO DE CONEXÃO - Backend pode estar dormindo no Render');
        console.log('💡 AGUARDE: Backend está inicializando (até 30s)...');
      } else {
        console.log('⚙️ ERRO DE CONFIGURAÇÃO:', error.message);
      }
      
      console.log('=================================\n');
    }
    
    // Logout automático em caso de 401
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// 🔐 FUNÇÕES DE AUTENTICAÇÃO
// ============================================

export const login = async (email, senha) => {
  try {
    const routes = getAuthRoutes();
    console.log(`🔑 Tentando login com rota: ${routes.login}`);
    console.log(`🎯 URL completa: ${api.defaults.baseURL}${routes.login}`);
    
    // ✅ TENTATIVA MÚLTIPLA - Testar diferentes rotas automaticamente
    const rotasPossíveis = [
      routes.login,     // /auth/login (padrão)
      '/api/auth/login', // Alternativa comum
      '/login',         // Alternativa simples
      '/api/login'      // Outra alternativa
    ];
    
    let ultimoErro = null;
    
    for (const rota of rotasPossíveis) {
      try {
        console.log(`🧪 Testando rota: ${rota}`);
        
        const response = await api.post(rota, { email, senha });
        
        if (response.data.success && response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.usuario || response.data.user));
          console.log(`✅ Login realizado com sucesso usando rota: ${rota}`);
          return response.data;
        }
        
        throw new Error(response.data.message || 'Erro no login');
        
      } catch (error) {
        console.log(`❌ Falha na rota ${rota}:`, error.response?.status || error.message);
        ultimoErro = error;
        
        // Se for erro 404 ou 405, tenta próxima rota
        if (error.response?.status === 404 || error.response?.status === 405) {
          continue;
        }
        
        // Se for outro erro (401, 400, etc.), não tenta outras rotas
        break;
      }
    }
    
    // Se chegou aqui, nenhuma rota funcionou
    throw ultimoErro;
    
  } catch (error) {
    console.error('❌ Erro no login:', error);
    throw error;
  }
};

export const registrar = async (nome, email, senha, tipo = 'admin') => {
  try {
    const routes = getAuthRoutes();
    console.log(`📝 Tentando registro com rota: ${routes.register}`);
    
    // ✅ TENTATIVA MÚLTIPLA - Testar diferentes rotas automaticamente
    const rotasPossíveis = [
      routes.register,      // /auth/registrar (padrão)
      '/api/auth/registrar', // Alternativa comum
      '/registrar',         // Alternativa simples
      '/api/registrar',     // Outra alternativa
      '/register',          // Em inglês
      '/api/register'       // Em inglês com /api
    ];
    
    const dadosRegistro = { nome, email, senha, tipo };
    let ultimoErro = null;
    
    for (const rota of rotasPossíveis) {
      try {
        console.log(`🧪 Testando rota de registro: ${rota}`);
        
        const response = await api.post(rota, dadosRegistro);
        
        if (response.data.success) {
          console.log(`✅ Usuário registrado com sucesso usando rota: ${rota}`);
          return response.data;
        }
        
        throw new Error(response.data.message || 'Erro no registro');
        
      } catch (error) {
        console.log(`❌ Falha na rota ${rota}:`, error.response?.status || error.message);
        ultimoErro = error;
        
        // Se for erro 404 ou 405, tenta próxima rota
        if (error.response?.status === 404 || error.response?.status === 405) {
          continue;
        }
        
        // Se for outro erro, não tenta outras rotas
        break;
      }
    }
    
    // Se chegou aqui, nenhuma rota funcionou
    throw ultimoErro;
    
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
  return !!localStorage.getItem('token');
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// ============================================
// 🧪 FUNÇÕES DE TESTE E DEBUG
// ============================================

export const testApiConnection = async () => {
  try {
    console.log('\n🧪 TESTANDO CONEXÃO COM API...');
    console.log('🎯 URL de teste:', api.defaults.baseURL + '/api/health');
    
    const response = await api.get('/api/health');
    
    console.log('✅ CONEXÃO SUCCESSFUL!');
    console.log('📊 Status:', response.status);
    console.log('📝 Resposta:', response.data);
    
    return { success: true, data: response.data };
    
  } catch (error) {
    console.log('❌ FALHA NA CONEXÃO!');
    console.log('💥 Erro:', error.message);
    
    if (error.code === 'ERR_NETWORK') {
      console.log('🔧 DICA: Backend pode estar "dormindo" no Render');
      console.log('   Aguarde até 30s para o backend acordar automaticamente');
    }
    
    return { success: false, error: error.message };
  }
};

// ============================================
// 👥 FUNÇÕES DE CLIENTES - CORRIGIDAS PARA ESTRUTURA REAL
// ============================================

export const getClientes = async (page = 1, limit = 10, search = '') => {
  try {
    console.log(`👥 Buscando clientes... (página ${page}, limite ${limit}, busca: "${search}")`);
    
    const response = await api.get('/api/clientes', {
      params: { page, limit, search }
    });
    
    console.log('✅ Resposta recebida do backend:', response.data);
    
    // ✅ NORMALIZAÇÃO ROBUSTA PARA QUALQUER FORMATO DE RESPOSTA
    const clientesData = response.data.data || response.data.clientes || [];
    const total = response.data.pagination?.total || response.data.total || 0;
    const currentPage = response.data.pagination?.page || response.data.page || page;
    const totalPages = response.data.pagination?.totalPages || response.data.pages || Math.ceil(total / limit);
    
    // Normalizar cada cliente para compatibilidade total
    const clientesNormalizados = clientesData.map(cliente => ({
      // ✅ CAMPOS DA ESTRUTURA REAL DA TABELA
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
    
    console.log(`✅ ${clientesNormalizados.length} clientes normalizados com sucesso`);
    
    return {
      success: true,
      data: clientesNormalizados,
      clientes: clientesNormalizados,
      total: total,
      page: currentPage,
      totalPages: totalPages,
      pagination: {
        currentPage: currentPage,
        totalPages: totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1
      }
    };
    
  } catch (error) {
    console.error('❌ Erro ao buscar clientes:', error);
    
    // ✅ FALLBACK ROBUSTO - NUNCA QUEBRAR A APLICAÇÃO
    return { 
      success: false,
      data: [],
      clientes: [], 
      total: 0, 
      page: 1,
      totalPages: 0,
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: limit,
        hasNextPage: false,
        hasPrevPage: false
      },
      message: 'Erro ao carregar clientes. Verifique sua conexão.',
      error: error.response?.data?.message || error.message
    };
  }
};

export const getClienteById = async (id) => {
  try {
    console.log(`👤 Buscando cliente ID: ${id}`);
    
    const response = await api.get(`/api/clientes/${id}`);
    
    const cliente = response.data.data || response.data.cliente || response.data;
    
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
      success: true,
      data: clienteNormalizado,
      cliente: clienteNormalizado
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
      email: clienteData.email || '',
      
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
    
    console.log('📤 Dados sendo enviados para o backend:', dadosParaBackend);
    
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
    const clientesEncontrados = response.clientes?.filter(cliente => 
      cliente.cpf && cliente.cpf.replace(/\D/g, '') === cpf.replace(/\D/g, '')
    ) || [];
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
// 📋 FUNÇÕES DE ORÇAMENTOS
// ============================================

export const getOrcamentos = async (page = 1, limit = 10, search = '') => {
  try {
    console.log(`📄 Buscando orçamentos... (página ${page}, limite ${limit})`);
    
    const response = await api.get('/api/orcamentos', {
      params: { page, limit, search }
    });
    
    console.log(`✅ ${response.data.data?.length || response.data.orcamentos?.length || 0} orçamentos encontrados`);
    
    // Normalizar resposta
    return {
      ...response.data,
      success: true,
      orcamentos: response.data.data || response.data.orcamentos || [],
      data: response.data.data || response.data.orcamentos || []
    };
    
  } catch (error) {
    console.error('❌ Erro ao buscar orçamentos:', error);
    return { 
      success: false,
      orcamentos: [], 
      data: [],
      total: 0, 
      pages: 0,
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
// 🏢 FUNÇÕES DE DADOS DA EMPRESA
// ============================================

export const getDadosEmpresa = async () => {
  try {
    console.log('🏢 Buscando dados da empresa...');
    
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
// 🛡️ FUNÇÕES DE SAÚDE E UTILITÁRIAS
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

export const getApiInfo = () => {
  const info = {
    baseURL: api.defaults.baseURL,
    frontendHostname: window.location.hostname,
    frontendOrigin: window.location.origin,
    environment: process.env.NODE_ENV || 'production',
    platform: window.location.hostname.includes('vercel.app') ? 'vercel' : 
              window.location.hostname.includes('onrender.com') ? 'render' : 'local',
    hasToken: !!localStorage.getItem('token'),
    authRoutes: getAuthRoutes()
  };
  
  console.log('\n📋 INFORMAÇÕES DA API:');
  console.log('🔗 Base URL API:', info.baseURL);
  console.log('🏠 Frontend:', info.frontendOrigin);
  console.log('🚀 Plataforma:', info.platform);
  console.log('🔑 Tem Token:', info.hasToken);
  
  return info;
};

export const checkBackendStatus = async () => {
  try {
    const healthUrl = api.defaults.baseURL + '/api/health';
    const response = await fetch(healthUrl);
    return response.ok;
  } catch (error) {
    return false;
  }
};

export const testAuth = async (email = 'admin@sistema.com', senha = 'password') => {
  try {
    console.log('\n🔐 TESTANDO AUTENTICAÇÃO');
    console.log('📧 Email:', email);
    console.log('🔒 Senha:', '*'.repeat(senha.length));
    
    const response = await login(email, senha);
    
    console.log('✅ LOGIN SUCCESSFUL!');
    console.log('🎫 Token recebido:', response.token?.substring(0, 20) + '...');
    console.log('👤 Usuário:', response.usuario?.nome || response.user?.nome);
    
    return { success: true, data: response };
    
  } catch (error) {
    console.log('❌ FALHA NO LOGIN!');
    console.log('💥 Erro:', error.response?.data?.message || error.message);
    
    return { success: false, error: error.response?.data || error.message };
  }
};

export const debugSystem = async () => {
  console.log('\n🔍 DEBUG COMPLETO DO SISTEMA');
  console.log('=================================');
  
  const apiInfo = getApiInfo();
  
  console.log('🔍 Verificando se backend está acessível...');
  const backendOk = await checkBackendStatus();
  console.log('🎯 Backend status:', backendOk ? '✅ Acessível' : '❌ Inacessível');
  
  const connectionTest = await testApiConnection();
  console.log('🔌 Conexão:', connectionTest.success ? '✅ OK' : '❌ FALHOU');
  
  if (connectionTest.success) {
    try {
      const clientesTest = await getClientes(1, 1, '');
      console.log('👥 Clientes:', clientesTest.success ? '✅ OK' : '❌ FALHOU');
    } catch (error) {
      console.log('👥 Clientes: ❌ FALHOU');
    }
  }
  
  console.log('=================================\n');
  
  return {
    ...apiInfo,
    conexao: connectionTest.success,
    backendStatus: backendOk
  };
};

// ============================================
// 🔧 FUNÇÕES AUXILIARES
// ============================================

export const isDevelopment = () => process.env.NODE_ENV === 'development';
export const isProduction = () => process.env.NODE_ENV === 'production';
export const getCurrentBaseURL = () => api.defaults.baseURL;

export const setBaseURL = (newBaseURL) => {
  api.defaults.baseURL = newBaseURL;
  console.log('🔄 Base URL alterada para:', newBaseURL);
};

export default api;