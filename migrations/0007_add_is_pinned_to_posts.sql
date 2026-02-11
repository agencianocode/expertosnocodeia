-- Add is_pinned column to community_posts table
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- Create index for pinned posts
CREATE INDEX IF NOT EXISTS idx_posts_pinned ON community_posts(channel_id, is_pinned) WHERE is_pinned = true;

