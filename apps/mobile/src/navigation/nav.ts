/**
 * Lightweight screen-state machine. Avoids react-navigation so tests don't
 * need its native module shims. The real product can swap this for
 * `@react-navigation/native` later — the screen components are isolated.
 */

export type Screen =
  | { name: 'login' }
  | { name: 'register' }
  | { name: 'home' }
  | { name: 'addItem'; sharedUrl?: string }
  | { name: 'itemDetail'; itemId: string }
  | { name: 'collections' };

export interface NavState {
  stack: Screen[];
}

export const initialNav: NavState = { stack: [{ name: 'login' }] };

export type NavAction =
  | { type: 'reset'; to: Screen }
  | { type: 'push'; to: Screen }
  | { type: 'pop' };

export function navReducer(state: NavState, action: NavAction): NavState {
  switch (action.type) {
    case 'reset':
      return { stack: [action.to] };
    case 'push':
      return { stack: [...state.stack, action.to] };
    case 'pop':
      return state.stack.length > 1
        ? { stack: state.stack.slice(0, -1) }
        : state;
    default:
      return state;
  }
}

export function currentScreen(state: NavState): Screen {
  return state.stack[state.stack.length - 1];
}
