import { createClient } from '@/lib/supabase/server';
import { ChatClient } from './ChatClient';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <ChatClient
      userEmail={user?.email ?? ''}
      userId={user?.id ?? ''}
    />
  );
}
