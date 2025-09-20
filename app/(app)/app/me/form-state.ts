export type ProfileFormField = 'username' | 'timezone' | 'emoji' | 'bio' | 'is_public';

export type ProfileFormState = {
  status: 'idle' | 'success' | 'error';
  message: string;
  fieldErrors?: Partial<Record<ProfileFormField, string>>;
};

export const profileFormInitialState: ProfileFormState = {
  status: 'idle',
  message: '',
};
