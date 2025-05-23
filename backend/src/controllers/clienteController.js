const { Cliente, HistoricoAlteracao } = require('../models');
const { registrarAlteracao } = require('../middleware/auditMiddleware');
const { Op } = require('sequelize');

module.exports = {
  async listar(req, res) {
    try {
      const { page = 1, limit = 10, search, ativo = true } = req.query;
      const offset = (page - 1) * limit;

      const where = {
        ficha_inativa: ativo === 'false'
      };

      if (search) {
        where[Op.or] = [
          { nome: { [Op.iLike]: `%${search}%` } },
          { cpf: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Cliente.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['nome', 'ASC']]
      });

      return res.json({
        clientes: rows,
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: parseInt(page)
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao listar clientes' });
    }
  },

  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      console.log('Buscando cliente com ID:', id); // Debug
      
      const cliente = await Cliente.findByPk(id);
      
      if (!cliente) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }
      
      return res.json(cliente);
    } catch (error) {
      console.error('Erro ao buscar cliente:', error); // Debug importante
      return res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
  },

  async criar(req, res) {
    try {
      const cliente = await Cliente.create(req.body);

      // Registrar no histórico
      await registrarAlteracao(
        'Cliente',
        cliente.id,
        'criar',
        cliente.toJSON(),
        req.userId
      );

      return res.status(201).json(cliente);
    } catch (error) {
      console.error(error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ error: 'CPF já cadastrado' });
      }
      return res.status(500).json({ error: 'Erro ao criar cliente' });
    }
  },

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      
      const cliente = await Cliente.findByPk(id);
      if (!cliente) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      // Capturar valores anteriores
      const valoresAnteriores = cliente.toJSON();

      // Atualizar
      await cliente.update(req.body);

      // Registrar alterações
      const alteracoes = {};
      for (const campo in req.body) {
        if (valoresAnteriores[campo] !== req.body[campo]) {
          alteracoes[campo] = {
            anterior: valoresAnteriores[campo],
            novo: req.body[campo]
          };
        }
      }

      if (Object.keys(alteracoes).length > 0) {
        await registrarAlteracao(
          'Cliente',
          cliente.id,
          'atualizar',
          { alteracoes },
          req.userId
        );
      }

      return res.json(cliente);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
  },

  async deletar(req, res) {
    try {
      const { id } = req.params;
      
      const cliente = await Cliente.findByPk(id);
      if (!cliente) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      // Soft delete - apenas marca como inativo
      await cliente.update({ ficha_inativa: true });

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
      console.error(error);
      return res.status(500).json({ error: 'Erro ao deletar cliente' });
    }
  }
};