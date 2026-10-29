-- ============================================================
-- TEACHER PROFILE TABLE
-- Run this in your MySQL database
-- ============================================================

CREATE TABLE IF NOT EXISTS teachers (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_email       VARCHAR(255) NOT NULL UNIQUE,
  name             VARCHAR(150),
  employee_id      VARCHAR(50),
  dob              VARCHAR(20),
  gender           VARCHAR(20),
  phone            VARCHAR(20),
  address          TEXT,
  qualification    VARCHAR(255),
  experience       VARCHAR(100),
  department       VARCHAR(100),
  designation      VARCHAR(100),
  join_date        VARCHAR(20),
  class_teacher_of VARCHAR(50),
  subject_classes  VARCHAR(255),
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
