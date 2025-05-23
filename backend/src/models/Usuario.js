module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define('Usuario', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    senha: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tipo: {
      type: DataTypes.ENUM('admin', 'desenvolvedor', 'usuario'),
      defaultValue: 'usuario'
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  });

  Usuario.associate = function(models) {
    Usuario.hasMany(models.HistoricoAlteracao, {
      foreignKey: 'usuario_id',
      as: 'historicos'
    });
  };

  return Usuario;
};