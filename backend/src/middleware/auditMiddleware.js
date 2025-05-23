const { HistoricoAlteracao } = require('../models');

module.exports = {
  async registrarAlteracao(tabela, registroId, acao, dados, usuarioId) {
    try {
      if (acao === 'atualizar' && dados.alteracoes) {
        for (const [campo, valores] of Object.entries(dados.alteracoes)) {
          await HistoricoAlteracao.create({
            tabela,
            registro_id: registroId,
            acao,
            campo_alterado: campo,
            valor_anterior: valores.anterior ? JSON.stringify(valores.anterior) : null,
            valor_novo: valores.novo ? JSON.stringify(valores.novo) : null,
            usuario_id: usuarioId
          });
        }
      } else {
        await HistoricoAlteracao.create({
          tabela,
          registro_id: registroId,
          acao,
          valor_novo: acao === 'criar' ? JSON.stringify(dados) : null,
          usuario_id: usuarioId
        });
      }
    } catch (error) {
      console.error('Erro ao registrar alteração:', error);
    }
  }
};