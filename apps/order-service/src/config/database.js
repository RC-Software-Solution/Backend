require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false,
        timezone: '+00:00', // Force UTC for date writes
        dialectOptions: {
            // Ensure MySQL returns DATETIME as strings we can treat as UTC if needed
            dateStrings: true,
            typeCast: true,
        },
    }
);

sequelize.authenticate().then(async () => {
    console.log('Database connected successfully');
    try {
        // Force session time zone to UTC
        await sequelize.query("SET time_zone = '+00:00'");
    } catch (e) {
        console.warn('Failed to set MySQL session time_zone to UTC:', e.message);
    }
}).catch((error) => console.log("Database connection failed",error));

module.exports = sequelize;
