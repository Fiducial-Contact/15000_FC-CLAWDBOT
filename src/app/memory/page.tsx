import { createClient } from '@/lib/supabase/server';
import { InsightsClient } from '@/app/insights/InsightsClient';

export const dynamic = 'force-dynamic';

export default async function MemoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <InsightsClient userEmail={user?.email ?? ''} userId={user?.id ?? ''} />;
}
