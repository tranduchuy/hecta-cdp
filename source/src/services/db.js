const config = require('config');
const sequelize = require('sequelize');
const log4js = require('log4js');
const logger = log4js.getLogger('app');

const mysqlConfig = config['mysql'];
const seqInitializer = new sequelize(
  mysqlConfig.database,
  mysqlConfig.user,
  mysqlConfig.password,
  {
    host: mysqlConfig.host,
    dialect: 'mysql',
    operatorsAliases: false
  });

module.exports = {
  connect: (callback) => {
    seqInitializer
      .authenticate()
      .then(() => {
        logger.info('Connect database successfully');
        callback();
      })
      .catch((err) => {
        logger.error('Connect database failure', err);
      });
  },
  sequelize: seqInitializer
};