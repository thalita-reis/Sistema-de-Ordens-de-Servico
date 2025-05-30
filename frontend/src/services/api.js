import axios from 'axios';

const api = axios.create({
  // ✅ CORRIGIDO: Porta 5000 e URL do backend deployado
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000, // Timeout para requests longos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token
api.interceptors.request.use(
  (config) => {
    console.log('🌐 Fazendo requisição para:', config.baseURL + config.url);
    console.log('📝 Dados:', config.data);
    console.log('🔧 Environment:', process.env.NODE_ENV);
    console.log('🔗 API URL:', process.env.REACT_APP_API_URL);
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token enviado:', token.substring(0, 20) + '...');
    } else {
      console.log('⚠️ Nenhum token encontrado');
    }
    return config;
  },
  (error) => {
    console.error('💥 Erro no interceptor de request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => {
    console.log('✅ Resposta recebida:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('❌ Erro na requisição:', error);
    
    // Log detalhado para debug
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📝 Data:', error.response.data);
      console.error('🔗 URL:', error.response.config.url);
    } else if (error.request) {
      console.error('📡 Request feito mas sem resposta:', error.request);
    } else {
      console.error('💥 Erro na configuração:', error.message);
    }
    
    // Redirect para login se não autorizado
    if (error.response?.status === 401) {
      console.log('🚪 Token expirado, redirecionando para login...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Só redireciona se não estiver já na página de login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Função para testar a conexão da API
export const testApiConnection = async () => {
  try {
    console.log('🧪 Testando conexão com API...');
    const response = await api.get('/health');
    console.log('✅ API conectada com sucesso!', response.data);
    return true;
  } catch (error) {
    console.error('❌ Falha na conexão com API:', error);
    return false;
  }
};

// Função para obter informações da API
export const getApiInfo = () => {
  const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const environment = process.env.NODE_ENV;
  
  console.log('ℹ️ Informações da API:');
  console.log('🔗 Base URL:', baseURL);
  console.log('🌍 Environment:', environment);
  console.log('🔧 Production:', environment === 'production');
  
  return { baseURL, environment };
};

export default api;