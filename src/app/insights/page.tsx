import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { InsightsClient } from './InsightsClient';

export const dynamic = 'force-dynamic';

export default async function InsightsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  return <InsightsClient userEmail={user.email ?? 'Unknown'} userId={user.id} />;
}

