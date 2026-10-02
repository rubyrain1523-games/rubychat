-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'member', -- 'member', 'admin', 'owner'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id),
    content TEXT NOT NULL,
    is_ai BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create DMs table
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_ai BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_ai BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS is_ai BOOLEAN NOT NULL DEFAULT false;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'direct_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
    END IF;
END $$;

-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public profiles" ON profiles;
CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users create own profile" ON profiles;
CREATE POLICY "Users create own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public channels" ON channels;
CREATE POLICY "Public channels" ON channels FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users create channels" ON channels;
CREATE POLICY "Users create channels" ON channels FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
          AND COALESCE(to_jsonb(profiles)->>'role', to_jsonb(profiles)->>'rank')
              IN ('admin', 'super_admin', 'co_owner', 'owner')
    )
);

DROP POLICY IF EXISTS "Public messages" ON messages;
CREATE POLICY "Public messages" ON messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users insert messages" ON messages;
CREATE POLICY "Users insert messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users see own DMs" ON direct_messages;
CREATE POLICY "Users see own DMs" ON direct_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
DROP POLICY IF EXISTS "Users send DMs" ON direct_messages;
CREATE POLICY "Users send DMs" ON direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

REVOKE UPDATE ON TABLE profiles FROM authenticated;
GRANT UPDATE (username) ON TABLE profiles TO authenticated;