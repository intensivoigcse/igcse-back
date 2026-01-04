const { Sequelize } = require('sequelize');
jest.setTimeout(30000);
Sequelize.prototype.log = () => {};