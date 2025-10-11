export type CheckinWithDetails = {
  id: string;
  habit_id: string;
  user_id: string;
  local_date: string;
  count: number;
  note: string | null;
  photo_url: string | null;
  created_at: string;
  habit: {
    id: string;
    title: string;
    emoji: string | null;
    cadence: string;
  };
};

export type JournalEntry = {
  id: string;
  habitId: string;
  habitTitle: string;
  habitEmoji: string | null;
  localDate: string;
  count: number;
  note: string | null;
  photoUrl: string | null;
  createdAt: string;
};
