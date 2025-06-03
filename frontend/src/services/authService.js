import api from './api';

// ============================================
// 🔐 SERVIÇO DE AUTENTICAÇÃO APRIMORADO
// ============================================

const authService = {
  
  // ============================================
  // 🚪 LOGIN
  // ============================================
  login: async (dados) => {
    try {
      console.log('\n🔐 =================================');
      console.log('🚪 INICIANDO LOGIN');
      console.log('=================================');
      console.log('📧 Email:', dados.email);
      console.log('🔒 Senha:', '*'.repeat(dados.senha?.length || 0));
      
      // Validação básica
      if (!dados.email || !dados.senha) {
        throw new Error('Email e senha são obrigatórios');
      }
      
      const response = await api.post('/auth/login', dados);
      
      // Verificar se recebeu token
      if (!response.data?.token) {
        throw new Error('Token não recebido do servidor');
      }
      
      // Salvar dados do usuário
      const { token, usuario } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(usuario));
      
      console.log('✅ LOGIN SUCCESSFUL!');
      console.log('👤 Usuário:', usuario.nome);
      console.log('🎫 Tipo:', usuario.tipo);
      console.log('🆔 ID:', usuario.id);
      console.log('=================================\n');
      
      return response.data;
      
    } catch (error) {
      console.log('\n❌ =================================');
      console.log('💥 ERRO NO LOGIN');
      console.log('=================================');
      
      if (error.response) {
        console.log('📊 Status:', error.response.status);
        console.log('📝 Mensagem:', error.response.data?.message || 'Erro desconhecido');
        
        // Mensagens específicas por tipo de erro
        switch (error.response.status) {
          case 401:
            console.log('🚫 Credenciais inválidas');
            break;
          case 404:
            console.log('🔍 Usuário não encontrado');
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
  // 📝 REGISTRO
  // ============================================
  register: async (dados) => {
    try {
      console.log('\n📝 =================================');
      console.log('✨ INICIANDO REGISTRO');
      console.log('=================================');
      console.log('📧 Email:', dados.email);
      console.log('👤 Nome:', dados.nome);
      console.log('🏢 Tipo:', dados.tipo);
      
      // Validações básicas
      const requiredFields = ['nome', 'email', 'senha'];
      const missingFields = requiredFields.filter(field => !dados[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
      }
      
      const response = await api.post('/auth/registrar', dados);
      
      console.log('✅ REGISTRO SUCCESSFUL!');
      console.log('🎉 Usuário criado:', response.data.usuario?.nome);
      console.log('=================================\n');
      
      return response.data;
      
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
  // 🚪 LOGOUT
  // ============================================
  logout: () => {
    console.log('\n🚪 =================================');
    console.log('👋 FAZENDO LOGOUT');
    console.log('=================================');
    
    try {
      // Limpar dados locais
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      console.log('🧹 Dados locais limpos');
      console.log('🔄 Redirecionando para login...');
      console.log('=================================\n');
      
      // Redirecionar para login
      window.location.href = '/login';
      
    } catch (error) {
      console.error('❌ Erro durante logout:', error);
      // Mesmo com erro, tenta redirecionar
      window.location.href = '/login';
    }
  },

  // ============================================
  // 🔍 VERIFICAÇÕES DE ESTADO
  // ============================================
  
  // Verificar se está autenticado
  isAuthenticated: () => {
    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      // Verificações básicas
      if (!token || !user) {
        return false;
      }
      
      // Verificar se o token não expirou
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

  // Verificar se token expirou
  isTokenExpired: (token) => {
    try {
      if (!token) return true;
      
      // Decodificar payload do JWT
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Verificar se expirou
      return payload.exp < currentTime;
      
    } catch (error) {
      console.error('❌ Erro ao verificar expiração do token:', error);
      return true; // Se der erro, considerar expirado
    }
  },

  // Obter usuário atual
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('❌ Erro ao obter usuário atual:', error);
      return null;
    }
  },

  // Verificar se é admin
  isAdmin: () => {
    try {
      const user = authService.getCurrentUser();
      return user && user.tipo === 'admin';
    } catch (error) {
      console.error('❌ Erro ao verificar se é admin:', error);
      return false;
    }
  },

  // Obter token
  getToken: () => {
    try {
      return localStorage.getItem('token');
    } catch (error) {
      console.error('❌ Erro ao obter token:', error);
      return null;
    }
  },

  // ============================================
  // 🛠️ FUNÇÕES UTILITÁRIAS
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

  // Obter informações do token
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

  // Renovar sessão (se necessário)
  refreshSession: async () => {
    try {
      console.log('🔄 Tentando renovar sessão...');
      
      if (!authService.isAuthenticated()) {
        throw new Error('Usuário não autenticado');
      }
      
      const response = await api.get('/auth/perfil');
      
      // Atualizar dados do usuário
      if (response.data?.usuario) {
        localStorage.setItem('user', JSON.stringify(response.data.usuario));
        console.log('✅ Sessão renovada com sucesso');
      }
      
      return response.data;
      
    } catch (error) {
      console.error('❌ Erro ao renovar sessão:', error);
      authService.logout();
      throw error;
    }
  },

  // Debug da autenticação
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