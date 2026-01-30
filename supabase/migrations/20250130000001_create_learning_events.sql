-- Learning events: structured insights produced by VPS observer learner
CREATE TABLE IF NOT EXISTS learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL,
  insight TEXT NOT NULL,
  confidence REAL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  evidence JSONB DEFAULT '[]',
  source TEXT DEFAULT 'heartbeat',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_learning_events_user ON learning_events (user_id, created_at DESC);
CREATE INDEX idx_learning_events_dimension ON learning_events (dimension, created_at DESC);

ALTER TABLE learning_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own learning events"
  ON learning_events FOR SELECT
  USING (auth.uid() = user_id);

-- VPS agent writes via service-role key (bypasses RLS)
