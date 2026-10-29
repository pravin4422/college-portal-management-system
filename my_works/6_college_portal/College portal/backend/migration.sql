-- 1. Add roll_number column to students table
ALTER TABLE students ADD COLUMN roll_number VARCHAR(50) DEFAULT NULL;

-- 2. Add UNIQUE constraint on student_dashboard_data to prevent duplicate rows
--    (safe to run even if upsert logic already exists in DAO)
ALTER TABLE student_dashboard_data
  ADD CONSTRAINT uq_student_data_type UNIQUE (student_id, data_type);

-- 3. student_dashboard_data table (create if not exists)
CREATE TABLE IF NOT EXISTS student_dashboard_data (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  VARCHAR(50)  NOT NULL,
  data_type   VARCHAR(50)  NOT NULL,
  content     LONGTEXT,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_student_data_type (student_id, data_type)
);

-- 4. Dedicated student_cgpa table for fast CGPA queries
CREATE TABLE IF NOT EXISTS student_cgpa (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  student_id     VARCHAR(50)  NOT NULL,
  cgpa           DECIMAL(4,2) DEFAULT NULL,
  total_subjects INT          DEFAULT 0,
  updated_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cgpa_student (student_id)
);

-- 5. Dedicated student_grades table — stores per-subject marks for each student
CREATE TABLE IF NOT EXISTS student_grades (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(50)  NOT NULL,
  subject    VARCHAR(100) NOT NULL,
  score      VARCHAR(20)  DEFAULT NULL,
  max_score  VARCHAR(20)  DEFAULT NULL,
  grade      VARCHAR(10)  DEFAULT NULL,
  updated_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_grade_student_subject (student_id, subject)
);

-- 6. Upsert CGPA example (run from app or manually)
-- INSERT INTO student_cgpa (student_id, cgpa, total_subjects)
-- VALUES ('123', 8.50, 6)
-- ON DUPLICATE KEY UPDATE cgpa = VALUES(cgpa), total_subjects = VALUES(total_subjects);

-- 7. Upsert grade example
-- INSERT INTO student_grades (student_id, subject, score, max_score, grade)
-- VALUES ('123', 'Mathematics', '85', '100', 'A')
-- ON DUPLICATE KEY UPDATE score = VALUES(score), max_score = VALUES(max_score), grade = VALUES(grade);
