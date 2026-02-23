/**
 * Maps Supabase/auth error details to user-friendly messages.
 * Uses translation keys that get resolved by the i18n system.
 * Falls back to English messages for immediate use.
 */
const errorMap: Record<string, string> = {
  // Auth errors
  invalid_credentials: 'Incorrect email or password.',
  'Invalid login credentials': 'Incorrect email or password.',
  email_not_confirmed: 'Email not yet confirmed. Check your inbox.',
  user_already_exists: 'This email is already registered.',
  'User already registered': 'This email is already registered.',
  weak_password: 'Password must be at least 6 characters.',
  // Postgres / RLS errors
  '42501': 'You do not have permission to perform this action.',
  '23505': 'This record already exists.',
  '23503': 'Invalid reference. Please check the data.',
  '23514': 'Data out of allowed range.',
  PGRST301: 'You do not have permission to access this resource.',
};

export function getFriendlyError(error: unknown): string {
  if (!error || typeof error !== 'object') return 'An error occurred. Please try again.';

  const err = error as Record<string, any>;
  if (err.code && errorMap[err.code]) return errorMap[err.code];
  if (err.message && typeof err.message === 'string') {
    for (const [key, value] of Object.entries(errorMap)) {
      if (err.message.includes(key)) return value;
    }
  }
  if (import.meta.env.DEV) {
    console.error('[App Error]', err.code, err.message);
  }
  return 'An error occurred. Please try again.';
}
