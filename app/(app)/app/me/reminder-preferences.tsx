'use client';

import { useActionState, useEffect, useState, startTransition } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { updateReminderPreferences } from './actions';
import { reminderPreferencesInitialState } from './reminder-preferences-form-state';

type ReminderPreferences = {
  email_reminders_enabled: boolean;
  streak_reminders_enabled: boolean;
  reminder_frequency: 'daily' | 'weekly' | 'never';
  quiet_hours: {
    enabled: boolean;
    start: string;
    end: string;
  };
};

type ReminderPreferencesFormProps = {
  preferences: ReminderPreferences;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving...' : 'Save Preferences'}
    </Button>
  );
}

export function ReminderPreferencesForm({ preferences }: ReminderPreferencesFormProps) {
  const [state, formAction] = useActionState(updateReminderPreferences, reminderPreferencesInitialState);
  
  const [emailRemindersEnabled, setEmailRemindersEnabled] = useState(preferences.email_reminders_enabled);
  const [streakRemindersEnabled, setStreakRemindersEnabled] = useState(preferences.streak_reminders_enabled);
  const [reminderFrequency, setReminderFrequency] = useState(preferences.reminder_frequency);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(preferences.quiet_hours.enabled);
  const [quietStart, setQuietStart] = useState(preferences.quiet_hours.start);
  const [quietEnd, setQuietEnd] = useState(preferences.quiet_hours.end);

  // Reset form state when preferences change
  useEffect(() => {
    if (state.status === 'success') {
      setEmailRemindersEnabled(preferences.email_reminders_enabled);
      setStreakRemindersEnabled(preferences.streak_reminders_enabled);
      setReminderFrequency(preferences.reminder_frequency);
      setQuietHoursEnabled(preferences.quiet_hours.enabled);
      setQuietStart(preferences.quiet_hours.start);
      setQuietEnd(preferences.quiet_hours.end);
    }
  }, [preferences, state.status]);

  const handleSubmit = (formData: FormData) => {
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Reminders</CardTitle>
        <CardDescription>
          Control when and how you receive email reminders about your habits and streaks.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          {/* Email Reminders Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email_reminders_enabled" className="text-base">
                Email Reminders
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications about your habits and streaks
              </p>
            </div>
            <Switch
              id="email_reminders_enabled"
              name="email_reminders_enabled"
              checked={emailRemindersEnabled}
              onCheckedChange={setEmailRemindersEnabled}
            />
          </div>

          {/* Streak Reminders Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="streak_reminders_enabled" className="text-base">
                Streak Protection
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified when you&apos;re about to break a habit streak
              </p>
            </div>
            <Switch
              id="streak_reminders_enabled"
              name="streak_reminders_enabled"
              checked={streakRemindersEnabled}
              onCheckedChange={setStreakRemindersEnabled}
              disabled={!emailRemindersEnabled}
            />
          </div>

          {/* Reminder Frequency */}
          <div className="space-y-2">
            <Label htmlFor="reminder_frequency">Reminder Frequency</Label>
            <Select
              value={reminderFrequency}
              onValueChange={(value: 'daily' | 'weekly' | 'never') => setReminderFrequency(value)}
              disabled={!emailRemindersEnabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="reminder_frequency" value={reminderFrequency} />
          </div>

          {/* Quiet Hours */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="quiet_hours_enabled" className="text-base">
                  Quiet Hours
                </Label>
                <p className="text-sm text-muted-foreground">
                  Don&apos;t send reminders during these hours
                </p>
              </div>
              <Switch
                id="quiet_hours_enabled"
                name="quiet_hours_enabled"
                checked={quietHoursEnabled}
                onCheckedChange={setQuietHoursEnabled}
                disabled={!emailRemindersEnabled}
              />
            </div>

            {quietHoursEnabled && emailRemindersEnabled && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="quiet_start">Start Time</Label>
                  <Input
                    id="quiet_start"
                    name="quiet_start"
                    type="time"
                    value={quietStart}
                    onChange={(e) => setQuietStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quiet_end">End Time</Label>
                  <Input
                    id="quiet_end"
                    name="quiet_end"
                    type="time"
                    value={quietEnd}
                    onChange={(e) => setQuietEnd(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Hidden inputs for form submission */}
          <input type="hidden" name="email_reminders_enabled" value={emailRemindersEnabled.toString()} />
          <input type="hidden" name="streak_reminders_enabled" value={streakRemindersEnabled.toString()} />
          <input type="hidden" name="quiet_hours_enabled" value={quietHoursEnabled.toString()} />
          <input type="hidden" name="quiet_start" value={quietStart} />
          <input type="hidden" name="quiet_end" value={quietEnd} />

          {/* Status Message */}
          {state.message && (
            <div
              className={cn(
                'rounded-md p-3 text-sm',
                state.status === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-destructive/10 text-destructive border border-destructive/20'
              )}
            >
              {state.message}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <SubmitButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
