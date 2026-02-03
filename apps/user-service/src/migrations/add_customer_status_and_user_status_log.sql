-- Customer User Management: extend users and add user_status_logs
-- Run against your MySQL database. If a column already exists, skip that statement.

ALTER TABLE users ADD COLUMN customer_status ENUM('pending','accepted','rejected','disabled','blocked') DEFAULT 'pending' NULL;
ALTER TABLE users ADD COLUMN rejection_reason TEXT NULL;
ALTER TABLE users ADD COLUMN rejected_at DATETIME NULL;
ALTER TABLE users ADD COLUMN blocked_at DATETIME NULL;
ALTER TABLE users ADD COLUMN blocked_reason TEXT NULL;

-- Create user_status_logs table for audit trail
CREATE TABLE IF NOT EXISTS user_status_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  previous_status VARCHAR(50) NULL,
  new_status VARCHAR(50) NOT NULL,
  reason TEXT NULL,
  performed_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_status_logs_user_id (user_id),
  INDEX idx_user_status_logs_created_at (created_at),
  CONSTRAINT fk_user_status_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_status_logs_performed_by FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
);
