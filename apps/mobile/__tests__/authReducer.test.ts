import { authReducer, initialAuthState } from '@app/state/authReducer';
import type { AuthUser } from '@app/api/client';

const user: AuthUser = {
  id: 'u1',
  email: 'a@b.test',
  display_name: 'A',
  created_at: '2026-01-01T00:00:00Z',
};

describe('authReducer', () => {
  it('starts unauthenticated', () => {
    expect(initialAuthState.status).toBe('unauthenticated');
  });

  it('transitions through loading -> success', () => {
    let state = authReducer(initialAuthState, { type: 'auth/loading' });
    expect(state.status).toBe('loading');
    state = authReducer(state, { type: 'auth/success', user });
    expect(state).toEqual({ status: 'authenticated', user, error: null });
  });

  it('records failure and clears user', () => {
    const state = authReducer(
      { status: 'authenticated', user, error: null },
      { type: 'auth/failure', error: 'bad creds' },
    );
    expect(state).toEqual({ status: 'unauthenticated', user: null, error: 'bad creds' });
  });

  it('logout resets state', () => {
    const state = authReducer(
      { status: 'authenticated', user, error: null },
      { type: 'auth/logout' },
    );
    expect(state).toEqual(initialAuthState);
  });
});
