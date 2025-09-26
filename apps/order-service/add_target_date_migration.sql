-- Simple migration to add target_date field for future orders
-- Run this script on your MySQL database

-- Add target_date column to orders table
ALTER TABLE `orders` 
ADD COLUMN `target_date` DATE NULL 
COMMENT 'Target date for the order. If null, defaults to today.' 
AFTER `meal_time`;

-- Add index for better query performance
CREATE INDEX `idx_orders_target_date` ON `orders` (`target_date`);
