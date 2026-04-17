import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const safeStorage = {
  getItem: (name) => { try { return localStorage.getItem(name) } catch (e) { return null } },
  setItem: (name, value) => { try { localStorage.setItem(name, value) } catch (e) {} },
  removeItem: (name) => { try { localStorage.removeItem(name) } catch (e) {} },
};

const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => set({ token, user, isAuthenticated: !!token }),
      setToken: (token) => set({ token, isAuthenticated: !!token }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'trajex-auth',
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ user: s.user }),
    }
  )
);

export default useAuthStore;
