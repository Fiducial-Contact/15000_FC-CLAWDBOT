import { createClient } from '@/lib/supabase/server';
import { SocialClient } from './SocialClient';

export const dynamic = 'force-dynamic';

export default async function SocialPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <SocialClient userEmail={user?.email ?? ''} userId={user?.id ?? ''} />;
}
