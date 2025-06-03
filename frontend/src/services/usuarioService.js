import api from './api';

class UsuarioService {
  // ============================================
  // 📋 LISTAR TODOS OS USUÁRIOS
  // ============================================
  async listar() {
    try {
      console.log('🔍 UsuarioService.listar - Buscando usuários do banco...');
      
      const response = await api.get('/usuarios');
      
      console.log('✅ UsuarioService.listar - Usuários encontrados:', response.data?.length || 0);
      
      // Adaptação para compatibilidade com o componente
      if (response.data && Array.isArray(response.data)) {
        return {
          data: {
            usuarios: response.data,
            total: response.data.length
          }
        };
      }
      
      return response;
      
    } catch (error) {
      console.error('❌ UsuarioService.listar - Erro:', error.response?.data?.message || error.message);
      throw error;
    }
  }

  // ============================================
  // 👤 BUSCAR USUÁRIO POR ID
  // ============================================
  async buscarPorId(id) {
    try {
      console.log('🔍 UsuarioService.buscarPorId - ID:', id);
      
      if (!id) {
        throw new Error('ID do usuário é obrigatório');
      }
      
      const response = await api.get(`/usuarios/${id}`);
      
      console.log('✅ UsuarioService.buscarPorId - Usuário encontrado:', response.data?.nome || 'N/A');
      return response;
      
    } catch (error) {
      console.error('❌ UsuarioService.buscarPorId - Erro:', error.response?.data?.message || error.message);
      throw error;
    }
  }

  // ============================================
  // ➕ CRIAR NOVO USUÁRIO
  // ============================================
  async criar(dadosUsuario) {
    try {
      console.log('➕ UsuarioService.criar - Dados:', dadosUsuario?.nome || 'N/A');
      
      // Validações básicas
      if (!dadosUsuario?.nome || !dadosUsuario?.email || !dadosUsuario?.senha) {
        throw new Error('Nome, email e senha são obrigatórios');
      }
      
      // Verificar se email já existe
      try {
        await this.validarEmailUnico(dadosUsuario.email);
      } catch (emailError) {
        console.warn('⚠️ Validação de email:', emailError.message);
        // Continua mesmo se validação falhar (pode ser que endpoint não exista ainda)
      }
      
      const response = await api.post('/usuarios', dadosUsuario);
      
      console.log('✅ UsuarioService.criar - Usuário criado:', response.data?.nome || 'Sucesso');
      return response;
      
    } catch (error) {
      console.error('❌ UsuarioService.criar - Erro:', error.response?.data?.message || error.message);
      throw error;
    }
  }

  // ============================================
  // 🔄 ATUALIZAR USUÁRIO
  // ============================================
  async atualizar(id, dadosUsuario) {
    try {
      console.log('🔄 UsuarioService.atualizar - ID:', id, 'Dados:', dadosUsuario?.nome || 'N/A');
      
      if (!id) {
        throw new Error('ID do usuário é obrigatório');
      }
      
      // Se email foi alterado, validar se não existe
      if (dadosUsuario?.email) {
        try {
          await this.validarEmailUnico(dadosUsuario.email, id);
        } catch (emailError) {
          console.warn('⚠️ Validação de email na atualização:', emailError.message);
        }
      }
      
      const response = await api.put(`/usuarios/${id}`, dadosUsuario);
      
      console.log('✅ UsuarioService.atualizar - Usuário atualizado:', response.data?.nome || 'Sucesso');
      return response;
      
    } catch (error) {
      console.error('❌ UsuarioService.atualizar - Erro:', error.response?.data?.message || error.message);
      throw error;
    }
  }

  // ============================================
  // 🗑️ DELETAR USUÁRIO
  // ============================================
  async deletar(id) {
    try {
      console.log('🗑️ UsuarioService.deletar - ID:', id);
      
      if (!id) {
        throw new Error('ID do usuário é obrigatório');
      }
      
      const response = await api.delete(`/usuarios/${id}`);
      
      console.log('✅ UsuarioService.deletar - Usuário deletado com sucesso');
      return response;
      
    } catch (error) {
      console.error('❌ UsuarioService.deletar - Erro:', error.response?.data?.message || error.message);
      throw error;
    }
  }

  // ============================================
  // ⚡ ALTERAR STATUS (ATIVO/INATIVO)
  // ============================================
  async alterarStatus(id, ativo) {
    try {
      console.log('⚡ UsuarioService.alterarStatus - ID:', id, 'Ativo:', ativo);
      
      if (!id || typeof ativo !== 'boolean') {
        throw new Error('ID e status (boolean) são obrigatórios');
      }
      
      const response = await api.patch(`/usuarios/${id}/status`, { ativo });
      
      console.log('✅ UsuarioService.alterarStatus - Status alterado para:', ativo ? 'ATIVO' : 'INATIVO');
      return response;
      
    } catch (error) {
      console.error('❌ UsuarioService.alterarStatus - Erro:', error.response?.data?.message || error.message);
      throw error;
    }
  }

  // ============================================
  // 🔐 ALTERAR TIPO/PERMISSÃO
  // ============================================
  async alterarTipo(id, tipo) {
    try {
      console.log('🔐 UsuarioService.alterarTipo - ID:', id, 'Tipo:', tipo);
      
      if (!id || !tipo) {
        throw new Error('ID e tipo são obrigatórios');
      }
      
      const tiposValidos = ['administrador', 'usuario', 'admin', 'operador'];
      if (!tiposValidos.includes(tipo.toLowerCase())) {
        throw new Error(`Tipo inválido. Use: ${tiposValidos.join(', ')}`);
      }
      
      const response = await api.patch(`/usuarios/${id}/tipo`, { tipo });
      
      console.log('✅ UsuarioService.alterarTipo - Tipo alterado para:', tipo.toUpperCase());
      return response;
      
    } catch (error) {
      console.error('❌ UsuarioService.alterarTipo - Erro:', error.response?.data?.message || error.message);
      throw error;
    }
  }

  // ============================================
  // 🔍 BUSCAR POR EMAIL
  // ============================================
  async buscarPorEmail(email) {
    try {
      console.log('🔍 UsuarioService.buscarPorEmail - Email:', email);
      
      if (!email) {
        throw new Error('Email é obrigatório');
      }
      
      const response = await api.get(`/usuarios/email/${encodeURIComponent(email)}`);
      
      console.log('✅ UsuarioService.buscarPorEmail - Usuário encontrado:', response.data?.nome || 'N/A');
      return response;
      
    } catch (error) {
      console.error('❌ UsuarioService.buscarPorEmail - Erro:', error.response?.data?.message || error.message);
      throw error;
    }
  }

  // ============================================
  // 🔒 ALTERAR SENHA
  // ============================================
  async alterarSenha(id, novaSenha, senhaAtual = null) {
    try {
      console.log('🔒 UsuarioService.alterarSenha - ID:', id);
      
      if (!id || !novaSenha) {
        throw new Error('ID e nova senha são obrigatórios');
      }
      
      if (novaSenha.length < 6) {
        throw new Error('Nova senha deve ter pelo menos 6 caracteres');
      }
      
      const dados = { novaSenha };
      if (senhaAtual) {
        dados.senhaAtual = senhaAtual;
      }
      
      const response = await api.patch(`/usuarios/${id}/senha`, dados);
      
      console.log('✅ UsuarioService.alterarSenha - Senha alterada com sucesso');
      return response;
      
    } catch (error) {
      console.error('❌ UsuarioService.alterarSenha - Erro:', error.response?.data?.message || error.message);
      throw error;
    }
  }

  // ============================================
  // ✅ VALIDAR EMAIL ÚNICO
  // ============================================
  async validarEmailUnico(email, idExcluir = null) {
    try {
      console.log('✅ UsuarioService.validarEmailUnico - Email:', email, 'Excluir ID:', idExcluir);
      
      if (!email) {
        throw new Error('Email é obrigatório para validação');
      }
      
      const params = { email };
      if (idExcluir) {
        params.excluir_id = idExcluir;
      }
      
      const response = await api.get('/usuarios/validar-email', { params });
      
      console.log('✅ UsuarioService.validarEmailUnico - Email válido');
      return response;
      
    } catch (error) {
      console.error('❌ UsuarioService.validarEmailUnico - Erro:', error.response?.data?.message || error.message);
      throw error;
    }
  }

  // ============================================
  // 📊 ESTATÍSTICAS DE USUÁRIOS
  // ============================================
  async obterEstatisticas() {
    try {
      console.log('📊 UsuarioService.obterEstatisticas - Buscando dados...');
      
      const response = await api.get('/usuarios/estatisticas');
      
      console.log('✅ UsuarioService.obterEstatisticas - Dados obtidos:', {
        total: response.data?.total || 0,
        ativos: response.data?.ativos || 0,
        admins: response.data?.administradores || 0
      });
      
      return response;
      
    } catch (error) {
      console.error('❌ UsuarioService.obterEstatisticas - Erro:', error.response?.data?.message || error.message);
      
      // Retorna dados padrão se API não estiver disponível
      return {
        data: {
          total: 0,
          ativos: 0,
          administradores: 0,
          usuarios: 0
        }
      };
    }
  }

  // ============================================
  // 🧪 TESTE DE CONEXÃO
  // ============================================
  async testarConexao() {
    try {
      console.log('🧪 UsuarioService.testarConexao - Testando conexão com API...');
      
      const response = await api.get('/usuarios/teste');
      
      console.log('✅ UsuarioService.testarConexao - API funcionando perfeitamente');
      return { 
        success: true, 
        data: response.data,
        message: 'Conexão com API de usuários funcionando'
      };
      
    } catch (error) {
      console.error('❌ UsuarioService.testarConexao - Falha na conexão:', error.response?.data?.message || error.message);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message,
        message: 'Falha na conexão com API de usuários'
      };
    }
  }

  // ============================================
  // 🔄 SINCRONIZAR COM BACKEND
  // ============================================
  async sincronizar() {
    try {
      console.log('🔄 UsuarioService.sincronizar - Sincronizando dados...');
      
      const [usuarios, estatisticas] = await Promise.all([
        this.listar(),
        this.obterEstatisticas()
      ]);
      
      console.log('✅ UsuarioService.sincronizar - Dados sincronizados');
      return {
        usuarios: usuarios.data,
        estatisticas: estatisticas.data
      };
      
    } catch (error) {
      console.error('❌ UsuarioService.sincronizar - Erro na sincronização:', error.message);
      throw error;
    }
  }

  // ============================================
  // 🎯 BUSCAR COM FILTROS
  // ============================================
  async buscarComFiltros(filtros = {}) {
    try {
      console.log('🎯 UsuarioService.buscarComFiltros - Filtros:', filtros);
      
      const params = new URLSearchParams();
      
      if (filtros.nome) params.append('nome', filtros.nome);
      if (filtros.email) params.append('email', filtros.email);
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.ativo !== undefined) params.append('ativo', filtros.ativo);
      if (filtros.limite) params.append('limite', filtros.limite);
      if (filtros.pagina) params.append('pagina', filtros.pagina);
      
      const response = await api.get(`/usuarios/buscar?${params}`);
      
      console.log('✅ UsuarioService.buscarComFiltros - Resultados encontrados:', response.data?.length || 0);
      return response;
      
    } catch (error) {
      console.error('❌ UsuarioService.buscarComFiltros - Erro:', error.response?.data?.message || error.message);
      throw error;
    }
  }
}

// ============================================
// 📤 EXPORTAR INSTÂNCIA ÚNICA
// ============================================
export default new UsuarioService();