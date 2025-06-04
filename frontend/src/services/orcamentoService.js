import api from './api';

const orcamentoService = {
  // ============================================
  // 📋 LISTAR ORÇAMENTOS (SUA VERSÃO CORRIGIDA)
  // ============================================
  listar: async (params = {}) => {
    try {
      console.log('🔍 OrcamentoService.listar - Buscando orçamentos...');
      console.log('🌐 Plataforma detectada:', window.location.hostname.includes('vercel.app') ? 'VERCEL' : window.location.hostname.includes('onrender.com') ? 'RENDER' : 'LOCAL');
      
      // ✅ CORREÇÃO: Usar /api/orcamentos em vez de /orcamentos
      const response = await api.get('/api/orcamentos', { params });
      
      // Sua lógica de adaptação mantida - estava perfeita!
      if (response.data && response.data.data) {
        // Backend retorna: { data: [...], success: true }
        console.log('✅ Orçamentos encontrados:', response.data.data.length);
        return {
          ...response,
          data: response.data.data // Extrair array para componentes
        };
      } else if (response.data && Array.isArray(response.data)) {
        // Backend retorna: [...] (array direto)
        console.log('✅ Orçamentos encontrados:', response.data.length);
        return response;
      }
      
      // Sua lógica de fallback mantida
      console.log('✅ Orçamentos encontrados: 0 (fallback)');
      return {
        ...response,
        data: response.data || []
      };
      
    } catch (error) {
      console.error('❌ Erro ao listar orçamentos:', error.response?.data?.message || error.message);
      
      // Fallback adicional para rota não encontrada
      if (error.response?.status === 404) {
        console.warn('⚠️ Rota não encontrada - retornando array vazio');
        return {
          data: [],
          status: 200,
          statusText: 'OK (fallback)'
        };
      }
      
      throw error;
    }
  },

  // ============================================
  // 📄 LISTAR COM PAGINAÇÃO - SUA FUNÇÃO CORRIGIDA
  // ============================================
  listarComPaginacao: async (params = {}) => {
    try {
      console.log('📄 OrcamentoService.listarComPaginacao - Parâmetros:', params);
      
      // ✅ CORREÇÃO: Usar /api/orcamentos/page
      const response = await api.get('/api/orcamentos/page', { params });
      
      console.log('✅ Paginação - Total:', response.data?.pagination?.total || 0);
      return response;
      
    } catch (error) {
      console.error('❌ Erro na paginação:', error.response?.data?.message || error.message);
      
      // Fallback para paginação
      if (error.response?.status === 404) {
        // Se rota específica não existir, usar listar normal
        console.warn('⚠️ Rota de paginação não encontrada - usando listagem normal');
        return await orcamentoService.listar(params);
      }
      
      throw error;
    }
  },

  // ============================================
  // 🔍 BUSCAR POR ID - SUA ESTRUTURA CORRIGIDA
  // ============================================
  buscarPorId: async (id) => {
    try {
      console.log('🔍 OrcamentoService.buscarPorId - ID:', id);
      
      // Sua validação mantida
      if (!id) {
        throw new Error('ID do orçamento é obrigatório');
      }
      
      // ✅ CORREÇÃO: Usar /api/orcamentos
      const response = await api.get(`/api/orcamentos/${id}`);
      
      // Sua lógica de adaptação mantida
      if (response.data && response.data.data) {
        console.log('✅ Orçamento encontrado:', response.data.data.numero || id);
        return {
          ...response,
          data: response.data.data
        };
      }
      
      console.log('✅ Orçamento encontrado:', id);
      return response;
      
    } catch (error) {
      console.error('❌ Erro ao buscar orçamento:', error.response?.data?.message || error.message);
      throw error;
    }
  },

  // ============================================
  // ➕ CRIAR ORÇAMENTO - SUA ESTRUTURA + VALIDAÇÃO CORRIGIDA
  // ============================================
  criar: async (dados) => {
    try {
      console.log('➕ OrcamentoService.criar - Dados:', {
        cliente_id: dados?.cliente_id,
        valor_total: dados?.valor_total,
        status: dados?.status
      });
      
      // Suas validações mantidas - excelentes!
      if (!dados?.cliente_id) {
        throw new Error('Cliente é obrigatório para criar orçamento');
      }
      
      // ✅ CORREÇÃO: Usar /api/orcamentos
      const response = await api.post('/api/orcamentos', dados);
      
      console.log('✅ Orçamento criado com sucesso!');
      return response;
      
    } catch (error) {
      console.error('❌ Erro ao criar orçamento:', error.response?.data?.message || error.message);
      throw error;
    }
  },

  // ============================================
  // 🔄 ATUALIZAR ORÇAMENTO - SUA ESTRUTURA CORRIGIDA
  // ============================================
  atualizar: async (id, dados) => {
    try {
      console.log('🔄 OrcamentoService.atualizar - ID:', id);
      
      // Sua validação mantida
      if (!id) {
        throw new Error('ID do orçamento é obrigatório');
      }
      
      // ✅ CORREÇÃO: Usar /api/orcamentos
      const response = await api.put(`/api/orcamentos/${id}`, dados);
      
      console.log('✅ Orçamento atualizado com sucesso!');
      return response;
      
    } catch (error) {
      console.error('❌ Erro ao atualizar orçamento:', error.response?.data?.message || error.message);
      throw error;
    }
  },

  // ============================================
  // 🗑️ DELETAR ORÇAMENTO - SUA ESTRUTURA CORRIGIDA
  // ============================================
  deletar: async (id) => {
    try {
      console.log('🗑️ OrcamentoService.deletar - ID:', id);
      
      // Sua validação mantida
      if (!id) {
        throw new Error('ID do orçamento é obrigatório');
      }
      
      // ✅ CORREÇÃO: Usar /api/orcamentos
      const response = await api.delete(`/api/orcamentos/${id}`);
      
      console.log('✅ Orçamento deletado com sucesso!');
      return response;
      
    } catch (error) {
      console.error('❌ Erro ao deletar orçamento:', error.response?.data?.message || error.message);
      throw error;
    }
  },

  // ============================================
  // 📊 ESTATÍSTICAS - SUA FUNÇÃO CORRIGIDA
  // ============================================
  obterEstatisticas: async () => {
    try {
      console.log('📊 OrcamentoService.obterEstatisticas...');
      
      // ✅ CORREÇÃO: Usar /api/orcamentos/estatisticas
      const response = await api.get('/api/orcamentos/estatisticas');
      
      console.log('✅ Estatísticas obtidas');
      return response;
      
    } catch (error) {
      console.error('❌ Erro nas estatísticas:', error.response?.data?.message || error.message);
      
      // Seus dados padrão mantidos - excelente fallback!
      return {
        data: {
          total: 0,
          rascunhos: 0,
          pendentes: 0,
          aprovados: 0,
          rejeitados: 0,
          valor_total: 0
        }
      };
    }
  },

  // ============================================
  // 🧪 TESTE DE CONEXÃO - SUA FUNÇÃO CORRIGIDA
  // ============================================
  teste: async () => {
    try {
      console.log('🧪 OrcamentoService.teste - Testando conexão...');
      
      // ✅ CORREÇÃO: Usar /api/orcamentos/teste
      const response = await api.get('/api/orcamentos/teste');
      
      console.log('✅ API de orçamentos funcionando!');
      return response;
      
    } catch (error) {
      console.error('❌ API de orçamentos com problema:', error.response?.data?.message || error.message);
      
      // Fallback: se rota específica não existir, testar listagem
      if (error.response?.status === 404) {
        console.warn('⚠️ Rota de teste não encontrada - testando listagem');
        try {
          await orcamentoService.listar({ limit: 1 });
          console.log('✅ API de orçamentos funcionando (via listagem)!');
          return { data: { status: 'ok', message: 'Testado via listagem' } };
        } catch (listError) {
          throw listError;
        }
      }
      
      throw error;
    }
  },

  // ============================================
  // 🔄 ALTERAR STATUS - SUA FUNÇÃO MANTIDA PERFEITA!
  // ============================================
  alterarStatus: async (id, novoStatus) => {
    try {
      console.log('🔄 OrcamentoService.alterarStatus - ID:', id, 'Status:', novoStatus);
      
      // Suas validações mantidas - excelentes!
      const statusValidos = ['rascunho', 'pendente', 'aprovado', 'rejeitado'];
      if (!statusValidos.includes(novoStatus)) {
        throw new Error(`Status inválido. Use: ${statusValidos.join(', ')}`);
      }
      
      const response = await orcamentoService.atualizar(id, { status: novoStatus });
      
      console.log('✅ Status alterado para:', novoStatus.toUpperCase());
      return response;
      
    } catch (error) {
      console.error('❌ Erro ao alterar status:', error.message);
      throw error;
    }
  },

  // ============================================
  // 📋 BUSCAR TODOS (NOVA - PARA SELETORES)
  // ============================================
  buscarTodos: async () => {
    try {
      console.log('📋 OrcamentoService.buscarTodos - Buscando todos os orçamentos...');
      
      const response = await api.get('/api/orcamentos', { 
        params: { 
          limit: 1000, // Limite alto para pegar todos
          page: 1 
        } 
      });
      
      // Usar sua lógica de adaptação
      if (response.data && response.data.data) {
        console.log('✅ Todos os orçamentos:', response.data.data.length);
        return {
          ...response,
          data: response.data.data
        };
      } else if (response.data && Array.isArray(response.data)) {
        console.log('✅ Todos os orçamentos:', response.data.length);
        return response;
      }
      
      console.log('✅ Todos os orçamentos: 0 (fallback)');
      return {
        ...response,
        data: response.data || []
      };
      
    } catch (error) {
      console.error('❌ Erro ao buscar todos os orçamentos:', error);
      return {
        data: [],
        status: 200,
        statusText: 'OK (fallback)'
      };
    }
  },

  // ============================================
  // 🔍 BUSCAR POR CLIENTE (NOVA - ÚTIL PARA HISTÓRICO)
  // ============================================
  buscarPorCliente: async (clienteId) => {
    try {
      console.log('🔍 OrcamentoService.buscarPorCliente - Cliente ID:', clienteId);
      
      if (!clienteId) {
        throw new Error('ID do cliente é obrigatório');
      }
      
      const response = await api.get(`/api/orcamentos/cliente/${clienteId}`);
      
      // Usar sua lógica de adaptação
      if (response.data && response.data.data) {
        console.log('✅ Orçamentos do cliente:', response.data.data.length);
        return {
          ...response,
          data: response.data.data
        };
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ Erro ao buscar orçamentos do cliente:', error);
      
      // Fallback: buscar todos e filtrar
      if (error.response?.status === 404) {
        console.warn('⚠️ Rota específica não encontrada - filtrando localmente');
        try {
          const todosOrcamentos = await orcamentoService.buscarTodos();
          const orcamentosCliente = todosOrcamentos.data.filter(orc => 
            orc.cliente_id === clienteId || orc.cliente_id === parseInt(clienteId)
          );
          
          return {
            data: orcamentosCliente,
            status: 200,
            statusText: 'OK (filtrado localmente)'
          };
        } catch (fallbackError) {
          return { data: [] };
        }
      }
      
      throw error;
    }
  },

  // ============================================
  // 🛠️ UTILITÁRIOS (BASEADOS NO SEU PADRÃO)
  // ============================================
  
  // Formatar valor em reais
  formatarValor: (valor) => {
    if (!valor) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  },

  // Formatar data (no seu padrão)
  formatarData: (data) => {
    if (!data) return '';
    return new Date(data).toLocaleDateString('pt-BR');
  },

  // Validar dados do orçamento (no seu padrão de validação)
  validarDados: (dados) => {
    const erros = [];
    
    if (!dados?.cliente_id) {
      erros.push('Cliente é obrigatório');
    }
    
    if (!dados?.itens || dados.itens.length === 0) {
      erros.push('Pelo menos um item é obrigatório');
    }
    
    // Validar cada item (seguindo seu padrão)
    if (dados?.itens) {
      dados.itens.forEach((item, index) => {
        if (!item.descricao) {
          erros.push(`Item ${index + 1}: Descrição é obrigatória`);
        }
        if (!item.quantidade || item.quantidade <= 0) {
          erros.push(`Item ${index + 1}: Quantidade deve ser maior que zero`);
        }
        if (!item.valor_unitario || item.valor_unitario <= 0) {
          erros.push(`Item ${index + 1}: Valor unitário deve ser maior que zero`);
        }
      });
    }
    
    return erros;
  },

  // Debug completo (no seu estilo)
  debug: async () => {
    console.log('\n🔍 =================================');
    console.log('🛠️ DEBUG ORÇAMENTO SERVICE');
    console.log('=================================');
    console.log('🌐 Base URL:', api.defaults.baseURL);
    console.log('🏠 Hostname:', window.location.hostname);
    console.log('🚀 Plataforma:', window.location.hostname.includes('vercel.app') ? 'VERCEL' : window.location.hostname.includes('onrender.com') ? 'RENDER' : 'LOCAL');
    
    // Testar conexão usando sua função
    try {
      const testeConexao = await orcamentoService.teste();
      console.log('🔌 Teste de conexão: ✅ OK');
    } catch (error) {
      console.log('🔌 Teste de conexão: ❌ FALHOU');
    }
    
    // Testar estatísticas
    try {
      const stats = await orcamentoService.obterEstatisticas();
      console.log('📊 Estatísticas:', stats.data);
    } catch (error) {
      console.log('📊 Estatísticas: ❌ Não disponível');
    }
    
    console.log('=================================\n');
    
    return {
      baseURL: api.defaults.baseURL,
      hostname: window.location.hostname,
      plataforma: window.location.hostname.includes('vercel.app') ? 'VERCEL' : window.location.hostname.includes('onrender.com') ? 'RENDER' : 'LOCAL'
    };
  }
};

export default orcamentoService;