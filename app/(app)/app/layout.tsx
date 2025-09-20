import { redirect } from 'next/navigation';

import { createServerClient } from '@/lib/supabase/server';

type AppLayoutProps = {
  children: React.ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return <div className="mx-auto w-full max-w-5xl px-4 py-10">{children}</div>;
}
