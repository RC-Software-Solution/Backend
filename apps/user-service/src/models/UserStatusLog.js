const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UserStatusLog = sequelize.define(
  "UserStatusLog",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
    },
    previous_status: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "e.g. pending, accepted, rejected, disabled, blocked",
    },
    new_status: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "rejection_reason, blocked_reason, or free text",
    },
    performed_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
      comment: "Admin/user who performed the action; null for system (e.g. auto-block)",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "user_status_logs",
    timestamps: true,
    underscored: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = UserStatusLog;
