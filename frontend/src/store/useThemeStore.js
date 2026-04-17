import { create } from 'zustand';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = localStorage.getItem('trajex-theme');
    const valid = ['dark', 'light', 'midnight'];
    if (valid.includes(stored)) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch (e) {
    return 'dark'; // Fallback
  }
}

const initialTheme = getInitialTheme();
if (typeof window !== 'undefined') {
  document.documentElement.setAttribute('data-theme', initialTheme);
}

const useThemeStore = create((set) => ({
  theme: initialTheme,
  
  toggleTheme: () => set((state) => {
    // Basic toggle between dark and light, midnight is set explicitly via ThemeToggle
    const newTheme = state.theme === 'dark' || state.theme === 'midnight' ? 'light' : 'dark';
    try {
      localStorage.setItem('trajex-theme', newTheme);
    } catch (e) { }
    document.documentElement.setAttribute('data-theme', newTheme);
    return { theme: newTheme };
  }),

  setTheme: (t) => set(() => {
    try {
      localStorage.setItem('trajex-theme', t);
    } catch (e) { }
    document.documentElement.setAttribute('data-theme', t);
    return { theme: t };
  }),
}));

export default useThemeStore;
