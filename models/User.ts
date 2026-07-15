export {};
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('vendor', 'customer'),
    allowNull: false,
    defaultValue: 'customer',
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  validate: {
    vendorFieldsOnly() {
      if (this.role !== 'vendor') {
        if (this.location !== undefined && this.location !== null && this.location !== '') {
          throw new Error('Location can only be set if user role is vendor');
        }
        if (this.description !== undefined && this.description !== null && this.description !== '') {
          throw new Error('Description can only be set if user role is vendor');
        }
      }
    }
  }
});

module.exports = User;
