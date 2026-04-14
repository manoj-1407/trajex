import { create } from 'zustand';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = localStorage.getItem('trajex-theme');
    if (stored === 'dark' || stored === 'light') return stored;
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
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
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
