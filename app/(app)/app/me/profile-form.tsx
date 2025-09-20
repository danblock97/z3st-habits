'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ShareButton } from '@/components/ui/share-button';
import { cn } from '@/lib/utils';

import { updateProfile } from './actions';
import {
  profileFormInitialState,
  type ProfileFormState,
} from './form-state';

type Profile = {
  username: string | null;
  timezone: string | null;
  emoji: string | null;
  is_public: boolean | null;
  bio: string | null;
};

type ProfileWithDefaults = Profile & {
  is_public: boolean;
  bio: string;
};

const EMOJI_CHOICES = ['🍋', '🍊', '🍉', '🍇', '🍓', '🍑', '🥝', '🥥', '🌿', '⭐', '🔥', '⚡'];

export function ProfileForm({ profile }: { profile: Profile | Record<string, string | null | boolean> }) {
  const [state, formAction] = useActionState(updateProfile, profileFormInitialState);
  const [username, setUsername] = useState(String(profile.username ?? ''));
  const [emoji, setEmoji] = useState(String(profile.emoji ?? ''));
  const [timezone, setTimezone] = useState(String(profile.timezone ?? ''));
  const [isPublic, setIsPublic] = useState(Boolean(profile.is_public ?? false));
  const [bio, setBio] = useState(String(profile.bio ?? ''));

  const profileWithDefaults: ProfileWithDefaults = {
    username: (profile.username as string) ?? null,
    timezone: (profile.timezone as string) ?? null,
    emoji: (profile.emoji as string) ?? null,
    is_public: Boolean(profile.is_public ?? false),
    bio: (profile.bio as string) ?? '',
  };
  const hasAutoFilledTimezone = useRef<boolean>(
    Boolean(profile.timezone && profile.timezone !== 'UTC'),
  );

  useEffect(() => {
    setUsername(profileWithDefaults.username ?? '');
    setEmoji(profileWithDefaults.emoji ?? '');
    setTimezone(profileWithDefaults.timezone ?? '');
    setIsPublic(profileWithDefaults.is_public);
    setBio(profileWithDefaults.bio);
  }, [profileWithDefaults.username, profileWithDefaults.emoji, profileWithDefaults.timezone, profileWithDefaults.is_public, profileWithDefaults.bio]);

  useEffect(() => {
    if (hasAutoFilledTimezone.current) {
      return;
    }

    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected) {
      setTimezone(detected);
    }

    hasAutoFilledTimezone.current = true;
  }, []);

  const showSuccess = state.status === 'success' && state.message;
  const showError = state.status === 'error' && state.message;

  return (
    <form action={formAction} className="grid gap-6">
      {showSuccess ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </p>
      ) : null}
      {showError ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-2">
        <label htmlFor="username" className="text-sm font-medium text-foreground">
          Username
        </label>
        <Input
          id="username"
          name="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          minLength={3}
          maxLength={32}
          placeholder="zestmaster"
          aria-describedby="username-help"
          aria-invalid={Boolean(state.fieldErrors?.username)}
        />
        <p id="username-help" className="text-xs text-muted-foreground">
          Use 3-32 characters: letters, numbers, underscores.
        </p>
        {state.fieldErrors?.username ? (
          <p className="text-xs text-destructive">{state.fieldErrors.username}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label htmlFor="timezone" className="text-sm font-medium text-foreground">
          Timezone
        </label>
        <Input
          id="timezone"
          name="timezone"
          value={timezone}
          onChange={(event) => setTimezone(event.target.value)}
          placeholder="America/Los_Angeles"
          aria-invalid={Boolean(state.fieldErrors?.timezone)}
        />
        <p className="text-xs text-muted-foreground">
          We auto-detected your timezone. Adjust if it does not look right.
        </p>
        {state.fieldErrors?.timezone ? (
          <p className="text-xs text-destructive">{state.fieldErrors.timezone}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label htmlFor="emoji" className="text-sm font-medium text-foreground">
          Emoji flair (optional)
        </label>
        <div className="flex flex-wrap gap-2">
          {EMOJI_CHOICES.map((choice) => {
            const isSelected = emoji === choice;
            return (
              <button
                key={choice}
                type="button"
                onClick={() => setEmoji(choice)}
                aria-pressed={isSelected}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border text-xl transition',
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/60 bg-background hover:border-primary/50'
                )}
              >
                <span role="img" aria-label={`Use ${choice}`}>
                  {choice}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setEmoji('')}
            className="flex h-10 items-center rounded-full border border-border/60 px-3 text-xs font-medium text-muted-foreground transition hover:border-destructive/60 hover:text-destructive"
          >
            Clear
          </button>
        </div>
        <Input
          id="emoji"
          name="emoji"
          value={emoji}
          onChange={(event) => setEmoji(event.target.value)}
          placeholder="Pick or add your own"
          maxLength={4}
          aria-invalid={Boolean(state.fieldErrors?.emoji)}
        />
        <p className="text-xs text-muted-foreground">
          Tap a suggestion or paste any emoji you love.
        </p>
        {state.fieldErrors?.emoji ? (
          <p className="text-xs text-destructive">{state.fieldErrors.emoji}</p>
        ) : null}
      </div>

      {profileWithDefaults.bio !== undefined && (
        <div className="grid gap-2">
          <Label htmlFor="bio" className="text-sm font-medium text-foreground">
            Bio (optional)
          </Label>
          <textarea
            id="bio"
            name="bio"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Tell others about yourself..."
            rows={3}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            aria-invalid={Boolean(state.fieldErrors?.bio)}
          />
          <p className="text-xs text-muted-foreground">
            Share a bit about yourself. This will be visible on your public profile.
          </p>
          {state.fieldErrors?.bio ? (
            <p className="text-xs text-destructive">{state.fieldErrors.bio}</p>
          ) : null}
        </div>
      )}

      {profileWithDefaults.is_public !== undefined && (
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="is-public" className="text-sm font-medium text-foreground">
              Public profile
            </Label>
            <p className="text-xs text-muted-foreground">
              Allow others to view your profile and habit stats.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isPublic && (
              <ShareButton title="My profile" />
            )}
          <input
            type="hidden"
            name="is_public"
            value={isPublic ? 'true' : 'false'}
          />
          <Switch
            id="is-public"
            checked={isPublic}
            onCheckedChange={setIsPublic}
          />
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <SubmitButton state={state} />
      </div>
    </form>
  );
}

function SubmitButton({ state }: { state: ProfileFormState }) {
  const { pending } = useFormStatus();
  const isSuccess = state.status === 'success';

  return (
    <Button type="submit" disabled={pending} className="w-fit">
      {pending ? 'Saving...' : isSuccess ? 'Saved' : 'Save changes'}
    </Button>
  );
}
