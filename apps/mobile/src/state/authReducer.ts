/**
 * Auth state reducer. Pure (no React imports) so it can be unit tested.
 */

import type { AuthUser } from '@app/api/client';

export interface AuthState {
  status: 'unauthenticated' | 'authenticated' | 'loading';
  user: AuthUser | null;
  error: string | null;
}

export const initialAuthState: AuthState = {
  status: 'unauthenticated',
  user: null,
  error: null,
};

export type AuthAction =
  | { type: 'auth/loading' }
  | { type: 'auth/success'; user: AuthUser }
  | { type: 'auth/failure'; error: string }
  | { type: 'auth/logout' };

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'auth/loading':
      return { ...state, status: 'loading', error: null };
    case 'auth/success':
      return { status: 'authenticated', user: action.user, error: null };
    case 'auth/failure':
      return { status: 'unauthenticated', user: null, error: action.error };
    case 'auth/logout':
      return { ...initialAuthState };
    default:
      return state;
  }
}
