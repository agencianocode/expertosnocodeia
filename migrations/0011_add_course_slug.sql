-- Migration: Add slug column to courses table
-- Date: 2025-01-XX
-- Description: Adds slug field to courses table for SEO-friendly URLs

-- Add slug column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'courses' 
        AND column_name = 'slug'
    ) THEN
        ALTER TABLE courses 
        ADD COLUMN slug VARCHAR;
        
        -- Create index for faster lookups
        CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
        
        RAISE NOTICE 'Column slug added to courses table';
    ELSE
        RAISE NOTICE 'Column slug already exists';
    END IF;
END $$;

