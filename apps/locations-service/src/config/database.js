require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,
        dialectOptions: {
            decimalNumbers: true
        }
    }
);

sequelize
    .authenticate()
    .then(() => console.log('Locations DB connected'))
    .catch((error) => console.log('Locations DB connection failed', error));

module.exports = sequelize;


