import { login, registrar, getPerfil, logout, isAuthenticated, getCurrentUser } from './api';

// ============================================
// 🔐 SERVIÇO DE AUTENTICAÇÃO HÍBRIDO PERFEITO
// ============================================

const authService = {
  
  // ============================================
  // 🚪 LOGIN (Baseado no seu código)
  // ============================================
  login: async (dados) => {
    try {
      console.log('\n🔐 =================================');
      console.log('🚪 INICIANDO LOGIN');
      console.log('=================================');
      console.log('📧 Email:', dados.email);
      console.log('🔒 Senha:', '*'.repeat(dados.senha?.length || 0));
      console.log('🌐 Plataforma:', window.location.hostname.includes('vercel.app') ? 'VERCEL' : window.location.hostname.includes('onrender.com') ? 'RENDER' : 'LOCAL');
      
      // Validação básica (sua lógica mantida)
      if (!dados.email || !dados.senha) {
        throw new Error('Email e senha são obrigatórios');
      }
      
      // Usar função login da api.js (com rotas dinâmicas)
      const response = await login(dados.email, dados.senha);
      
      // Verificar se recebeu token (sua validação mantida)
      if (!response.token) {
        throw new Error('Token não recebido do servidor');
      }
      
      // Compatibilidade com ambos os formatos de resposta
      const usuario = response.usuario || response.user;
      
      console.log('✅ LOGIN SUCCESSFUL!');
      console.log('👤 Usuário:', usuario.nome);
      console.log('🎫 Tipo:', usuario.tipo);
      console.log('🆔 ID:', usuario.id);
      console.log('=================================\n');
      
      return response;
      
    } catch (error) {
      console.log('\n❌ =================================');
      console.log('💥 ERRO NO LOGIN');
      console.log('=================================');
      
      if (error.response) {
        console.log('📊 Status:', error.response.status);
        console.log('📝 Mensagem:', error.response.data?.message || 'Erro desconhecido');
        
        // Suas mensagens específicas mantidas
        switch (error.response.status) {
          case 401:
            console.log('🚫 Credenciais inválidas');
            break;
          case 404:
            console.log('🔍 Usuário não encontrado ou rota não existe');
            break;
          case 500:
            console.log('🔧 Erro interno do servidor');
            break;
        }
      } else if (error.request) {
        console.log('📡 Erro de conexão - verifique se o backend está rodando');
      } else {
        console.log('⚙️ Erro de configuração:', error.message);
      }
      
      console.log('=================================\n');
      throw error;
    }
  },

  // ============================================
  // 📝 REGISTRO (Baseado no seu código)
  // ============================================
  register: async (dados) => {
    try {
      console.log('\n📝 =================================');
      console.log('✨ INICIANDO REGISTRO');
      console.log('=================================');
      console.log('📧 Email:', dados.email);
      console.log('👤 Nome:', dados.nome);
      console.log('🏢 Tipo:', dados.tipo);
      console.log('🌐 Plataforma:', window.location.hostname.includes('vercel.app') ? 'VERCEL' : window.location.hostname.includes('onrender.com') ? 'RENDER' : 'LOCAL');
      
      // Suas validações básicas mantidas
      const requiredFields = ['nome', 'email', 'senha'];
      const missingFields = requiredFields.filter(field => !dados[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
      }
      
      // Usar função registrar da api.js (com rotas dinâmicas)
      const response = await registrar(dados.nome, dados.email, dados.senha);
      
      console.log('✅ REGISTRO SUCCESSFUL!');
      console.log('🎉 Usuário criado:', response.usuario?.nome || response.user?.nome);
      console.log('=================================\n');
      
      return response;
      
    } catch (error) {
      console.log('\n❌ =================================');
      console.log('💥 ERRO NO REGISTRO');
      console.log('=================================');
      
      if (error.response?.status === 409) {
        console.log('👥 Usuário já existe');
      } else if (error.response?.status === 400) {
        console.log('📝 Dados inválidos');
      }
      
      console.log('📝 Erro:', error.response?.data?.message || error.message);
      console.log('=================================\n');
      
      throw error;
    }
  },

  // ============================================
  // 🚪 LOGOUT (Seu código mantido)
  // ============================================
  logout: () => {
    console.log('\n🚪 =================================');
    console.log('👋 FAZENDO LOGOUT');
    console.log('=================================');
    
    try {
      // Usar função logout da api.js
      logout();
      
      console.log('🧹 Dados locais limpos');
      console.log('🔄 Redirecionando para login...');
      console.log('=================================\n');
      
      // Redirecionar para login (sua lógica mantida)
      window.location.href = '/login';
      
    } catch (error) {
      console.error('❌ Erro durante logout:', error);
      // Mesmo com erro, tenta redirecionar
      window.location.href = '/login';
    }
  },

  // ============================================
  // 🔍 VERIFICAÇÕES DE ESTADO (Suas funções mantidas)
  // ============================================
  
  // Verificar se está autenticado
  isAuthenticated: () => {
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      // Suas verificações básicas mantidas
      if (!token || !user) {
        return false;
      }
      
      // Verificar se o token não expirou (sua lógica mantida)
      if (authService.isTokenExpired(token)) {
        console.log('⏰ Token expirado, fazendo logout automático...');
        authService.logout();
        return false;
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao verificar autenticação:', error);
      return false;
    }
  },

  // Verificar se token expirou (sua função mantida)
  isTokenExpired: (token) => {
    try {
      if (!token) return true;
      
      // Decodificar payload do JWT (sua lógica mantida)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Verificar se expirou
      return payload.exp < currentTime;
      
    } catch (error) {
      console.error('❌ Erro ao verificar expiração do token:', error);
      return true; // Se der erro, considerar expirado
    }
  },

  // Obter usuário atual (sua função mantida)
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('❌ Erro ao obter usuário atual:', error);
      return null;
    }
  },

  // Verificar se é admin (sua função mantida)
  isAdmin: () => {
    try {
      const user = authService.getCurrentUser();
      return user && user.tipo === 'admin';
    } catch (error) {
      console.error('❌ Erro ao verificar se é admin:', error);
      return false;
    }
  },

  // Obter token (sua função mantida)
  getToken: () => {
    try {
      return localStorage.getItem('token');
    } catch (error) {
      console.error('❌ Erro ao obter token:', error);
      return null;
    }
  },

  // ============================================
  // 🛠️ SUAS FUNÇÕES UTILITÁRIAS MANTIDAS
  // ============================================
  
  // Verificar se usuário tem permissão específica
  hasPermission: (requiredType) => {
    try {
      const user = authService.getCurrentUser();
      if (!user) return false;
      
      // Admin tem todas as permissões
      if (user.tipo === 'admin') return true;
      
      // Verificar tipo específico
      return user.tipo === requiredType;
      
    } catch (error) {
      console.error('❌ Erro ao verificar permissão:', error);
      return false;
    }
  },

  // Obter informações do token (sua função mantida)
  getTokenInfo: () => {
    try {
      const token = authService.getToken();
      if (!token) return null;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      return {
        userId: payload.id,
        userType: payload.tipo,
        issuedAt: new Date(payload.iat * 1000),
        expiresAt: new Date(payload.exp * 1000),
        timeToExpire: payload.exp - currentTime,
        isExpired: payload.exp < currentTime
      };
      
    } catch (error) {
      console.error('❌ Erro ao obter informações do token:', error);
      return null;
    }
  },

  // Renovar sessão (sua função com rotas dinâmicas)
  refreshSession: async () => {
    try {
      console.log('🔄 Tentando renovar sessão...');
      
      if (!authService.isAuthenticated()) {
        throw new Error('Usuário não autenticado');
      }
      
      // Usar função getPerfil da api.js (com rotas dinâmicas)
      const response = await getPerfil();
      
      // Atualizar dados do usuário (sua lógica mantida)
      if (response.usuario || response.user) {
        const user = response.usuario || response.user;
        localStorage.setItem('user', JSON.stringify(user));
        console.log('✅ Sessão renovada com sucesso');
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Erro ao renovar sessão:', error);
      authService.logout();
      throw error;
    }
  },

  // Debug da autenticação (sua função mantida)
  debugAuth: () => {
    console.log('\n🔍 =================================');
    console.log('🛠️ DEBUG DA AUTENTICAÇÃO');
    console.log('=================================');
    
    const token = authService.getToken();
    const user = authService.getCurrentUser();
    const tokenInfo = authService.getTokenInfo();
    
    console.log('🔑 Tem Token:', !!token);
    console.log('👤 Tem Usuário:', !!user);
    console.log('✅ Está Autenticado:', authService.isAuthenticated());
    console.log('👑 É Admin:', authService.isAdmin());
    console.log('🌐 Plataforma:', window.location.hostname.includes('vercel.app') ? 'VERCEL' : window.location.hostname.includes('onrender.com') ? 'RENDER' : 'LOCAL');
    
    if (user) {
      console.log('📝 Dados do Usuário:', {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipo
      });
    }
    
    if (tokenInfo) {
      console.log('🎫 Info do Token:', {
        userId: tokenInfo.userId,
        tipo: tokenInfo.userType,
        expira: tokenInfo.expiresAt.toLocaleString(),
        tempoRestante: `${Math.max(0, tokenInfo.timeToExpire)} segundos`,
        expirado: tokenInfo.isExpired
      });
    }
    
    console.log('=================================\n');
    
    return { token: !!token, user, tokenInfo, isAuthenticated: authService.isAuthenticated() };
  }
};

export default authService;