const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true},
    full_name: { type: DataTypes.STRING, allowNull: false},
    email: { type: DataTypes.STRING, allowNull: false, unique: true},
    password: { type: DataTypes.STRING, allowNull: false},
    role: { type: DataTypes.ENUM("customer", "delivery_person", "admin", "super_admin")},
    address: { type: DataTypes.STRING},
    area_id: { type: DataTypes.BIGINT},
    phone: { type: DataTypes.STRING},
    created_at: { type: DataTypes.DATE}, //remeber sequelize itself create createdAt columns when doing this even you have created_at
    updated_at: { type: DataTypes.DATE},
    approved: { type: DataTypes.BOOLEAN, defaultValue: 0},
    fcm_token: { type: DataTypes.STRING}
}, {
    tableName: "users",
    timestamps: true,
    underscored: true //here I tell sequelize to use snake_case for column names
})

module.exports = User;  