import api from './api';

// ============================================
// 👥 CLIENT SERVICE - VERSÃO HÍBRIDA PERFEITA
// ============================================

const clienteService = {
  // ============================================
  // 📋 LISTAR CLIENTES - SUA VERSÃO CORRIGIDA
  // ============================================
  listar: async (params = {}) => {
    try {
      console.log('🔍 ClienteService.listar - Parâmetros:', params);
      console.log('🌐 Plataforma detectada:', window.location.hostname.includes('vercel.app') ? 'VERCEL' : window.location.hostname.includes('onrender.com') ? 'RENDER' : 'LOCAL');
      
      // ✅ CORREÇÃO: Usar /api/clientes em vez de /clientes
      const response = await api.get('/api/clientes', { params });
      
      console.log('✅ Backend retornou:', response.data);
      
      // Sua lógica de adaptação mantida - excelente!
      const adaptedResponse = {
        data: {
          clientes: response.data.data || response.data.clientes || [],
          total: response.data.pagination?.total || response.data.total || 0,
          page: response.data.pagination?.page || response.data.page || 1,
          totalPages: response.data.pagination?.totalPages || response.data.pages || 1,
          hasNext: response.data.pagination?.hasNext || false,
          hasPrev: response.data.pagination?.hasPrev || false
        }
      };
      
      console.log('🔄 Resposta adaptada para frontend:', adaptedResponse);
      return adaptedResponse;
      
    } catch (error) {
      console.error('❌ Erro no clienteService.listar:', error);
      
      // Fallback para não quebrar a aplicação
      if (error.response?.status === 404) {
        console.warn('⚠️ Rota não encontrada - retornando dados vazios');
        return {
          data: {
            clientes: [],
            total: 0,
            page: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        };
      }
      
      throw error;
    }
  },

  // ============================================
  // 👤 BUSCAR CLIENTE POR ID - CORRIGIDO
  // ============================================
  buscarPorId: (id) => {
    console.log('🔍 ClienteService.buscarPorId - ID:', id);
    // ✅ CORREÇÃO: Usar /api/clientes
    return api.get(`/api/clientes/${id}`);
  },

  // ============================================
  // ➕ CRIAR NOVO CLIENTE - CORRIGIDO
  // ============================================
  criar: (dados) => {
    console.log('➕ ClienteService.criar - Dados:', dados);
    // ✅ CORREÇÃO: Usar /api/clientes
    return api.post('/api/clientes', dados);
  },

  // ============================================
  // 🔄 ATUALIZAR CLIENTE - CORRIGIDO
  // ============================================
  atualizar: (id, dados) => {
    console.log('🔄 ClienteService.atualizar - ID:', id, 'Dados:', dados);
    // ✅ CORREÇÃO: Usar /api/clientes
    return api.put(`/api/clientes/${id}`, dados);
  },

  // ============================================
  // 🗑️ DELETAR CLIENTE - CORRIGIDO
  // ============================================
  deletar: (id) => {
    console.log('🗑️ ClienteService.deletar - ID:', id);
    // ✅ CORREÇÃO: Usar /api/clientes
    return api.delete(`/api/clientes/${id}`);
  },

  // ============================================
  // 📍 BUSCAR CEP - SUA FUNÇÃO MANTIDA (PERFEITA!)
  // ============================================
  buscarCEP: async (cep) => {
    try {
      console.log('📍 ClienteService.buscarCEP - CEP:', cep);
      
      // Sua implementação está perfeita - usando API externa
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        console.warn('⚠️ CEP não encontrado:', cep);
        return null;
      }
      
      console.log('✅ CEP encontrado:', data);
      return data;
      
    } catch (error) {
      console.error('❌ Erro ao buscar CEP:', error);
      return null;
    }
  },

  // ============================================
  // 🆔 BUSCAR OU CRIAR (CPF ÚNICO) - CORRIGIDO
  // ============================================
  buscarOuCriar: (dados) => {
    console.log('🆔 ClienteService.buscarOuCriar - Dados:', dados);
    // ✅ CORREÇÃO: Usar /api/clientes
    return api.post('/api/clientes/buscar-ou-criar', dados);
  },

  // ============================================
  // 🔍 BUSCAR POR CPF - CORRIGIDO
  // ============================================
  buscarPorCpf: (cpf) => {
    console.log('🔍 ClienteService.buscarPorCpf - CPF:', cpf);
    // ✅ CORREÇÃO: Usar /api/clientes
    return api.get(`/api/clientes/cpf/${cpf}`);
  },

  // ============================================
  // ✅ VERIFICAR SE CPF EXISTE - CORRIGIDO
  // ============================================
  verificarCpf: (cpf) => {
    console.log('✅ ClienteService.verificarCpf - CPF:', cpf);
    // ✅ CORREÇÃO: Usar /api/clientes
    return api.get(`/api/clientes/verificar-cpf/${cpf}`);
  },

  // ============================================
  // 🔍 PESQUISAR CLIENTES - CORRIGIDO
  // ============================================
  pesquisar: (termo) => {
    console.log('🔍 ClienteService.pesquisar - Termo:', termo);
    // ✅ CORREÇÃO: Usar /api/clientes
    return api.get(`/api/clientes/pesquisar/${termo}`);
  },

  // ============================================
  // ✔️ VALIDAR CPF - CORRIGIDO
  // ============================================
  validarCpf: (cpf) => {
    console.log('✔️ ClienteService.validarCpf - CPF:', cpf);
    // ✅ CORREÇÃO: Usar /api/clientes
    return api.post('/api/clientes/validar-cpf', { cpf });
  },

  // ============================================
  // 📊 BUSCAR CLIENTE COM ORÇAMENTOS - CORRIGIDO
  // ============================================
  buscarComOrcamentos: (cpf) => {
    console.log('📊 ClienteService.buscarComOrcamentos - CPF:', cpf);
    // ✅ CORREÇÃO: Usar /api/clientes
    return api.get(`/api/clientes/${cpf}/orcamentos`);
  },

  // ============================================
  // 🧪 TESTE DE CONEXÃO - SUA FUNÇÃO CORRIGIDA
  // ============================================
  testarConexao: async () => {
    try {
      console.log('🧪 ClienteService.testarConexao - Testando...');
      
      // ✅ CORREÇÃO: Usar /api/health
      const response = await api.get('/api/health');
      
      console.log('✅ API funcionando:', response.data);
      return { success: true, data: response.data };
      
    } catch (error) {
      console.error('❌ Erro na conexão:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // 🔄 BUSCAR TODOS (SEM PAGINAÇÃO) - NOVA FUNÇÃO
  // ============================================
  buscarTodos: async () => {
    try {
      console.log('👥 ClienteService.buscarTodos - Buscando todos os clientes...');
      
      const response = await api.get('/api/clientes', { 
        params: { 
          limit: 1000, // Limite alto para pegar todos
          page: 1 
        } 
      });
      
      console.log(`✅ ${response.data.data?.length || response.data.clientes?.length || 0} clientes encontrados`);
      
      // Retornar formato consistente
      return {
        data: {
          clientes: response.data.data || response.data.clientes || [],
          total: response.data.total || response.data.pagination?.total || 0
        }
      };
      
    } catch (error) {
      console.error('❌ Erro ao buscar todos os clientes:', error);
      return {
        data: {
          clientes: [],
          total: 0
        }
      };
    }
  },

  // ============================================
  // 🔍 BUSCAR POR FILTROS AVANÇADOS - NOVA
  // ============================================
  buscarPorFiltros: async (filtros = {}) => {
    try {
      console.log('🔍 ClienteService.buscarPorFiltros - Filtros:', filtros);
      
      const params = {
        page: filtros.page || 1,
        limit: filtros.limit || 10,
        search: filtros.search || '',
        cidade: filtros.cidade || '',
        estado: filtros.estado || '',
        ativo: filtros.ativo !== undefined ? filtros.ativo : undefined
      };
      
      // Remover parâmetros vazios
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined) {
          delete params[key];
        }
      });
      
      const response = await api.get('/api/clientes', { params });
      
      return {
        data: {
          clientes: response.data.data || response.data.clientes || [],
          total: response.data.pagination?.total || response.data.total || 0,
          page: response.data.pagination?.page || response.data.page || 1,
          totalPages: response.data.pagination?.totalPages || response.data.pages || 1
        }
      };
      
    } catch (error) {
      console.error('❌ Erro ao buscar clientes por filtros:', error);
      throw error;
    }
  },

  // ============================================
  // 📈 ESTATÍSTICAS DE CLIENTES - NOVA
  // ============================================
  obterEstatisticas: async () => {
    try {
      console.log('📈 ClienteService.obterEstatisticas - Buscando estatísticas...');
      
      const response = await api.get('/api/clientes/estatisticas');
      
      console.log('✅ Estatísticas obtidas:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      // Fallback com dados vazios
      return {
        total: 0,
        ativos: 0,
        inativos: 0,
        novosEsteMs: 0,
        cidadesPrincipais: []
      };
    }
  },

  // ============================================
  // 🛠️ UTILITÁRIOS - SUAS FUNÇÕES MANTIDAS
  // ============================================
  
  // Formatar CPF
  formatarCpf: (cpf) => {
    if (!cpf) return '';
    const numeros = cpf.replace(/\D/g, '');
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  },

  // Limpar CPF (apenas números)
  limparCpf: (cpf) => {
    if (!cpf) return '';
    return cpf.replace(/\D/g, '');
  },

  // Validar CPF (algoritmo)
  validarCpfAlgoritmo: (cpf) => {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
      return false;
    }
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    
    resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    
    return resto === parseInt(cpf.charAt(10));
  },

  // Formatar telefone
  formatarTelefone: (telefone) => {
    if (!telefone) return '';
    const numeros = telefone.replace(/\D/g, '');
    
    if (numeros.length === 11) {
      return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numeros.length === 10) {
      return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return telefone;
  },

  // Debug completo
  debug: async () => {
    console.log('\n🔍 =================================');
    console.log('🛠️ DEBUG CLIENTE SERVICE');
    console.log('=================================');
    console.log('🌐 Base URL:', api.defaults.baseURL);
    console.log('🏠 Hostname:', window.location.hostname);
    console.log('🚀 Plataforma:', window.location.hostname.includes('vercel.app') ? 'VERCEL' : window.location.hostname.includes('onrender.com') ? 'RENDER' : 'LOCAL');
    
    const conexaoTest = await clienteService.testarConexao();
    console.log('🔌 Teste de conexão:', conexaoTest.success ? '✅ OK' : '❌ FALHOU');
    
    if (conexaoTest.success) {
      try {
        const estatisticas = await clienteService.obterEstatisticas();
        console.log('📊 Estatísticas:', estatisticas);
      } catch (error) {
        console.log('📊 Estatísticas: ❌ Não disponível');
      }
    }
    
    console.log('=================================\n');
    
    return {
      baseURL: api.defaults.baseURL,
      hostname: window.location.hostname,
      conexao: conexaoTest.success,
      plataforma: window.location.hostname.includes('vercel.app') ? 'VERCEL' : window.location.hostname.includes('onrender.com') ? 'RENDER' : 'LOCAL'
    };
  }
};

export default clienteService;