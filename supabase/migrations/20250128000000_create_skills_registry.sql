-- Create skills_registry table
CREATE TABLE IF NOT EXISTS skills_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name TEXT NOT NULL UNIQUE,
  display_name TEXT,
  description TEXT,
  creator_id UUID REFERENCES auth.users(id),
  creator_email TEXT,
  source TEXT DEFAULT 'workspace' CHECK (source IN ('workspace', 'bundled', 'clawdhub')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'draft')),
  icon TEXT,
  triggers TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_skills_registry_skill_name ON skills_registry(skill_name);
CREATE INDEX IF NOT EXISTS idx_skills_registry_creator_id ON skills_registry(creator_id);

-- Enable RLS
ALTER TABLE skills_registry ENABLE ROW LEVEL SECURITY;

-- RLS Policies: All authenticated users can read
CREATE POLICY "Authenticated users can read skills"
  ON skills_registry
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Only creator can update their own records
CREATE POLICY "Creators can update their own skills"
  ON skills_registry
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- RLS Policy: Only creator can delete their own records
CREATE POLICY "Creators can delete their own skills"
  ON skills_registry
  FOR DELETE
  TO authenticated
  USING (creator_id = auth.uid());

-- RLS Policy: Authenticated users can insert
CREATE POLICY "Authenticated users can insert skills"
  ON skills_registry
  FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_skills_registry_updated_at ON skills_registry;
CREATE TRIGGER update_skills_registry_updated_at
  BEFORE UPDATE ON skills_registry
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
