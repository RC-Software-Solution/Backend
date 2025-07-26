const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const basename = path.basename(__filename);
const db = {};

//load all model files
fs.readdirSync(__dirname)
.filter((file) => {
    return file !==basename && file.endsWith('.model.js');
})
.forEach((file) => {
    const modelDef = require(path.join(__dirname, file));
    const model = modelDef(sequelize, DataTypes); 
    db[model.name] = model;
});

//register associations
Object.values(db).forEach((model) => {
    if (model.associate) {
        model.associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

