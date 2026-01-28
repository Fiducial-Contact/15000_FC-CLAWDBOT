import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ChatClient } from './ChatClient';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  return <ChatClient userEmail={user.email ?? 'Unknown'} userId={user.id} />;
}
