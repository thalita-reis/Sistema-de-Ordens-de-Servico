module.exports = (sequelize, DataTypes) => {
  const Cliente = sequelize.define('Cliente', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false
    },
    cpf: {
      type: DataTypes.STRING,
      unique: true
    },
    data_inclusao: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    telefone: {
      type: DataTypes.STRING
    },
    celular: {
      type: DataTypes.STRING
    },
    fax: {
      type: DataTypes.STRING
    },
    rua: {
      type: DataTypes.STRING
    },
    numero: {
      type: DataTypes.STRING
    },
    complemento: {
      type: DataTypes.STRING
    },
    cep: {
      type: DataTypes.STRING
    },
    bairro: {
      type: DataTypes.STRING
    },
    cidade: {
      type: DataTypes.STRING
    },
    uf: {
      type: DataTypes.STRING(2)
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },
    pessoa_juridica: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    observacoes_gerais: {
      type: DataTypes.TEXT
    },
    ficha_inativa: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  });

  Cliente.associate = function(models) {
    Cliente.hasMany(models.Orcamento, {
      foreignKey: 'cliente_id',
      as: 'orcamentos'
    });
  };

  return Cliente;
};