const Sequelize = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

let sequelize;
if (dbConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[dbConfig.use_env_variable], dbConfig);
} else {
  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    dbConfig
  );
}

const db = {};

// Importar modelos
db.Usuario = require('./Usuario')(sequelize, Sequelize);
db.Cliente = require('./Cliente')(sequelize, Sequelize);
db.Orcamento = require('./Orcamento')(sequelize, Sequelize);
db.HistoricoAlteracao = require('./HistoricoAlteracao')(sequelize, Sequelize);
db.DadosEmpresa = require('./DadosEmpresa')(sequelize, Sequelize);

// Associações
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;