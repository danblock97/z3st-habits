'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { EmailSignInState } from '@/lib/auth/types';

const initialState: EmailSignInState = {
  success: false,
  message: '',
};

type Props = {
  action: (
    state: EmailSignInState,
    formData: FormData,
  ) => Promise<EmailSignInState>;
};

export function EmailSignInForm({ action }: Props) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </div>
      {state.message ? (
        <p
          className={cn(
            'text-sm',
            state.success ? 'text-emerald-600' : 'text-destructive',
          )}
        >
          {state.message}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Sending magic link...' : 'Send magic link'}
    </Button>
  );
}
