/**
 * Maps Supabase/auth error details to user-friendly Portuguese messages.
 * Prevents leaking internal schema or constraint information.
 */
const errorMap: Record<string, string> = {
  // Auth errors
  invalid_credentials: 'Email ou password incorretos.',
  'Invalid login credentials': 'Email ou password incorretos.',
  email_not_confirmed: 'Email ainda não confirmado. Verifique a sua caixa de entrada.',
  user_already_exists: 'Este email já está registado.',
  'User already registered': 'Este email já está registado.',
  weak_password: 'A password deve ter pelo menos 6 caracteres.',
  // Postgres / RLS errors
  '42501': 'Não tem permissão para executar esta ação.',
  '23505': 'Este registo já existe.',
  '23503': 'Referência inválida. Verifique os dados.',
  '23514': 'Dados fora dos limites permitidos.',
  PGRST301: 'Não tem permissão para aceder a este recurso.',
};

export function getFriendlyError(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Ocorreu um erro. Tente novamente.';

  const err = error as Record<string, any>;
  // Try matching by code
  if (err.code && errorMap[err.code]) return errorMap[err.code];
  // Try matching by message text
  if (err.message && typeof err.message === 'string') {
    for (const [key, value] of Object.entries(errorMap)) {
      if (err.message.includes(key)) return value;
    }
  }
  // Log for debugging (console only, not shown to user)
  console.error('[App Error]', err.code, err.message);
  return 'Ocorreu um erro. Tente novamente.';
}
