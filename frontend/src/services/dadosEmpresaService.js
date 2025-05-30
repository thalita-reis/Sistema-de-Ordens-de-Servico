import api from './api';

const dadosEmpresaService = {
  buscar: () => {
    return api.get('/dados-empresa');
  },

  atualizar: (dados) => {
    return api.put('/dados-empresa', dados);
  },
};

export default dadosEmpresaService;