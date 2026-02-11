-- Migration: Add role column to users table
-- Date: 2025-01-XX
-- Description: Adds role field to users table for role-based access control

-- Add role column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN role VARCHAR DEFAULT 'user' NOT NULL;
        
        -- Update existing users to have 'user' role
        UPDATE users SET role = 'user' WHERE role IS NULL;
        
        RAISE NOTICE 'Column role added to users table';
    ELSE
        RAISE NOTICE 'Column role already exists';
    END IF;
END $$;

