export type GroupMember = {
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  username: string;
  emoji: string;
  currentStreak: number;
  longestStreak: number;
  lastCheckin: string | null;
};

export type GroupCheckin = {
  id: string;
  habitId: string;
  userId: string;
  localDate: string;
  count: number;
  createdAt: string;
  habit: {
    id: string;
    title: string;
    emoji: string;
  };
  user: {
    username: string;
    emoji: string;
  };
};

export type GroupSummary = {
  id: string;
  name: string;
  ownerId: string;
  ownerUsername: string;
  ownerEmoji: string;
  userRole: 'owner' | 'admin' | 'member';
  createdAt: string;
};

export type GroupDashboardData = {
  group: GroupSummary;
  members: GroupMember[];
  checkins: GroupCheckin[];
};
