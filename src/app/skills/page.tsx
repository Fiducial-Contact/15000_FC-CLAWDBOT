import { createClient } from '@/lib/supabase/server';
import { SkillsClient } from './SkillsClient';

export const dynamic = 'force-dynamic';

export default async function SkillsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <SkillsClient userEmail={user?.email ?? ''} userId={user?.id ?? ''} />;
}
