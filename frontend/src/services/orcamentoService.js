import api from './api';

const orcamentoService = {
  listar: (params = {}) => {
    return api.get('/orcamentos', { params });
  },

  buscarPorId: (id) => {
    return api.get(`/orcamentos/${id}`);
  },

  criar: (dados) => {
    return api.post('/orcamentos', dados);
  },

  atualizar: (id, dados) => {
    return api.put(`/orcamentos/${id}`, dados);
  },

  deletar: (id) => {
    return api.delete(`/orcamentos/${id}`);
  },
};

export default orcamentoService;