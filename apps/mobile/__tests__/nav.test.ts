import { currentScreen, initialNav, navReducer } from '@app/navigation/nav';

describe('navReducer', () => {
  it('starts on login', () => {
    expect(currentScreen(initialNav)).toEqual({ name: 'login' });
  });

  it('push then pop', () => {
    let s = navReducer(initialNav, { type: 'push', to: { name: 'register' } });
    expect(currentScreen(s).name).toBe('register');
    s = navReducer(s, { type: 'pop' });
    expect(currentScreen(s).name).toBe('login');
  });

  it('cannot pop the root screen', () => {
    const s = navReducer(initialNav, { type: 'pop' });
    expect(s).toEqual(initialNav);
  });

  it('reset replaces the whole stack', () => {
    let s = navReducer(initialNav, { type: 'push', to: { name: 'register' } });
    s = navReducer(s, { type: 'reset', to: { name: 'home' } });
    expect(s.stack).toHaveLength(1);
    expect(currentScreen(s)).toEqual({ name: 'home' });
  });

  it('carries shared URL on addItem screen', () => {
    const s = navReducer(initialNav, {
      type: 'push',
      to: { name: 'addItem', sharedUrl: 'https://x.test' },
    });
    expect(currentScreen(s)).toEqual({ name: 'addItem', sharedUrl: 'https://x.test' });
  });
});
