-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: db:3306
-- Generation Time: Sep 16, 2025 at 03:58 PM
-- Server version: 9.2.0
-- PHP Version: 8.2.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `rc`
--

-- --------------------------------------------------------

--
-- Table structure for table `areas`
--

CREATE TABLE `areas` (
  `area_id` bigint NOT NULL,
  `area_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `areas`
--

INSERT INTO `areas` (`area_id`, `area_name`) VALUES
(1, 'Area 1');

-- --------------------------------------------------------

--
-- Table structure for table `food_items`
--

CREATE TABLE `food_items` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `meal_type` enum('veg','non-veg','other') NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `meal_sessions`
--

CREATE TABLE `meal_sessions` (
  `id` int NOT NULL,
  `date` date NOT NULL,
  `meal_time` enum('breakfast','lunch','dinner') NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `meal_session_items`
--

CREATE TABLE `meal_session_items` (
  `id` int NOT NULL,
  `meal_session_id` int NOT NULL,
  `food_item_id` int NOT NULL,
  `available_quantity` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` varchar(255) NOT NULL,
  `customer_id` varchar(255) NOT NULL,
  `status` enum('pending','preparing','delivering','delivered','completed','cancelled') NOT NULL DEFAULT 'pending',
  `meal_time` enum('breakfast','lunch','dinner') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `payment_status` enum('pending','paid','unpaid','ignored') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'pending',
  `area_id` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `customer_id`, `status`, `meal_time`, `total_price`, `payment_status`, `area_id`, `created_at`, `updated_at`) VALUES
('ORD-1756053568157-2pn9vn', 'c4d96e10-5f3c-4381-ac92-4b6b76c974f7', 'pending', 'dinner', 1200.00, 'pending', 1, '2025-09-06 16:39:28', '2025-09-06 15:32:03'),
('ORD-1756924001865-tlzkg6', 'c4d96e10-5f3c-4381-ac92-4b6b76c974f7', 'pending', 'dinner', 1200.00, 'pending', 1, '2025-09-06 18:26:41', '2025-09-06 15:32:07'),
('ORD-1757052478725-gc2b5t', 'c4d96e10-5f3c-4381-ac92-4b6b76c974f7', 'pending', 'dinner', 1200.00, 'paid', 1, '2025-09-05 06:07:58', '2025-09-07 13:26:52');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` varchar(255) NOT NULL,
  `order_id` varchar(255) NOT NULL,
  `food_name` varchar(255) NOT NULL,
  `food_description` text,
  `meal_type` enum('veg','non-veg','other') NOT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `food_name`, `food_description`, `meal_type`, `quantity`, `price`) VALUES
('ORDITM-1756053568171-wf4d12', 'ORD-1756053568157-2pn9vn', 'Fish Fried Rice', 'Fried rice with spicy chicken curry', 'non-veg', 1, 600.00),
('ORDITM-1756053568176-4dqgck', 'ORD-1756053568157-2pn9vn', 'Veg Salad', 'Mixed seasonal fruits', 'veg', 1, 600.00),
('ORDITM-1756924001890-x6sfpn', 'ORD-1756924001865-tlzkg6', 'Fish Fried Rice', 'Fried rice with spicy chicken curry', 'non-veg', 1, 600.00),
('ORDITM-1756924001894-33orhl', 'ORD-1756924001865-tlzkg6', 'Veg Salad', 'Mixed seasonal fruits', 'veg', 1, 600.00),
('ORDITM-1757052478772-4jxluk', 'ORD-1757052478725-gc2b5t', 'Fish Fried Rice', 'Fried rice with spicy chicken curry', 'non-veg', 1, 600.00),
('ORDITM-1757052478783-c5ruwp', 'ORD-1757052478725-gc2b5t', 'Veg Salad', 'Mixed seasonal fruits', 'veg', 1, 600.00);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('customer','delivery_person','admin','super_admin') NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `area_id` bigint DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `approved` tinyint(1) DEFAULT NULL,
  `fcm_token` varchar(255) DEFAULT NULL,
  `refresh_token` text,
  `status` enum('active','inactive','deleted') DEFAULT 'active',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `unpaid_orders_count` int DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `password`, `role`, `address`, `area_id`, `phone`, `created_at`, `updated_at`, `approved`, `fcm_token`, `refresh_token`, `status`, `deleted_at`, `unpaid_orders_count`) VALUES
('1ae33079-561c-41e8-aae8-d2c0cb925c7d', 'Kasun', 'kasun@gmail.com', '$2a$10$6fcVIqaTpkRuOeeAXQTiVOXtbJsWtutxZ28UYIVHbYYA3DkzU0eA6', 'delivery_person', NULL, NULL, '0752703220', '2025-02-21 05:52:25', '2025-09-10 18:14:31', 1, NULL, 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFhZTMzMDc5LTU2MWMtNDFlOC1hYWU4LWQyYzBjYjkyNWM3ZCIsImlhdCI6MTc1NzUyODA3MSwiZXhwIjoxNzYwMTIwMDcxfQ.gyln4iXRYC9Df7pJN7mFLBbUqTDOFRXXEJhoDfTJqOcJD7RL3ZxXMegxJP3tM8Z2tc95hV8xkOCJi0hRx1hmglkZEu9mSTijGE5AS_yWiYu57uBsLiRp1FBUHhdjYo4r_fjg-2vxZ7yHcpG2yCb9ev6NMiCbfo5yTP6OohTDPvxnjkjhKcD9sJ3KoEYYq6MbIgjYbeQifSpoVCY1XORz0Ql0-7De6ncw3GfjjlQ-soDIBh00lHKTnk8sdOrB133H7wyKp2YfKIUff1eMZrFmMypEyIGVi9bLeekBHnCowcVdloGOjPXivkfV34ULSM858hEoIH4pBOP5Xh-YG8qQvw', 'active', NULL, 0),
('1f268e2a-a983-4d54-bdc3-476f39a85525', 'Rishan', 'rishan@gmail.com', '$2a$10$yo7b2bruEmh01L8i8YvSNurl/BrPSULYmu/Kpt7PlDkWVFuS/rx.6', 'super_admin', NULL, NULL, '0752703220', '2025-02-21 06:13:27', '2025-02-21 06:13:27', 1, NULL, NULL, 'active', NULL, 0),
('8e3289c8-64a9-4bf0-806a-628e5bd4ab08', 'naveen', 'naveen@gmail.com', '$2a$10$yGGR3vf6BLwKrUH2SoSDOO63gwbk8e5wedKx0qiOOoDp9jk/Snp6u', 'admin', NULL, NULL, '0752703220', '2025-02-21 06:13:53', '2025-09-10 18:17:14', 1, NULL, 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjhlMzI4OWM4LTY0YTktNGJmMC04MDZhLTYyOGU1YmQ0YWIwOCIsImlhdCI6MTc1NzUyODIzNCwiZXhwIjoxNzYwMTIwMjM0fQ.PTOXL4bbUbCZm0-byOSnHAeeo2owrhWZnopRysaPdb0WmNid1tblZc2Xauz5eltU2vUSA45rUOK5OS1tZxH_cGZioawc1t5011-UFevTep4yAE8qwd-Yn6WcGMar0OdKdKJoo3rTp-2LpYmlQpG1Lk_sNeYs9OiRMC7LE2uxuXbaBZsMn9loOJpnm4bBhMHN6yO_BGb-U7gkxBtyN-S0KeJd1_3YQJ6dH4nBaNtb7uAnGwh8ALJLKe_kYuNpzzg_1M2W9-UqrXhkRA3edPGwDSBG06No3DVmcUZ32qUqNtyYBCXePb-RVkPPpkx7Zj6C8QQzXNjN5fVPbsYuH1mWuQ', 'active', NULL, 0),
('c4d96e10-5f3c-4381-ac92-4b6b76c974f7', 'Buddhi Gayan', 'buddhigayanmaleesha2000@gmail.com', '$2a$10$f2QnV2sjWBU8xVvzJwlpLu94dEGdU7HeLjZQM3BH4qp5tchaDd.MO', 'customer', 'No. 81/6, Kandy', 1, '0752703220', '2025-02-21 06:13:02', '2025-09-07 08:47:25', 1, NULL, 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImM0ZDk2ZTEwLTVmM2MtNDM4MS1hYzkyLTRiNmI3NmM5NzRmNyIsImlhdCI6MTc1NzIzNDg0NSwiZXhwIjoxNzU5ODI2ODQ1fQ.F3rEWmi3zfRXWFhx5dQ5Iz8urwQvJwEdbMrQ-3803r3yzoujln2k2OfOgDe-xe6Ta-eCuzqGNvB_94Mn5_U9gQIdWWyHh40yDVS_oYQFPG6MZx68hg6ntJ6fVJ0EMlANKctGga0K3wan7QOVpbFRYfuH-9L3xb4L4OKPYK-uqYA6YI6OzLKVtAlJtqvmC5XvW4XJ3anp58d12Lx8cB2YjDLejDLnpAJuOwaSjHnIOcj_VO0KmtuhpoC5N-D2aPYD6CthSnR3uYqSiFjjCHBTMa__SvYD8uBIlEyC7mY31wfSjZrSggMuJP_8G0L3ihzCQKnJiKcNOSW6xpnA-R5R5g', 'active', NULL, 0),
('d735cde4-5f2f-4cf4-b755-3fbbb0960284', 'kaumi Nethma', 'kauminethma@gmail.com', '$2a$10$2/3oMVv.OTPWhBNA.Spl6.4wEQg6AMF6B2LlyExp9wvU.YNwiKEza', 'customer', 'No. 81/6, Ambilipitiya', 1, '0752703220', '2025-02-21 06:12:31', '2025-09-07 05:51:54', 1, NULL, NULL, 'deleted', '2025-09-07 05:51:54', 3);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `areas`
--
ALTER TABLE `areas`
  ADD PRIMARY KEY (`area_id`);

--
-- Indexes for table `food_items`
--
ALTER TABLE `food_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `meal_sessions`
--
ALTER TABLE `meal_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `date` (`date`,`meal_time`);

--
-- Indexes for table `meal_session_items`
--
ALTER TABLE `meal_session_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_session_item` (`meal_session_id`,`food_item_id`),
  ADD KEY `fk_food` (`food_item_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `area_id` (`area_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `areas`
--
ALTER TABLE `areas`
  MODIFY `area_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `meal_sessions`
--
ALTER TABLE `meal_sessions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `meal_session_items`
--
ALTER TABLE `meal_session_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `meal_session_items`
--
ALTER TABLE `meal_session_items`
  ADD CONSTRAINT `fk_food` FOREIGN KEY (`food_item_id`) REFERENCES `food_items` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_session` FOREIGN KEY (`meal_session_id`) REFERENCES `meal_sessions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`area_id`) REFERENCES `areas` (`area_id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
