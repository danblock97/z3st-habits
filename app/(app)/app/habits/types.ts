export type HabitCadence = 'daily' | 'weekly' | 'custom';

export type DependencyType = 'enables' | 'requires' | 'suggests';

export type HabitDependency = {
  id: string;
  parentHabitId: string;
  childHabitId: string;
  dependencyType: DependencyType;
  createdAt: string;
};

export type HabitDependencyRelation = {
  habitId: string;
  title: string;
  emoji: string | null;
  dependencyType: DependencyType;
};

export type HabitWithDependencies = {
  id: string;
  title: string;
  emoji: string | null;
  parents: HabitDependencyRelation[];
  children: HabitDependencyRelation[];
};

export type HabitSummary = {
  id: string;
  title: string;
  emoji: string | null;
  cadence: HabitCadence;
  targetPerPeriod: number;
  timezone: string;
  createdAt: string;
  currentPeriodCount: number;
  currentStreak: number;
  longestStreak: number;
  todayCount: number;
  parents?: HabitDependencyRelation[];
  children?: HabitDependencyRelation[];
};

export type DependencyTreeNode = {
  parentId: string;
  parentTitle: string;
  parentEmoji: string | null;
  childId: string;
  childTitle: string;
  childEmoji: string | null;
  dependencyType: DependencyType;
};
