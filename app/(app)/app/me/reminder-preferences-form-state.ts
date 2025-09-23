import { z } from 'zod';

export const reminderPreferencesSchema = z.object({
  email_reminders_enabled: z.boolean(),
  streak_reminders_enabled: z.boolean(),
  reminder_frequency: z.enum(['daily', 'weekly', 'never']),
  quiet_hours: z.object({
    enabled: z.boolean(),
    start: z.string(),
    end: z.string(),
  }),
});

export type ReminderPreferences = z.infer<typeof reminderPreferencesSchema>;

export interface ReminderPreferencesState {
  emailRemindersEnabled: boolean;
  streakRemindersEnabled: boolean;
  reminderFrequency: 'daily' | 'weekly' | 'never';
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  status?: 'success' | 'error';
  message?: string;
  fieldErrors?: {
    email_reminders_enabled?: string[];
    streak_reminders_enabled?: string[];
    reminder_frequency?: string[];
    quiet_hours_enabled?: string[];
    quiet_start?: string[];
    quiet_end?: string[];
  };
}

export const reminderPreferencesInitialState: ReminderPreferencesState = {
  emailRemindersEnabled: true,
  streakRemindersEnabled: true,
  reminderFrequency: 'daily',
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};