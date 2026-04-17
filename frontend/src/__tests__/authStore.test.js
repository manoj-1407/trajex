import { describe, it, expect, beforeEach } from 'vitest';
import useAuthStore from '../store/useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.getState().logout();
  });

  it('should initialize with null token and user', () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should update state when setAuth is called', () => {
    const token = 'fake-jwt-token';
    const user = { name: 'Commander Shepard', role: 'owner' };
    
    useAuthStore.getState().setAuth(token, user);
    
    const state = useAuthStore.getState();
    expect(state.token).toBe(token);
    expect(state.user).toEqual(user);
    expect(state.isAuthenticated).toBe(true);
  });

  it('should clear state when logout is called', () => {
    useAuthStore.getState().setAuth('token', { name: 'User' });
    useAuthStore.getState().logout();
    
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
