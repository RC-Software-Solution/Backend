-- Password reset: add token and expiry columns to users
-- Run against your MySQL database. If a column already exists, skip that statement.

ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN password_reset_expires DATETIME NULL;
