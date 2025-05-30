import api from './api';

const authService = {
  // Login
  login: (dados) => {
    console.log('🔧 authService.login chamado com:', dados);
    return api.post('/auth/login', dados);
  },

  // Registro
  register: (dados) => {
    console.log('🔧 authService.register chamado com:', dados);
    return api.post('/auth/registrar', dados);
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Verificar se está logado
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Obter usuário atual
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Verificar se é admin
  isAdmin: () => {
    const user = authService.getCurrentUser();
    return user && user.tipo === 'admin';
  },

  // Obter token
  getToken: () => {
    return localStorage.getItem('token');
  }
};

export default authService;