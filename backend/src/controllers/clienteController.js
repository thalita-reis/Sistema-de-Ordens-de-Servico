const ClienteService = require('../services/ClienteService');
const { HistoricoAlteracao } = require('../models');
const { registrarAlteracao } = require('../middleware/auditMiddleware');

const clienteService = new ClienteService();

module.exports = {
  
  async listar(req, res) {
    try {
      const { page = 1, limit = 10, search, ativo = true } = req.query;
      const offset = (page - 1) * limit;
      
      // Usar ClienteService com parâmetros adaptados
      const clientes = await clienteService.listarPorEmpresa(1, {
        limite: parseInt(limit),
        offset: parseInt(offset),
        busca: search || '',
        apenasAtivos: ativo !== 'false'
      });
      
      // Para manter compatibilidade, calcular total
      const todosClientes = await clienteService.listarPorEmpresa(1, {
        limite: 1000, // número alto para pegar todos
        offset: 0,
        busca: search || '',
        apenasAtivos: ativo !== 'false'
      });
      
      const total = todosClientes.length;

      return res.json({
        clientes: clientes,
        total: total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page)
      });
      
    } catch (error) {
      console.error('Erro no controller listar:', error);
      return res.status(500).json({ error: 'Erro ao listar clientes' });
    }
  },

  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      console.log('Buscando cliente com ID:', id);
      
      const cliente = await clienteService.buscarPorId(id);
      
      if (!cliente) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }
      
      return res.json(cliente);
      
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      return res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
  },

  async criar(req, res) {
    try {
      // Usar ClienteService para criar
      const cliente = await clienteService.criar({
        ...req.body,
        empresa_id: req.user?.empresa_id || 1
      });

      // Registrar no histórico (mantendo sua auditoria)
      await registrarAlteracao(
        'Cliente',
        cliente.id,
        'criar',
        cliente,
        req.userId
      );

      return res.status(201).json(cliente);
      
    } catch (error) {
      console.error('Erro no controller criar:', error);
      
      // Tratar erro de CPF duplicado
      if (error.code === '23505') {
        return res.status(400).json({ error: 'CPF já cadastrado' });
      }
      
      return res.status(500).json({ error: 'Erro ao criar cliente' });
    }
  },

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      
      // Buscar cliente atual para auditoria
      const clienteAnterior = await clienteService.buscarPorId(id);
      if (!clienteAnterior) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      // Atualizar usando ClienteService
      const resultado = await clienteService.atualizar(clienteAnterior.cpf, req.body);
      
      if (!resultado.sucesso) {
        return res.status(404).json({ error: resultado.erro });
      }

      // Registrar alterações para auditoria
      const alteracoes = {};
      for (const campo in req.body) {
        if (clienteAnterior[campo] !== req.body[campo]) {
          alteracoes[campo] = {
            anterior: clienteAnterior[campo],
            novo: req.body[campo]
          };
        }
      }

      if (Object.keys(alteracoes).length > 0) {
        await registrarAlteracao(
          'Cliente',
          resultado.cliente.id,
          'atualizar',
          { alteracoes },
          req.userId
        );
      }

      return res.json(resultado.cliente);
      
    } catch (error) {
      console.error('Erro no controller atualizar:', error);
      return res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
  },

  async deletar(req, res) {
    try {
      const { id } = req.params;
      
      // Buscar cliente para verificar se existe
      const cliente = await clienteService.buscarPorId(id);
      if (!cliente) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      // Soft delete usando ClienteService
      const sucesso = await clienteService.desativar(cliente.cpf);
      
      if (!sucesso) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      // Registrar no histórico
      await registrarAlteracao(
        'Cliente',
        cliente.id,
        'deletar',
        null,
        req.userId
      );

      return res.status(204).send();
      
    } catch (error) {
      console.error('Erro no controller deletar:', error);
      return res.status(500).json({ error: 'Erro ao deletar cliente' });
    }
  },

  // ============================================
  // MÉTODOS EXTRAS (baseados no ClienteService)
  // ============================================

  async buscarPorCpf(req, res) {
    try {
      const { cpf } = req.params;
      
      const cliente = await clienteService.buscarPorCpf(cpf);
      
      if (!cliente) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }
      
      return res.json(cliente);
      
    } catch (error) {
      console.error('Erro ao buscar cliente por CPF:', error);
      return res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
  },

  async verificarCpf(req, res) {
    try {
      const { cpf } = req.params;
      
      const cliente = await clienteService.buscarPorCpf(cpf);
      
      return res.json({
        existe: !!cliente,
        cliente: cliente || null
      });
      
    } catch (error) {
      console.error('Erro ao verificar CPF:', error);
      return res.status(500).json({ error: 'Erro ao verificar CPF' });
    }
  },

  async buscarOuCriar(req, res) {
    try {
      const { cpf, nome, email, telefone, endereco } = req.body;
      
      if (!cpf || !nome) {
        return res.status(400).json({ error: 'CPF e nome são obrigatórios' });
      }
      
      const resultado = await clienteService.buscarOuCriar({
        cpf,
        nome,
        email,
        telefone,
        endereco,
        empresa_id: req.user?.empresa_id || 1
      });
      
      if (resultado.sucesso) {
        // Se criou um novo cliente, registrar na auditoria
        if (!resultado.jaCadastrado) {
          await registrarAlteracao(
            'Cliente',
            resultado.cliente.id,
            'criar',
            resultado.cliente,
            req.userId
          );
        }
        
        const status = resultado.jaCadastrado ? 200 : 201;
        return res.status(status).json({
          cliente: resultado.cliente,
          jaCadastrado: resultado.jaCadastrado,
          mensagem: resultado.mensagem
        });
      } else {
        return res.status(400).json({ error: resultado.erro });
      }
      
    } catch (error) {
      console.error('Erro no controller buscarOuCriar:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async obterEstatisticas(req, res) {
    try {
      const empresaId = req.user?.empresa_id || 1;
      
      const estatisticas = await clienteService.obterEstatisticas(empresaId);
      
      return res.json({
        sucesso: true,
        estatisticas
      });
      
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return res.status(500).json({ error: 'Erro ao obter estatísticas' });
    }
  }
};
