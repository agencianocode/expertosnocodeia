-- Migration: Add emailVerificationExpires column to users table
-- Date: 2025-01-XX
-- Description: Adds expiration timestamp for email verification tokens

-- Add emailVerificationExpires column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'email_verification_expires'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN email_verification_expires TIMESTAMP;
        
        RAISE NOTICE 'Column email_verification_expires added to users table';
    ELSE
        RAISE NOTICE 'Column email_verification_expires already exists';
    END IF;
END $$;

