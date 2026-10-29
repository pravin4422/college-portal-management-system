-- Admin constraint: only one admin allowed per school
-- Run this in your MySQL database

-- Ensures only one row with role='admin' can exist in app_users
-- Uses a unique index on a generated expression (MySQL 8.0+)
CREATE UNIQUE INDEX uq_single_admin
  ON app_users ((CASE WHEN role = 'admin' THEN 'admin' ELSE NULL END));
