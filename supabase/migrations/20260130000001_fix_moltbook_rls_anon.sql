-- Allow anon role to read moltbook tables (browser client uses anon key)
create policy "Anon users can read moltbook_activity"
  on moltbook_activity for select
  to anon
  using (true);

create policy "Anon users can read moltbook_daily"
  on moltbook_daily for select
  to anon
  using (true);
