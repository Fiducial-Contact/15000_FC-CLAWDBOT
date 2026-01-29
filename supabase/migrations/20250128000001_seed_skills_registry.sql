-- Seed initial workspace skills with team creator (null creator_id = team-created)
INSERT INTO skills_registry (skill_name, display_name, description, source, status, icon, triggers)
VALUES
  ('commit', 'Git Commit', 'Create git commits with conventional commit messages', 'bundled', 'active', 'GitCommit', ARRAY['commit', 'git commit']),
  ('review-pr', 'PR Review', 'Review pull requests and provide feedback', 'bundled', 'active', 'GitPullRequest', ARRAY['review', 'pr', 'pull request']),
  ('deep-research', 'Deep Research', 'Research topics thoroughly with structured summaries', 'bundled', 'active', 'Search', ARRAY['research', 'deep research', 'investigate'])
ON CONFLICT (skill_name) DO NOTHING;
