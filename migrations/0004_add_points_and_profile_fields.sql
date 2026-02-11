-- Add points and level columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create user_points table for tracking points earned
CREATE TABLE IF NOT EXISTS user_points (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  activity_type VARCHAR NOT NULL,
  activity_id VARCHAR,
  description VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_points_user_created ON user_points(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_points_activity ON user_points(activity_type, activity_id);

