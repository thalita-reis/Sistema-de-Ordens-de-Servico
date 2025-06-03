import api from './api';

class DadosEmpresaService {
  // ============================================
  // 🏢 BUSCAR DADOS DA EMPRESA
  // ============================================
  async buscar() {
    try {
      console.log('🔍 DadosEmpresaService.buscar - Buscando dados da empresa...');
      
      const response = await api.get('/dados-empresa');
      
      // ✅ TRATAMENTO ROBUSTO DA RESPOSTA
      let dadosEmpresa = null;
      
      if (response && response.data) {
        if (response.data.empresa) {
          dadosEmpresa = response.data.empresa;
        } else if (response.data.data && response.data.data.empresa) {
          dadosEmpresa = response.data.data.empresa;
        } else if (Array.isArray(response.data) && response.data.length > 0) {
          dadosEmpresa = response.data[0];
        } else if (typeof response.data === 'object') {
          dadosEmpresa = response.data;
        }
      }
      
      console.log('✅ DadosEmpresaService.buscar - Dados encontrados:', {
        encontrou: !!dadosEmpresa,
        nome: dadosEmpresa?.nome || 'N/A',
        cnpj: dadosEmpresa?.cnpj || 'N/A',
        email: dadosEmpresa?.email || 'N/A'
      });
      
      return {
        success: true,
        data: dadosEmpresa || {
          nome: '',
          cnpj: '',
          email: '',
          telefone: '',
          endereco: '',
          cidade: '',
          estado: '',
          cep: ''
        },
        message: dadosEmpresa ? 'Dados da empresa carregados' : 'Empresa não encontrada - dados padrão'
      };
      
    } catch (error) {
      console.error('❌ DadosEmpresaService.buscar - Erro:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // ✅ RESPOSTA SEGURA EM CASO DE ERRO
      return {
        success: false,
        data: {
          nome: '',
          cnpj: '',
          email: '',
          telefone: '',
          endereco: '',
          cidade: '',
          estado: '',
          cep: ''
        },
        error: error.message || 'Erro ao buscar dados da empresa',
        statusCode: error.response?.status || 500
      };
    }
  }
  
  // ============================================
  // 💾 ATUALIZAR DADOS DA EMPRESA
  // ============================================
  async atualizar(dados) {
    try {
      console.log('💾 DadosEmpresaService.atualizar - Iniciando atualização...');
      console.log('📤 Dados enviados:', {
        nome: dados?.nome || 'N/A',
        cnpj: dados?.cnpj || 'N/A',
        email: dados?.email || 'N/A',
        temTelefone: !!dados?.telefone,
        temEndereco: !!dados?.endereco
      });
      
      // ✅ VALIDAÇÃO DOS DADOS ANTES DO ENVIO
      if (!dados || typeof dados !== 'object') {
        throw new Error('Dados inválidos para atualização');
      }
      
      // Validar campos obrigatórios
      const camposObrigatorios = ['nome', 'email'];
      const camposFaltando = camposObrigatorios.filter(campo => !dados[campo] || dados[campo].trim() === '');
      
      if (camposFaltando.length > 0) {
        throw new Error(`Campos obrigatórios não preenchidos: ${camposFaltando.join(', ')}`);
      }
      
      // ✅ LIMPAR E VALIDAR CNPJ (SE FORNECIDO)
      if (dados.cnpj) {
        const cnpjLimpo = dados.cnpj.replace(/[^\d]/g, '');
        if (cnpjLimpo.length > 0 && cnpjLimpo.length !== 14) {
          throw new Error('CNPJ deve ter 14 dígitos');
        }
        dados.cnpj = cnpjLimpo;
      }
      
      // ✅ VALIDAR EMAIL
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (dados.email && !emailRegex.test(dados.email)) {
        throw new Error('Email inválido');
      }
      
      // ✅ LIMPAR CEP (SE FORNECIDO)
      if (dados.cep) {
        dados.cep = dados.cep.replace(/[^\d]/g, '');
      }
      
      console.log('✅ Validação concluída - Enviando para backend...');
      
      const response = await api.put('/dados-empresa', dados);
      
      // ✅ TRATAMENTO DA RESPOSTA DO BACKEND
      let dadosAtualizados = null;
      let mensagem = 'Dados da empresa atualizados com sucesso';
      
      if (response && response.data) {
        if (response.data.empresa) {
          dadosAtualizados = response.data.empresa;
          mensagem = response.data.message || mensagem;
        } else if (response.data.data && response.data.data.empresa) {
          dadosAtualizados = response.data.data.empresa;
          mensagem = response.data.message || mensagem;
        } else if (response.data.success !== false) {
          dadosAtualizados = dados; // Usar dados enviados como fallback
          mensagem = response.data.message || mensagem;
        }
      }
      
      console.log('✅ DadosEmpresaService.atualizar - Sucesso:', {
        atualizou: !!dadosAtualizados,
        nome: dadosAtualizados?.nome || dados.nome,
        mensagem: mensagem
      });
      
      return {
        success: true,
        data: dadosAtualizados || dados,
        message: mensagem
      };
      
    } catch (error) {
      console.error('❌ DadosEmpresaService.atualizar - Erro:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        dadosEnviados: dados
      });
      
      // ✅ MENSAGENS DE ERRO ESPECÍFICAS
      let mensagemErro = 'Erro ao atualizar dados da empresa';
      
      if (error.response) {
        const status = error.response.status;
        switch (status) {
          case 400:
            mensagemErro = 'Dados inválidos - verifique os campos preenchidos';
            break;
          case 401:
            mensagemErro = 'Não autorizado - faça login novamente';
            break;
          case 403:
            mensagemErro = 'Sem permissão para atualizar dados da empresa';
            break;
          case 404:
            mensagemErro = 'Empresa não encontrada';
            break;
          case 500:
            mensagemErro = 'Erro interno do servidor - tente novamente em alguns minutos';
            break;
          default:
            mensagemErro = error.response.data?.message || mensagemErro;
        }
      } else if (error.message) {
        mensagemErro = error.message;
      }
      
      return {
        success: false,
        error: mensagemErro,
        statusCode: error.response?.status || 500,
        data: dados // Retornar dados originais para manter no formulário
      };
    }
  }
  
  // ============================================
  // 🧪 TESTAR CONEXÃO COM API
  // ============================================
  async testarConexao() {
    try {
      console.log('🧪 DadosEmpresaService.testarConexao - Testando...');
      
      const response = await api.get('/dados-empresa');
      
      console.log('✅ Conexão com API funcionando');
      return {
        success: true,
        message: 'Conexão com API funcionando',
        status: response.status
      };
      
    } catch (error) {
      console.error('❌ DadosEmpresaService.testarConexao - Erro:', error.message);
      
      return {
        success: false,
        error: error.message,
        statusCode: error.response?.status || 500
      };
    }
  }
  
  // ============================================
  // 📊 VALIDAR DADOS DA EMPRESA
  // ============================================
  validarDados(dados) {
    const erros = [];
    
    // Nome obrigatório
    if (!dados.nome || dados.nome.trim().length < 2) {
      erros.push('Nome da empresa deve ter pelo menos 2 caracteres');
    }
    
    // Email obrigatório e válido
    if (!dados.email || dados.email.trim() === '') {
      erros.push('Email é obrigatório');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(dados.email)) {
        erros.push('Email inválido');
      }
    }
    
    // CNPJ (se fornecido, deve ter 14 dígitos)
    if (dados.cnpj) {
      const cnpjLimpo = dados.cnpj.replace(/[^\d]/g, '');
      if (cnpjLimpo.length > 0 && cnpjLimpo.length !== 14) {
        erros.push('CNPJ deve ter 14 dígitos');
      }
    }
    
    // CEP (se fornecido, deve ter 8 dígitos)
    if (dados.cep) {
      const cepLimpo = dados.cep.replace(/[^\d]/g, '');
      if (cepLimpo.length > 0 && cepLimpo.length !== 8) {
        erros.push('CEP deve ter 8 dígitos');
      }
    }
    
    return {
      valido: erros.length === 0,
      erros: erros
    };
  }
  
  // ============================================
  // 🔧 FORMATAR DADOS PARA EXIBIÇÃO
  // ============================================
  formatarDados(dados) {
    if (!dados) return null;
    
    return {
      ...dados,
      cnpj: dados.cnpj ? this.formatarCNPJ(dados.cnpj) : '',
      cep: dados.cep ? this.formatarCEP(dados.cep) : '',
      telefone: dados.telefone ? this.formatarTelefone(dados.telefone) : ''
    };
  }
  
  // ============================================
  // 🔧 MÉTODOS AUXILIARES DE FORMATAÇÃO
  // ============================================
  formatarCNPJ(cnpj) {
    if (!cnpj) return '';
    const apenasNumeros = cnpj.replace(/[^\d]/g, '');
    if (apenasNumeros.length === 14) {
      return apenasNumeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return cnpj;
  }
  
  formatarCEP(cep) {
    if (!cep) return '';
    const apenasNumeros = cep.replace(/[^\d]/g, '');
    if (apenasNumeros.length === 8) {
      return apenasNumeros.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return cep;
  }
  
  formatarTelefone(telefone) {
    if (!telefone) return '';
    const apenasNumeros = telefone.replace(/[^\d]/g, '');
    if (apenasNumeros.length === 10) {
      return apenasNumeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (apenasNumeros.length === 11) {
      return apenasNumeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
  }
}

// ============================================
// 📤 EXPORT DA INSTÂNCIA DO SERVICE
// ============================================
const dadosEmpresaService = new DadosEmpresaService();
export default dadosEmpresaService;