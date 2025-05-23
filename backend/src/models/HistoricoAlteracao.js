module.exports = (sequelize, DataTypes) => {
  const HistoricoAlteracao = sequelize.define('HistoricoAlteracao', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    tabela: {
      type: DataTypes.STRING,
      allowNull: false
    },
    registro_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    acao: {
      type: DataTypes.ENUM('criar', 'atualizar', 'deletar'),
      allowNull: false
    },
    campo_alterado: {
      type: DataTypes.STRING
    },
    valor_anterior: {
      type: DataTypes.TEXT
    },
    valor_novo: {
      type: DataTypes.TEXT
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    data_alteracao: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });

  HistoricoAlteracao.associate = function(models) {
    HistoricoAlteracao.belongsTo(models.Usuario, {
      foreignKey: 'usuario_id',
      as: 'usuario'
    });
  };

  return HistoricoAlteracao;
};