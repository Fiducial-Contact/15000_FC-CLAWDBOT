import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SkillsClient } from './SkillsClient';

export const dynamic = 'force-dynamic';

export default async function SkillsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  return <SkillsClient userEmail={user.email ?? 'Unknown'} userId={user.id} />;
}
