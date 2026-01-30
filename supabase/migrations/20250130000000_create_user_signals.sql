-- Signal capture pipeline: append-only interaction metadata for observer system
CREATE TABLE IF NOT EXISTS user_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  session_key_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_signals_user_created ON user_signals (user_id, created_at DESC);
CREATE INDEX idx_user_signals_type_created ON user_signals (signal_type, created_at DESC);

ALTER TABLE user_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own signals"
  ON user_signals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own signals"
  ON user_signals FOR SELECT
  USING (auth.uid() = user_id);
