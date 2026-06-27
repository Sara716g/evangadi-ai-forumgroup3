-- Migration: Add answer_votes table for upvote functionality
-- Run this SQL against your database

DROP TABLE IF EXISTS `answer_votes`;
CREATE TABLE `answer_votes` (
    `vote_id` INT AUTO_INCREMENT PRIMARY KEY,
    `answer_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`answer_id`) REFERENCES `answers`(`answer_id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
    UNIQUE KEY `uniq_answer_votes` (`answer_id`, `user_id`),
    INDEX `idx_answer_votes_answer_id` (`answer_id`),
    INDEX `idx_answer_votes_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
