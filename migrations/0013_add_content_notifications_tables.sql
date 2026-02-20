-- Migration: Add content_notifications and user_notification_cleared tables
-- Description: In-app notification history and per-user "cleared" state for /notifications page

CREATE TABLE IF NOT EXISTS content_notifications (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_notifications_created ON content_notifications(created_at);

CREATE TABLE IF NOT EXISTS user_notification_cleared (
  user_id VARCHAR PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  cleared_at TIMESTAMP NOT NULL DEFAULT NOW()
);
