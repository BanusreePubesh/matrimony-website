-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 21, 2026 at 09:08 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `vivahshaadi`
--

-- --------------------------------------------------------

--
-- Table structure for table `interests`
--

CREATE TABLE `interests` (
  `id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `interests`
--

INSERT INTO `interests` (`id`, `sender_id`, `receiver_id`, `status`, `created_at`) VALUES
(1, 1, 7, 'pending', '2026-07-14 17:02:39'),
(2, 3, 7, 'accepted', '2026-07-14 17:02:39'),
(3, 2, 7, 'accepted', '2026-07-14 17:02:39');

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `text` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `sender_id`, `receiver_id`, `text`, `created_at`) VALUES
(1, 3, 7, 'Hello Arun! I liked your profile.', '2026-07-14 17:02:39'),
(2, 7, 3, 'Hi Divya, thank you! I liked your profile too. Let us connect.', '2026-07-14 17:02:39');

-- --------------------------------------------------------

--
-- Table structure for table `profile_views`
--

CREATE TABLE `profile_views` (
  `viewer_id` int(11) NOT NULL,
  `viewed_id` int(11) NOT NULL,
  `viewed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` int(11) NOT NULL,
  `reported_id` int(11) NOT NULL,
  `reporter_id` int(11) NOT NULL,
  `type` varchar(100) NOT NULL,
  `severity` varchar(20) DEFAULT 'Low',
  `status` varchar(20) DEFAULT 'open',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reports`
--

INSERT INTO `reports` (`id`, `reported_id`, `reporter_id`, `type`, `severity`, `status`, `created_at`) VALUES
(1, 8, 1, 'Fake Profile', 'High', 'open', '2026-07-14 17:02:39');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `name` varchar(100) NOT NULL,
  `gender` varchar(10) NOT NULL,
  `age` int(11) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `pincode` varchar(15) DEFAULT NULL,
  `religion` varchar(50) DEFAULT NULL,
  `caste` varchar(50) DEFAULT NULL,
  `education` varchar(100) DEFAULT NULL,
  `job` varchar(100) DEFAULT NULL,
  `salary` varchar(50) DEFAULT NULL,
  `height` varchar(20) DEFAULT NULL,
  `complexion` varchar(50) DEFAULT NULL,
  `rasi` varchar(50) DEFAULT NULL,
  `nakshatra` varchar(50) DEFAULT NULL,
  `dosham` varchar(100) DEFAULT NULL,
  `horoscope_path` varchar(255) DEFAULT NULL,
  `horoscope_status` varchar(20) DEFAULT 'approved',
  `img` varchar(255) DEFAULT NULL,
  `premium_plan` varchar(20) DEFAULT 'Basic',
  `views_used` int(11) DEFAULT 0,
  `interests_used` int(11) DEFAULT 0,
  `online` tinyint(4) DEFAULT 1,
  `status` varchar(20) DEFAULT 'Active',
  `verified` tinyint(4) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `phone`, `name`, `gender`, `age`, `city`, `state`, `country`, `pincode`, `religion`, `caste`, `education`, `job`, `salary`, `height`, `complexion`, `rasi`, `nakshatra`, `dosham`, `horoscope_path`, `horoscope_status`, `img`, `premium_plan`, `views_used`, `interests_used`, `online`, `status`, `verified`, `created_at`) VALUES
(1, '9999999901', 'Priya Sharma', 'female', 26, 'Chennai', 'Tamil Nadu', 'India', '600001', 'Hindu', 'Brahmin', 'M.Tech', 'Software Engineer', '12 LPA', '5\'4\"', 'Fair', 'Mesham', 'Ashwini', 'None', NULL, 'approved', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&fit=crop&q=80', 'Premium', 0, 0, 1, 'Active', 1, '2026-07-14 17:02:39'),
(2, '9999999902', 'Ananya Krishnan', 'female', 24, 'Coimbatore', 'Tamil Nadu', 'India', '641001', 'Hindu', 'Mudaliar', 'MBA', 'Bank Manager', '8 LPA', '5\'3\"', 'Wheatish', 'Rishabam', 'Rohini', 'Chevvai Dosham', NULL, 'approved', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&fit=crop&q=80', 'Basic', 0, 0, 1, 'Active', 1, '2026-07-14 17:02:39'),
(3, '9999999903', 'Divya Nair', 'female', 27, 'Bangalore', 'Karnataka', 'India', '560001', 'Hindu', 'Nair', 'MBBS', 'Doctor', '18 LPA', '5\'5\"', 'Fair', 'Mithunam', 'Thiruvathirai', 'None', NULL, 'approved', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&fit=crop&q=80', 'Gold', 0, 0, 1, 'Active', 1, '2026-07-14 17:02:39'),
(4, '9999999904', 'Kavitha Reddy', 'female', 25, 'Hyderabad', 'Telangana', 'India', '500001', 'Hindu', 'Reddy', 'B.Tech', 'Data Analyst', '10 LPA', '5\'2\"', 'Wheatish', 'Katakam', 'Pushyam', 'None', NULL, 'approved', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&fit=crop&q=80', 'Basic', 0, 0, 1, 'Active', 1, '2026-07-14 17:02:39'),
(5, '9999999905', 'Meena Iyer', 'female', 28, 'Mumbai', 'Maharashtra', 'India', '400001', 'Hindu', 'Iyer', 'CA', 'Chartered Accountant', '15 LPA', '5\'3\"', 'Fair', 'Simmam', 'Magam', 'None', NULL, 'approved', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&fit=crop&q=80', 'Premium', 0, 0, 1, 'Active', 1, '2026-07-14 17:02:39'),
(6, '9999999906', 'Lakshmi Venkat', 'female', 23, 'Madurai', 'Tamil Nadu', 'India', '625001', 'Hindu', 'Pillai', 'B.E.', 'Teacher', '5 LPA', '5\'1\"', 'Fair', 'Kanni', 'Uthiram', 'Sevvai Dosham', NULL, 'approved', 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&fit=crop&q=80', 'Basic', 0, 0, 1, 'Active', 0, '2026-07-14 17:02:39'),
(7, '9999999911', 'Arun Kumar', 'male', 28, 'Chennai', 'Tamil Nadu', 'India', '600001', 'Hindu', 'Brahmin', 'B.Tech', 'Software Engineer', '15 LPA', '5\'10\"', 'Fair', 'Mesham', 'Ashwini', 'None', NULL, 'approved', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&fit=crop&q=80', 'Basic', 0, 0, 1, 'Active', 1, '2026-07-14 17:02:39'),
(8, '9999999912', 'Rajesh Pillai', 'male', 30, 'Madurai', 'Tamil Nadu', 'India', '625001', 'Hindu', 'Pillai', 'MBA', 'Business Manager', '12 LPA', '5\'9\"', 'Wheatish', 'Rishabam', 'Rohini', 'None', NULL, 'approved', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&fit=crop&q=80', 'Gold', 0, 0, 1, 'Pending', 0, '2026-07-14 17:02:39'),
(9, '9999999913', 'Vikram Nair', 'male', 29, 'Bangalore', 'Karnataka', 'India', '560001', 'Hindu', 'Nair', 'MS', 'Product Manager', '25 LPA', '6\'0\"', 'Fair', 'Mithunam', 'Thiruvathirai', 'Sevvai Dosham', NULL, 'approved', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&fit=crop&q=80', 'Premium', 0, 0, 1, 'Active', 1, '2026-07-14 17:02:39');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `interests`
--
ALTER TABLE `interests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_interest` (`sender_id`,`receiver_id`),
  ADD KEY `receiver_id` (`receiver_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `receiver_id` (`receiver_id`);

--
-- Indexes for table `profile_views`
--
ALTER TABLE `profile_views`
  ADD PRIMARY KEY (`viewer_id`,`viewed_id`),
  ADD KEY `viewed_id` (`viewed_id`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reported_id` (`reported_id`),
  ADD KEY `reporter_id` (`reporter_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `phone` (`phone`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `interests`
--
ALTER TABLE `interests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `interests`
--
ALTER TABLE `interests`
  ADD CONSTRAINT `interests_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `interests_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `profile_views`
--
ALTER TABLE `profile_views`
  ADD CONSTRAINT `profile_views_ibfk_1` FOREIGN KEY (`viewer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `profile_views_ibfk_2` FOREIGN KEY (`viewed_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`reported_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
