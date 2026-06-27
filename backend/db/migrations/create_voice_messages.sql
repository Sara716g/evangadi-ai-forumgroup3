CREATE TABLE IF NOT EXISTS voice_messages (
  voice_message_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INT NOT NULL,
  duration FLOAT NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  question_id INT DEFAULT NULL,
  answer_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE SET NULL,
  FOREIGN KEY (answer_id) REFERENCES answers(answer_id) ON DELETE SET NULL
);
