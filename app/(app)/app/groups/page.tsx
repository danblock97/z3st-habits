import { redirect } from 'next/navigation';

import { createServerClient } from '@/lib/supabase/server';

import { GroupsClient } from './groups-client';
import type { GroupRole, GroupSummary } from './types';

type OwnedGroupRow = {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  owner?:
    | {
        username: string | null;
        emoji: string | null;
      }
    | Array<{
        username: string | null;
        emoji: string | null;
      }>
    | null;
};

type MembershipRow = {
  role: GroupRole;
  joined_at: string;
  group: OwnedGroupRow | OwnedGroupRow[] | null;
};

function normalizeOwner(owner: OwnedGroupRow['owner']) {
  if (!owner) {
    return null;
  }

  return Array.isArray(owner) ? owner[0] ?? null : owner;
}

function normalizeGroup(record: MembershipRow['group']) {
  if (!record) {
    return null;
  }

  return Array.isArray(record) ? record[0] ?? null : record;
}

export default async function GroupsPage() {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect('/login');
  }

  const userId = session.user.id;

  const [{ data: ownedGroupsData }, { data: membershipData }] = await Promise.all([
    supabase
      .from('groups')
      .select(
        `id, name, owner_id, created_at,
        owner:profiles!groups_owner_id_fkey (username, emoji)`
      )
      .eq('owner_id', userId),
    supabase
      .from('group_members')
      .select(
        `role, joined_at,
        group:groups (id, name, owner_id, created_at,
          owner:profiles!groups_owner_id_fkey (username, emoji)
        )`
      )
      .eq('user_id', userId),
  ]);

  const groupById = new Map<string, GroupSummary>();

  const ownedGroups = (ownedGroupsData ?? []) as OwnedGroupRow[];
  ownedGroups.forEach((group) => {
    const ownerDetails = normalizeOwner(group.owner);
    groupById.set(group.id, {
      id: group.id,
      name: group.name,
      ownerId: group.owner_id,
      ownerDisplayName: ownerDetails?.username ?? 'You',
      ownerEmoji: ownerDetails?.emoji ?? '🍋',
      role: 'owner',
      createdAt: group.created_at,
      joinedAt: group.created_at,
    });
  });

  const memberships = (membershipData ?? []) as MembershipRow[];
  memberships.forEach((membership) => {
    const group = normalizeGroup(membership.group);
    if (!group) {
      return;
    }

    const ownerDetails = normalizeOwner(group.owner);

    const existing = groupById.get(group.id);
    if (existing) {
      // Ensure we keep the owner record but update join info if the membership has an earlier joined_at.
      if (existing.role === 'owner') {
        return;
      }
    }

    groupById.set(group.id, {
      id: group.id,
      name: group.name,
      ownerId: group.owner_id,
      ownerDisplayName:
        ownerDetails?.username ?? (group.owner_id === userId ? 'You' : 'Group lead'),
      ownerEmoji: ownerDetails?.emoji ?? '🍋',
      role: membership.role,
      createdAt: group.created_at,
      joinedAt: membership.joined_at ?? group.created_at,
    });
  });

  const groups = Array.from(groupById.values()).sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return <GroupsClient groups={groups} />;
}
