import api from './api';

const clienteService = {
  // ============================================
  // 📋 LISTAR CLIENTES - VERSÃO CORRIGIDA
  // ============================================
  listar: async (params = {}) => {
    try {
      console.log('🔍 ClienteService.listar - Parâmetros:', params);
      
      const response = await api.get('/clientes', { params });
      
      console.log('✅ Backend retornou:', response.data);
      
      // Adaptar resposta para o formato esperado pelo ClientesList.js
      const adaptedResponse = {
        data: {
          clientes: response.data.data || [],
          total: response.data.pagination?.total || 0,
          page: response.data.pagination?.page || 1,
          totalPages: response.data.pagination?.totalPages || 1,
          hasNext: response.data.pagination?.hasNext || false,
          hasPrev: response.data.pagination?.hasPrev || false
        }
      };
      
      console.log('🔄 Resposta adaptada para frontend:', adaptedResponse);
      return adaptedResponse;
      
    } catch (error) {
      console.error('❌ Erro no clienteService.listar:', error);
      throw error;
    }
  },

  // ============================================
  // 👤 BUSCAR CLIENTE POR ID
  // ============================================
  buscarPorId: (id) => {
    console.log('🔍 ClienteService.buscarPorId - ID:', id);
    return api.get(`/clientes/${id}`);
  },

  // ============================================
  // ➕ CRIAR NOVO CLIENTE
  // ============================================
  criar: (dados) => {
    console.log('➕ ClienteService.criar - Dados:', dados);
    return api.post('/clientes', dados);
  },

  // ============================================
  // 🔄 ATUALIZAR CLIENTE
  // ============================================
  atualizar: (id, dados) => {
    console.log('🔄 ClienteService.atualizar - ID:', id, 'Dados:', dados);
    return api.put(`/clientes/${id}`, dados);
  },

  // ============================================
  // 🗑️ DELETAR CLIENTE
  // ============================================
  deletar: (id) => {
    console.log('🗑️ ClienteService.deletar - ID:', id);
    return api.delete(`/clientes/${id}`);
  },

  // ============================================
  // 📍 BUSCAR CEP - MELHORADO
  // ============================================
  buscarCEP: async (cep) => {
    try {
      console.log('📍 ClienteService.buscarCEP - CEP:', cep);
      
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      console.log('✅ CEP encontrado:', data);
      return data;
      
    } catch (error) {
      console.error('❌ Erro ao buscar CEP:', error);
      return null;
    }
  },

  // ============================================
  // 🆔 BUSCAR OU CRIAR (CPF ÚNICO)
  // ============================================
  buscarOuCriar: (dados) => {
    console.log('🆔 ClienteService.buscarOuCriar - Dados:', dados);
    return api.post('/clientes/buscar-ou-criar', dados);
  },

  // ============================================
  // 🔍 BUSCAR POR CPF
  // ============================================
  buscarPorCpf: (cpf) => {
    console.log('🔍 ClienteService.buscarPorCpf - CPF:', cpf);
    return api.get(`/clientes/cpf/${cpf}`);
  },

  // ============================================
  // ✅ VERIFICAR SE CPF EXISTE
  // ============================================
  verificarCpf: (cpf) => {
    console.log('✅ ClienteService.verificarCpf - CPF:', cpf);
    return api.get(`/clientes/verificar-cpf/${cpf}`);
  },

  // ============================================
  // 🔍 PESQUISAR CLIENTES
  // ============================================
  pesquisar: (termo) => {
    console.log('🔍 ClienteService.pesquisar - Termo:', termo);
    return api.get(`/clientes/pesquisar/${termo}`);
  },

  // ============================================
  // ✔️ VALIDAR CPF
  // ============================================
  validarCpf: (cpf) => {
    console.log('✔️ ClienteService.validarCpf - CPF:', cpf);
    return api.post('/clientes/validar-cpf', { cpf });
  },

  // ============================================
  // 📊 BUSCAR CLIENTE COM ORÇAMENTOS
  // ============================================
  buscarComOrcamentos: (cpf) => {
    console.log('📊 ClienteService.buscarComOrcamentos - CPF:', cpf);
    return api.get(`/clientes/${cpf}/orcamentos`);
  },

  // ============================================
  // 🧪 TESTE DE CONEXÃO
  // ============================================
  testarConexao: async () => {
    try {
      console.log('🧪 ClienteService.testarConexao - Testando...');
      
      const response = await api.get('/health');
      
      console.log('✅ API funcionando:', response.data);
      return { success: true, data: response.data };
      
    } catch (error) {
      console.error('❌ Erro na conexão:', error);
      return { success: false, error: error.message };
    }
  }
};

export default clienteService;