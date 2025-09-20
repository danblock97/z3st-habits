import type { HabitSummary } from './types';

export type HabitFormState = {
  status: 'idle' | 'success' | 'error';
  message: string | null;
  habit?: HabitSummary;
  fieldErrors?: Partial<{
    title: string;
    emoji: string;
    cadence: string;
    targetPerPeriod: string;
    timezone: string;
  }>;
};

export const habitFormInitialState: HabitFormState = {
  status: 'idle',
  message: null,
  fieldErrors: undefined,
  habit: undefined,
};
