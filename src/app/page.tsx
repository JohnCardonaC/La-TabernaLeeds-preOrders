import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardView from './dashboard-view';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return <DashboardView />;
}
