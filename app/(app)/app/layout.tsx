import { redirect } from 'next/navigation';

import { createServerClient } from '@/lib/supabase/server';

import { AppMobileNav, AppTabs } from './app-navigation';

type AppLayoutProps = {
  children: React.ReactNode;
};

const APP_NAV_ITEMS = [
  { href: '/app/habits', label: 'Habits', iconName: 'ListChecks' },
  { href: '/app/groups', label: 'Groups', iconName: 'Users' },
  { href: '/app/me', label: 'Me', iconName: 'UserRound' },
];

export default async function AppLayout({ children }: AppLayoutProps) {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-32 pt-8 md:pb-16">
      <div className="flex justify-center md:justify-start">
        <AppTabs items={APP_NAV_ITEMS} />
      </div>
      <div className="mt-8 flex-1">
        {children}
      </div>
      <AppMobileNav items={APP_NAV_ITEMS} />
    </div>
  );
}
