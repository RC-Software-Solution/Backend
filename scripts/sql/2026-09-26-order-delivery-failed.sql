ALTER TABLE `orders`
  MODIFY `status` enum('pending','preparing','delivering','delivered','completed','cancelled','delivery_failed') NOT NULL DEFAULT 'pending',
  ADD COLUMN `failure_reason` text NULL AFTER `status`;
