import api from './api';

const usuarioService = {
  // Listar todos os usuários (usando rota que já existe ou simulando)
  listarTodos: () => {
    // Se não existir rota específica, podemos retornar dados simulados
    // ou usar alguma rota existente
    return api.get('/auth/usuarios');
  },

  // Criar novo usuário (usando rota de registro)
  criar: (dados) => {
    return api.post('/auth/registrar', dados);
  },

  // Buscar por ID (simulado por enquanto)
  buscarPorId: (id) => {
    return Promise.resolve({ data: { id, nome: 'Usuário', email: 'user@test.com' } });
  },

  // Excluir usuário (simulado)
  excluir: (id) => {
    return Promise.resolve({ success: true });
  },

  // Outras funções básicas
  atualizar: (id, dados) => {
    return Promise.resolve({ data: dados });
  }
};

export default usuarioService;