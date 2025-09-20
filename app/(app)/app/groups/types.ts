export type GroupRole = 'owner' | 'admin' | 'member';

export type GroupSummary = {
  id: string;
  name: string;
  ownerId: string;
  ownerDisplayName: string;
  ownerEmoji: string | null;
  role: GroupRole;
  createdAt: string;
  joinedAt: string;
};
