import axios from 'axios';

// ============================================
// 🚀 CONFIGURAÇÃO INTELIGENTE DE API
// ============================================

// Determinar URL base baseada no ambiente e como está sendo acessado
const getBaseURL = () => {
  // Se está em produção, usar variável de ambiente
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  }
  
  // Em desenvolvimento, detectar automaticamente o IP
  const hostname = window.location.hostname;
  
  // Se acessando por IP da rede, usar o mesmo IP para a API
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    console.log('🌐 Detectado acesso via IP da rede:', hostname);
    return `http://${hostname}:5000/api`;
  }
  
  // Se acessando por localhost, usar localhost
  console.log('🏠 Detectado acesso via localhost');
  return 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000, // Aumentado para 15s
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// 🔄 INTERCEPTOR DE REQUEST
// ============================================
api.interceptors.request.use(
  (config) => {
    // Logs organizados e coloridos
    console.log('\n🚀 =================================');
    console.log('📡 FAZENDO REQUISIÇÃO');
    console.log('=================================');
    console.log('🎯 URL Completa:', config.baseURL + config.url);
    console.log('🔧 Método:', config.method?.toUpperCase());
    console.log('🌍 Ambiente:', process.env.NODE_ENV);
    console.log('🔗 Base URL:', config.baseURL);
    console.log('🏠 Hostname Frontend:', window.location.hostname);
    console.log('🌐 Porta Frontend:', window.location.port);
    
    // Mostrar dados se existirem
    if (config.data) {
      console.log('📝 Dados enviados:', config.data);
    }
    
    // Adicionar token se existir
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token encontrado:', token.substring(0, 20) + '...');
    } else {
      console.log('⚠️  Nenhum token encontrado');
    }
    
    console.log('=================================\n');
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
    // Log de sucesso
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
    
    return response;
  },
  (error) => {
    // Log detalhado de erro
    console.log('\n❌ =================================');
    console.log('💥 ERRO NA REQUISIÇÃO');
    console.log('=================================');
    
    if (error.response) {
      // Servidor respondeu com erro
      console.log('📊 Status:', error.response.status);
      console.log('📝 Mensagem:', error.response.data?.message || error.response.data?.erro || error.response.data);
      console.log('🔗 URL:', error.response.config?.url);
      console.log('🌐 Base URL:', error.response.config?.baseURL);
      
      // Casos específicos
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
      // Request foi feito mas não houve resposta
      console.log('📡 ERRO DE CONEXÃO:');
      console.log('- Request enviado mas sem resposta');
      console.log('- Verifique se o backend está rodando');
      console.log('- URL tentada:', error.config?.baseURL);
      console.log('- Hostname atual:', window.location.hostname);
      
      // Sugestões baseadas no hostname
      if (window.location.hostname !== 'localhost') {
        console.log('💡 DICA: Backend deve estar rodando em:', `http://${window.location.hostname}:5000`);
        console.log('💡 COMANDO: cd backend && npm run dev');
      } else {
        console.log('💡 DICA: Backend deve estar rodando em: http://localhost:5000');
      }
      
    } else {
      // Erro na configuração da request
      console.log('⚙️  ERRO DE CONFIGURAÇÃO:', error.message);
    }
    
    console.log('=================================\n');
    
    // Tratar logout automático
    if (error.response?.status === 401) {
      console.log('🔄 Removendo dados de autenticação...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Só redireciona se não estiver na página de login
      if (!window.location.pathname.includes('/login')) {
        console.log('🚪 Redirecionando para login...');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// 🧪 FUNÇÕES DE TESTE E DEBUG
// ============================================

// Testar conexão com backend
export const testApiConnection = async () => {
  try {
    console.log('\n🧪 =================================');
    console.log('🔍 TESTANDO CONEXÃO COM API');
    console.log('=================================');
    console.log('🎯 URL de teste:', api.defaults.baseURL + '/health');
    console.log('🏠 Frontend rodando em:', window.location.origin);
    console.log('🌐 Backend esperado em:', api.defaults.baseURL.replace('/api', ''));
    
    const response = await api.get('/health');
    
    console.log('✅ CONEXÃO SUCCESSFUL!');
    console.log('📊 Status:', response.status);
    console.log('📝 Resposta:', response.data);
    console.log('=================================\n');
    
    return { success: true, data: response.data };
    
  } catch (error) {
    console.log('❌ FALHA NA CONEXÃO!');
    console.log('💥 Erro:', error.message);
    
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error') || error.message.includes('CONNECTION_REFUSED')) {
      const backendUrl = api.defaults.baseURL.replace('/api', '');
      console.log('🔧 SOLUÇÕES POSSÍVEIS:');
      console.log(`   1. Verifique se o backend está rodando em ${backendUrl}`);
      console.log('   2. Execute: cd backend && npm run dev');
      console.log('   3. Verifique se a porta 5000 está disponível');
      console.log('   4. Teste diretamente:', backendUrl + '/api/health');
    }
    
    console.log('=================================\n');
    return { success: false, error: error.message };
  }
};

// Obter informações da configuração atual
export const getApiInfo = () => {
  const info = {
    baseURL: api.defaults.baseURL,
    frontendHostname: window.location.hostname,
    frontendPort: window.location.port,
    frontendOrigin: window.location.origin,
    environment: process.env.NODE_ENV,
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    envVariable: process.env.REACT_APP_API_URL,
    hasToken: !!localStorage.getItem('token'),
    expectedBackendUrl: api.defaults.baseURL.replace('/api', '')
  };
  
  console.log('\n📋 =================================');
  console.log('ℹ️  INFORMAÇÕES DA API');
  console.log('=================================');
  console.log('🔗 Base URL API:', info.baseURL);
  console.log('🏠 Frontend Hostname:', info.frontendHostname);
  console.log('📡 Frontend Origin:', info.frontendOrigin);
  console.log('🎯 Backend Esperado:', info.expectedBackendUrl);
  console.log('🌍 Environment:', info.environment);
  console.log('🏭 É Produção:', info.isProduction);
  console.log('💻 É Desenvolvimento:', info.isDevelopment);
  console.log('🔧 Variável ENV:', info.envVariable || 'Não definida');
  console.log('🔑 Tem Token:', info.hasToken);
  console.log('=================================\n');
  
  return info;
};

// Função para testar autenticação
export const testAuth = async (email = 'admin@sistema.com', senha = 'password') => {
  try {
    console.log('\n🔐 =================================');
    console.log('🧪 TESTANDO AUTENTICAÇÃO');
    console.log('=================================');
    console.log('📧 Email:', email);
    console.log('🔒 Senha:', '*'.repeat(senha.length));
    
    const response = await api.post('/auth/login', { email, senha });
    
    console.log('✅ LOGIN SUCCESSFUL!');
    console.log('🎫 Token recebido:', response.data.token?.substring(0, 20) + '...');
    console.log('👤 Usuário:', response.data.usuario?.nome);
    console.log('=================================\n');
    
    return { success: true, data: response.data };
    
  } catch (error) {
    console.log('❌ FALHA NO LOGIN!');
    console.log('💥 Erro:', error.response?.data?.message || error.message);
    console.log('=================================\n');
    
    return { success: false, error: error.response?.data || error.message };
  }
};

// ============================================
// 🎯 FUNÇÕES UTILITÁRIAS
// ============================================

// Verificar se está em desenvolvimento
export const isDevelopment = () => process.env.NODE_ENV === 'development';

// Verificar se está em produção
export const isProduction = () => process.env.NODE_ENV === 'production';

// Obter URL base atual
export const getCurrentBaseURL = () => api.defaults.baseURL;

// Verificar se backend está acessível
export const checkBackendStatus = async () => {
  try {
    const response = await fetch(api.defaults.baseURL.replace('/api', '') + '/api/health');
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Debug completo do sistema
export const debugSystem = async () => {
  console.log('\n🔍 =================================');
  console.log('🛠️  DEBUG COMPLETO DO SISTEMA');
  console.log('=================================');
  
  // Informações básicas
  getApiInfo();
  
  // Verificar se backend está rodando
  console.log('🔍 Verificando se backend está acessível...');
  const backendOk = await checkBackendStatus();
  console.log('🎯 Backend status:', backendOk ? '✅ Acessível' : '❌ Inacessível');
  
  // Teste de conexão
  const connectionTest = await testApiConnection();
  
  // Se conexão OK, testar auth
  if (connectionTest.success) {
    await testAuth();
  }
  
  console.log('🏁 Debug completo finalizado!\n');
};

// Função para forçar mudança de URL base (para debug)
export const setBaseURL = (newBaseURL) => {
  api.defaults.baseURL = newBaseURL;
  console.log('🔄 Base URL alterada para:', newBaseURL);
};

export default api;