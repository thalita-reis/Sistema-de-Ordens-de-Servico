  const { Orcamento, Cliente } = require('../models');
  const { registrarAlteracao } = require('../middleware/auditMiddleware');
  const { Op } = require('sequelize');

  module.exports = {
    async listar(req, res) {
      try {
        const { page = 1, limit = 10, status, search } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        
        if (status) {
          where.status = status;
        }

        if (search) {
          where[Op.or] = [
            { numero: { [Op.iLike]: `%${search}%` } },
            { '$cliente.nome$': { [Op.iLike]: `%${search}%` } }
          ];
        }

        const { count, rows } = await Orcamento.findAndCountAll({
          where,
          include: [{
            model: Cliente,
            as: 'cliente',
            attributes: ['id', 'nome', 'telefone', 'email']
          }],
          limit: parseInt(limit),
          offset: parseInt(offset),
          order: [['created_at', 'DESC']]
        });

        return res.json({
          orcamentos: rows,
          total: count,
          pages: Math.ceil(count / limit),
          currentPage: parseInt(page)
        });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao listar orçamentos' });
      }
    },

    async buscarPorId(req, res) {
      try {
        const { id } = req.params;
        
        const orcamento = await Orcamento.findByPk(id, {
          include: [{
            model: Cliente,
            as: 'cliente'
          }]
        });

        if (!orcamento) {
          return res.status(404).json({ error: 'Orçamento não encontrado' });
        }

        return res.json(orcamento);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao buscar orçamento' });
      }
    },

    async criar(req, res) {
      try {
        // Calcular validade (30 dias por padrão)
        const dataValidade = new Date();
        dataValidade.setDate(dataValidade.getDate() + 30);
        
        const dadosOrcamento = {
          ...req.body,
          data_validade: req.body.data_validade || dataValidade
        };

        const orcamento = await Orcamento.create(dadosOrcamento);

        // Buscar com cliente incluído
        const orcamentoCompleto = await Orcamento.findByPk(orcamento.id, {
          include: [{
            model: Cliente,
            as: 'cliente'
          }]
        });

        // Registrar no histórico
        await registrarAlteracao(
          'Orcamento',
          orcamento.id,
          'criar',
          orcamentoCompleto.toJSON(),
          req.userId
        );

        return res.status(201).json(orcamentoCompleto);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao criar orçamento' });
      }
    },

    async atualizar(req, res) {
      try {
        const { id } = req.params;
        
        const orcamento = await Orcamento.findByPk(id);
        if (!orcamento) {
          return res.status(404).json({ error: 'Orçamento não encontrado' });
        }

        // Capturar valores anteriores
        const valoresAnteriores = orcamento.toJSON();

        // Atualizar
        await orcamento.update(req.body);

        // Registrar alterações
        const alteracoes = {};
        for (const campo in req.body) {
          if (JSON.stringify(valoresAnteriores[campo]) !== JSON.stringify(req.body[campo])) {
            alteracoes[campo] = {
              anterior: valoresAnteriores[campo],
              novo: req.body[campo]
            };
          }
        }

        if (Object.keys(alteracoes).length > 0) {
          await registrarAlteracao(
            'Orcamento',
            orcamento.id,
            'atualizar',
            { alteracoes },
            req.userId
          );
        }

        // Buscar com cliente incluído
        const orcamentoAtualizado = await Orcamento.findByPk(id, {
          include: [{
            model: Cliente,
            as: 'cliente'
          }]
        });

        return res.json(orcamentoAtualizado);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao atualizar orçamento' });
      }
    },

    async deletar(req, res) {
      try {
        const { id } = req.params;
        
        const orcamento = await Orcamento.findByPk(id);
        if (!orcamento) {
          return res.status(404).json({ error: 'Orçamento não encontrado' });
        }

        // Cancelar ao invés de deletar
        await orcamento.update({ status: 'rejeitado' });

        // Registrar no histórico
        await registrarAlteracao(
          'Orcamento',
          orcamento.id,
          'deletar',
          null,
          req.userId
        );

        return res.status(204).send();
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao deletar orçamento' });
      }
    }
  };