export {};
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Menu = require('./Menu');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  vendorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  menuId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  totalPrice: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
});

Order.belongsTo(User, { foreignKey: 'userId' });
Order.belongsTo(Menu, { foreignKey: 'menuId' });
User.hasMany(Order, { foreignKey: 'userId' });
Menu.hasMany(Order, { foreignKey: 'menuId' });

module.exports = Order;
