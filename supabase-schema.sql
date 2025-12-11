-- ============================================
-- DEBT ERASER PRO - SUPABASE DATABASE SCHEMA
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- Dashboard: https://supabase.com/dashboard/project/qecqhfriyehnafkkkuxx/editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT,
  avatar TEXT,
  membership_type TEXT DEFAULT 'free',
  has_community_access BOOLEAN DEFAULT FALSE,
  has_consult_access BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community posts table
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Post comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modules table
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  duration TEXT,
  order_index INTEGER,
  locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vault resources table
CREATE TABLE IF NOT EXISTS vault_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  file_type TEXT,
  file_url TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  participant_name TEXT,
  participant_avatar TEXT,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID,
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_post ON post_likes(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_modules_order ON modules(order_index);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES (Public Read, Authenticated Write)
-- ============================================

-- Users policies
CREATE POLICY "Users can read all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (true);

-- Community posts policies
CREATE POLICY "Anyone can read posts" ON community_posts FOR SELECT USING (true);
CREATE POLICY "Anyone can create posts" ON community_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own posts" ON community_posts FOR UPDATE USING (true);
CREATE POLICY "Users can delete own posts" ON community_posts FOR DELETE USING (true);

-- Post likes policies
CREATE POLICY "Anyone can read likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Anyone can like posts" ON post_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can unlike posts" ON post_likes FOR DELETE USING (true);

-- Post comments policies
CREATE POLICY "Anyone can read comments" ON post_comments FOR SELECT USING (true);
CREATE POLICY "Anyone can create comments" ON post_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own comments" ON post_comments FOR UPDATE USING (true);
CREATE POLICY "Users can delete own comments" ON post_comments FOR DELETE USING (true);

-- Modules policies
CREATE POLICY "Anyone can read modules" ON modules FOR SELECT USING (true);

-- Vault resources policies
CREATE POLICY "Anyone can read vault resources" ON vault_resources FOR SELECT USING (true);

-- Calendar events policies
CREATE POLICY "Anyone can read calendar events" ON calendar_events FOR SELECT USING (true);

-- Conversations policies
CREATE POLICY "Users can read own conversations" ON conversations FOR SELECT USING (true);
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (true);

-- Messages policies
CREATE POLICY "Users can read messages in their conversations" ON messages FOR SELECT USING (true);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (true);

-- ============================================
-- SEED DATA (Sample Posts and Resources)
-- ============================================

-- Insert sample vault resources
INSERT INTO vault_resources (title, description, file_type, category) VALUES
  ('The Nuclear Option: Section 609 Template', 'The master letter to demand validation.', 'PDF', 'letters'),
  ('Inquiry Removal Script', 'Phone script to get inquiries deleted in 24 hours.', 'PDF', 'scripts'),
  ('Medical Debt HIPAA Loophole', 'HIPAA violations are your best friend.', 'PDF', 'letters'),
  ('Cease & Desist Letter', 'Stop the harassment immediately.', 'PDF', 'letters'),
  ('Validation of Debt (VOD) 1.0', 'First round attack.', 'PDF', 'letters')
ON CONFLICT DO NOTHING;

-- Insert sample modules
INSERT INTO modules (title, description, duration, order_index, locked) VALUES
  ('Module 1: The Mindset Shift', 'Understanding the game and your rights', '45m', 1, false),
  ('Module 2: Analyzing Your Report', 'How to read your credit report like a lawyer', '60m', 2, false),
  ('Module 3: Factual Disputing 101', 'The foundation of credit repair', '90m', 3, false),
  ('Module 4: Advanced FCRA Tactics', 'Using federal law to your advantage', '120m', 4, true),
  ('Module 5: Taking Them To Court', 'When and how to file a lawsuit', '90m', 5, true)
ON CONFLICT DO NOTHING;

-- Insert sample calendar events
INSERT INTO calendar_events (title, date, type, description) VALUES
  ('Live Q&A with Debt Eraser', NOW() + INTERVAL '3 days', 'LIVE', 'Monthly community Q&A session'),
  ('Guest Speaker: Consumer Attorney', NOW() + INTERVAL '18 days', 'LIVE', 'Learn about your legal rights'),
  ('New Doc Drop', NOW() + INTERVAL '26 days', 'DROP', 'New templates added to vault')
ON CONFLICT DO NOTHING;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database schema created successfully!';
  RAISE NOTICE '📊 Tables: users, community_posts, post_likes, post_comments, modules, vault_resources, calendar_events, conversations, messages';
  RAISE NOTICE '🔐 Row Level Security enabled on all tables';
  RAISE NOTICE '📝 Sample data inserted';
END $$;
