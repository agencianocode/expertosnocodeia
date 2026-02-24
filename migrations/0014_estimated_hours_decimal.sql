-- Migration: Allow decimal hours for courses (e.g. 5.5 hours)
-- Description: Change estimated_hours from integer to real

ALTER TABLE courses
  ALTER COLUMN estimated_hours TYPE real USING estimated_hours::real;
