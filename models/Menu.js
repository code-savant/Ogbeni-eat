const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Vendor = require('./Vendor');

const Menu = sequelize.define('Menu', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  vendorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

Menu.belongsTo(Vendor, { foreignKey: 'vendorId' });
Vendor.hasMany(Menu, { foreignKey: 'vendorId' });

module.exports = Menu;
