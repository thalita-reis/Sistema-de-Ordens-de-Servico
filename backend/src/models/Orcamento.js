module.exports = (sequelize, DataTypes) => {
  const Orcamento = sequelize.define('Orcamento', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    numero: {
      type: DataTypes.STRING,
      unique: true
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    data_criacao: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    data_validade: {
      type: DataTypes.DATE
    },
    status: {
      type: DataTypes.ENUM('pendente', 'aprovado', 'rejeitado', 'expirado'),
      defaultValue: 'pendente'
    },
    // Novos campos do veículo
    placa: {
      type: DataTypes.STRING
    },
    odometro: {
      type: DataTypes.STRING
    },
    tanque: {
      type: DataTypes.ENUM('vazio', '1/4', '1/2', '3/4', 'cheio'),
      defaultValue: 'vazio'
    },
    montadora: {
      type: DataTypes.STRING
    },
    veiculo: {
      type: DataTypes.STRING
    },
    combustivel: {
      type: DataTypes.STRING
    },
    ano: {
      type: DataTypes.STRING
    },
    motor: {
      type: DataTypes.STRING
    },
    modelo: {
      type: DataTypes.STRING
    },
    // Campos financeiros e descritivos
    descricao_problema: {
      type: DataTypes.TEXT
    },
    descricao_servico: {
      type: DataTypes.TEXT
    },
    condicao_pagamento: {
      type: DataTypes.STRING
    },
    garantia_servico: {
      type: DataTypes.STRING
    },
    total_desconto: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    valor_total: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    valor_final: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    observacoes: {
      type: DataTypes.TEXT
    },
    itens: {
      type: DataTypes.JSON,
      defaultValue: []
    }
  });

  Orcamento.associate = function(models) {
    Orcamento.belongsTo(models.Cliente, {
      foreignKey: 'cliente_id',
      as: 'cliente'
    });
  };

  // Hook para gerar número automático
  Orcamento.beforeCreate(async (orcamento) => {
    const ultimoOrcamento = await Orcamento.findOne({
      order: [['id', 'DESC']]
    });
    const proximoNumero = ultimoOrcamento ? parseInt(ultimoOrcamento.numero) + 1 : 1;
    orcamento.numero = String(proximoNumero).padStart(6, '0');
  });

  // Hook para calcular valor final com desconto
  Orcamento.beforeSave((orcamento) => {
    const valorTotal = parseFloat(orcamento.valor_total) || 0;
    const desconto = parseFloat(orcamento.total_desconto) || 0;
    orcamento.valor_final = valorTotal - desconto;
  });

  return Orcamento;
};