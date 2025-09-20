import { notFound } from 'next/navigation';
import { Metadata } from 'next';

import { createServerClient } from '@/lib/supabase/server';
import { PublicProfilePage } from './page-content';

interface PublicProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: PublicProfilePageProps): Promise<Metadata> {
  const { username } = await params;

  const supabase = await createServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, emoji, bio')
    .eq('username', username)
    .single();

  if (!profile) {
    return {
      title: 'Profile Not Found',
    };
  }

  return {
    title: `${profile.username} - Z3st`,
    description: profile.bio || `Check out ${profile.username}'s habits and progress on Z3st.`,
    openGraph: {
      title: `${profile.username} - Z3st`,
      description: profile.bio || `Check out ${profile.username}'s habits and progress on Z3st.`,
      type: 'profile',
      images: [
        {
          url: `/og/profile/${username}`,
          width: 1200,
          height: 630,
          alt: `${profile.username}'s profile`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${profile.username} - Z3st`,
      description: profile.bio || `Check out ${profile.username}'s habits and progress on Z3st.`,
      images: [`/og/profile/${username}`],
    },
  };
}

export default async function PublicProfile({ params }: PublicProfilePageProps) {
  const { username } = await params;

  const supabase = await createServerClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, username, emoji, bio, is_public')
    .eq('username', username)
    .single();

  if (error || !profile || (profile.is_public !== null && !profile.is_public)) {
    notFound();
  }

  return <PublicProfilePage profile={profile} />;
}
