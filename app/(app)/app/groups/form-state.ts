import type { GroupSummary } from './types';

export type GroupFormState = {
  status: 'idle' | 'success' | 'error';
  message: string | null;
  group?: GroupSummary;
  fieldErrors?: Partial<{
    name: string;
  }>;
};

export const groupFormInitialState: GroupFormState = {
  status: 'idle',
  message: null,
  fieldErrors: undefined,
  group: undefined,
};
