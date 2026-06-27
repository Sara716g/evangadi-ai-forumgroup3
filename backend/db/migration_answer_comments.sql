-- Migration: Add answer_comments table
-- Run this SQL against your database

DROP TABLE IF EXISTS `answer_comments`;
CREATE TABLE `answer_comments` (
    `comment_id` INT AUTO_INCREMENT PRIMARY KEY,
    `answer_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `content` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`answer_id`) REFERENCES `answers`(`answer_id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
    INDEX `idx_answer_comments_answer_id` (`answer_id`),
    INDEX `idx_answer_comments_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
