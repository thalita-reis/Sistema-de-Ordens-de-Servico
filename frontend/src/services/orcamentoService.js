import api from './api';

const orcamentoService = {
  // ============================================
  // 📋 LISTAR ORÇAMENTOS (COMPATÍVEL COM COMPONENTES)
  // ============================================
  listar: async (params = {}) => {
    try {
      console.log('🔍 OrcamentoService.listar - Buscando orçamentos...');
      
      const response = await api.get('/orcamentos', { params });
      
      // Adaptar resposta para compatibilidade com componentes
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
      
      // Fallback: garantir que sempre retorna array
      console.log('✅ Orçamentos encontrados: 0 (fallback)');
      return {
        ...response,
        data: response.data || []
      };
      
    } catch (error) {
      console.error('❌ Erro ao listar orçamentos:', error.response?.data?.message || error.message);
      throw error;
    }
  },

  // ============================================
  // 📄 LISTAR COM PAGINAÇÃO (PARA COMPONENTES AVANÇADOS)
  // ============================================
  listarComPaginacao: async (params = {}) => {
    try {
      console.log('📄 OrcamentoService.listarComPaginacao - Parâmetros:', params);
      
      const response = await api.get('/orcamentos/page', { params });
      
      console.log('✅ Paginação - Total:', response.data?.pagination?.total || 0);
      return response;
      
    } catch (error) {
      console.error('❌ Erro na paginação:', error.response?.data?.message || error.message);
      throw error;
    }
  },

  // ============================================
  // 🔍 BUSCAR POR ID (SUA ESTRUTURA MANTIDA)
  // ============================================
  buscarPorId: async (id) => {
    try {
      console.log('🔍 OrcamentoService.buscarPorId - ID:', id);
      
      if (!id) {
        throw new Error('ID do orçamento é obrigatório');
      }
      
      const response = await api.get(`/orcamentos/${id}`);
      
      // Adaptar resposta se necessário
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
  // ➕ CRIAR ORÇAMENTO (SUA ESTRUTURA + VALIDAÇÃO)
  // ============================================
  criar: async (dados) => {
    try {
      console.log('➕ OrcamentoService.criar - Dados:', {
        cliente_id: dados?.cliente_id,
        valor_total: dados?.valor_total,
        status: dados?.status
      });
      
      // Validação básica essencial
      if (!dados?.cliente_id) {
        throw new Error('Cliente é obrigatório para criar orçamento');
      }
      
      const response = await api.post('/orcamentos', dados);
      
      console.log('✅ Orçamento criado com sucesso!');
      return response;
      
    } catch (error) {
      console.error('❌ Erro ao criar orçamento:', error.response?.data?.message || error.message);
      throw error;
    }
  },

  // ============================================
  // 🔄 ATUALIZAR ORÇAMENTO (SUA ESTRUTURA + VALIDAÇÃO)
  // ============================================
  atualizar: async (id, dados) => {
    try {
      console.log('🔄 OrcamentoService.atualizar - ID:', id);
      
      if (!id) {
        throw new Error('ID do orçamento é obrigatório');
      }
      
      const response = await api.put(`/orcamentos/${id}`, dados);
      
      console.log('✅ Orçamento atualizado com sucesso!');
      return response;
      
    } catch (error) {
      console.error('❌ Erro ao atualizar orçamento:', error.response?.data?.message || error.message);
      throw error;
    }
  },

  // ============================================
  // 🗑️ DELETAR ORÇAMENTO (SUA ESTRUTURA + VALIDAÇÃO)
  // ============================================
  deletar: async (id) => {
    try {
      console.log('🗑️ OrcamentoService.deletar - ID:', id);
      
      if (!id) {
        throw new Error('ID do orçamento é obrigatório');
      }
      
      const response = await api.delete(`/orcamentos/${id}`);
      
      console.log('✅ Orçamento deletado com sucesso!');
      return response;
      
    } catch (error) {
      console.error('❌ Erro ao deletar orçamento:', error.response?.data?.message || error.message);
      throw error;
    }
  },

  // ============================================
  // 📊 MÉTODOS EXTRAS ESSENCIAIS (PARA PAINEL)
  // ============================================
  obterEstatisticas: async () => {
    try {
      console.log('📊 OrcamentoService.obterEstatisticas...');
      
      const response = await api.get('/orcamentos/estatisticas');
      
      console.log('✅ Estatísticas obtidas');
      return response;
      
    } catch (error) {
      console.error('❌ Erro nas estatísticas:', error.response?.data?.message || error.message);
      
      // Retornar dados padrão se API não estiver disponível
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
  // 🧪 TESTE DE CONEXÃO (ESSENCIAL PARA DEBUG)
  // ============================================
  teste: async () => {
    try {
      console.log('🧪 OrcamentoService.teste - Testando conexão...');
      
      const response = await api.get('/orcamentos/teste');
      
      console.log('✅ API de orçamentos funcionando!');
      return response;
      
    } catch (error) {
      console.error('❌ API de orçamentos com problema:', error.response?.data?.message || error.message);
      throw error;
    }
  },

  // ============================================
  // 🔄 ALTERAR STATUS (MÉTODO DE CONVENIÊNCIA)
  // ============================================
  alterarStatus: async (id, novoStatus) => {
    try {
      console.log('🔄 OrcamentoService.alterarStatus - ID:', id, 'Status:', novoStatus);
      
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
  }
};

export default orcamentoService;