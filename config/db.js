const { Sequelize } = require('sequelize');

const connectionString = process.env.DATABASE_URL;

const sequelize = new Sequelize(connectionString, {
  logging: false,
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  connectDB,
};
