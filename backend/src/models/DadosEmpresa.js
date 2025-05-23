module.exports = (sequelize, DataTypes) => {
  const DadosEmpresa = sequelize.define('DadosEmpresa', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    razao_social: {
      type: DataTypes.STRING
    },
    nome_oficina: {
      type: DataTypes.STRING
    },
    cnpj: {
      type: DataTypes.STRING
    },
    inscricao_estadual: {
      type: DataTypes.STRING
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },
    endereco: {
      type: DataTypes.STRING
    },
    numero: {
      type: DataTypes.STRING
    },
    bairro: {
      type: DataTypes.STRING
    },
    celular: {
      type: DataTypes.STRING
    },
    cidade: {
      type: DataTypes.STRING
    },
    estado: {
      type: DataTypes.STRING(2)
    },
    cep: {
      type: DataTypes.STRING
    }
  });

  return DadosEmpresa;
};