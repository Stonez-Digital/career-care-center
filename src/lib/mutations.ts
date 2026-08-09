type SupabaseFailure = {
  message?: string;
  details?: string;
  hint?: string;
};

export function mutationErrorMessage(action: string, error: SupabaseFailure | null): string | null {
  if (!error) return null;
  const detail = error.message || error.details || error.hint || 'Unknown database error';
  return `Could not ${action}. ${detail}`;
}

export function reportMutationError(action: string, error: SupabaseFailure | null): boolean {
  const message = mutationErrorMessage(action, error);
  if (!message) return false;
  console.error(`[CCC] ${message}`, error);
  window.alert(message);
  return true;
}
