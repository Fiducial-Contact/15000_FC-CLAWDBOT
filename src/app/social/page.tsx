import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SocialClient } from './SocialClient';

export const dynamic = 'force-dynamic';

export default async function SocialPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  return <SocialClient userEmail={user.email ?? 'Unknown'} userId={user.id} />;
}
