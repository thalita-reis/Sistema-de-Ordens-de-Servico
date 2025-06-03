// // // // // const { DadosEmpresa } = require('../models'); // COMENTADO AUTOMATICAMENTE // COMENTADO AUTOMATICAMENTE // COMENTADO AUTOMATICAMENTE // COMENTADO AUTOMATICAMENTE // COMENTADO AUTOMATICAMENTE

module.exports = {
  async buscar(req, res) {
    try {
      let dados = await DadosEmpresa.findOne();
      
      if (!dados) {
        // Criar registro vazio se não existir
        dados = await DadosEmpresa.create({});
      }
      
      return res.json(dados);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar dados da empresa' });
    }
  },

  async atualizar(req, res) {
    try {
      let dados = await DadosEmpresa.findOne();
      
      if (!dados) {
        dados = await DadosEmpresa.create(req.body);
      } else {
        await dados.update(req.body);
      }
      
      return res.json(dados);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar dados da empresa' });
    }
  }
};
