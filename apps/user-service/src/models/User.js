const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true},
    full_name: { type: DataTypes.STRING, allowNull: false},
    email: { type: DataTypes.STRING, allowNull: false, unique: true},
    password: { type: DataTypes.STRING, allowNull: false},
    role: { type: DataTypes.ENUM("customer", "delivery_person", "admin", "super_admin")},
    address: { type: DataTypes.STRING},
    area_id: { type: DataTypes.BIGINT, references: { model: "areas", key: "area_id"}},
    phone: { type: DataTypes.STRING},
    created_at: { type: DataTypes.DATE},
    updated_at: { type: DataTypes.DATE},
    approved: { type: DataTypes.BOOLEAN, defaultValue: 0},
    fcm_token: { type: DataTypes.STRING},
    refresh_token: { type: DataTypes.TEXT},
    password_reset_token: { type: DataTypes.STRING},
    password_reset_expires: { type: DataTypes.DATE},
    status: { type: DataTypes.ENUM("active", "inactive", "deleted"), defaultValue: "active"},
    deleted_at: { type: DataTypes.DATE },
    // Customer status management: pending | accepted | rejected | disabled | blocked
    customer_status: {
        type: DataTypes.ENUM("pending", "accepted", "rejected", "disabled", "blocked"),
        defaultValue: "pending",
        allowNull: true,
        comment: "For role=customer only; null for other roles",
    },
    rejection_reason: { type: DataTypes.TEXT, allowNull: true },
    rejected_at: { type: DataTypes.DATE, allowNull: true },
    blocked_at: { type: DataTypes.DATE, allowNull: true },
    blocked_reason: { type: DataTypes.TEXT, allowNull: true },
}, {
    tableName: "users",
    timestamps: true,
    underscored: true,
})

module.exports = User;