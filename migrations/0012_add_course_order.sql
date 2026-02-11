-- Migration: Add order column to courses table
-- Date: 2025-01-XX
-- Description: Adds order field to courses table for custom sorting in admin

-- Add order column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'courses' 
        AND column_name = 'order'
    ) THEN
        ALTER TABLE courses 
        ADD COLUMN "order" INTEGER DEFAULT 0;
        
        -- Create index for faster sorting
        CREATE INDEX IF NOT EXISTS idx_courses_order ON courses("order");
        
        -- Initialize order based on creation date (oldest first)
        UPDATE courses 
        SET "order" = subquery.row_number
        FROM (
            SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_number
            FROM courses
        ) AS subquery
        WHERE courses.id = subquery.id;
        
        RAISE NOTICE 'Column order added to courses table';
    ELSE
        RAISE NOTICE 'Column order already exists';
    END IF;
END $$;

