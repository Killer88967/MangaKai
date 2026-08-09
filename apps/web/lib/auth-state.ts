/**
 * Shared shape for the sign-in and register forms.
 *
 * Kept out of `app/(auth)/actions.ts` because a `"use server"` module may only
 * export async functions — exporting the initial-state object from there is a
 * runtime error that the type checker does not catch.
 */
export interface AuthFormState {
  error: string | null;
}

export const emptyAuthState: AuthFormState = { error: null };
