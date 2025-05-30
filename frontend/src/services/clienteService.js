import api from './api';

const clienteService = {
  listar: (params = {}) => {
    return api.get('/clientes', { params });
  },

  buscarPorId: (id) => {
    return api.get(`/clientes/${id}`);
  },

  criar: (dados) => {
    return api.post('/clientes', dados);
  },

  atualizar: (id, dados) => {
    return api.put(`/clientes/${id}`, dados);
  },

  deletar: (id) => {
    return api.delete(`/clientes/${id}`);
  },

  buscarCEP: async (cep) => {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      return response.json();
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      return null;
    }
  },
};

export default clienteService;