// EXPLANATION: This hook manages the theme (light/dark mode) for the entire app
// It uses our useLocalStorage hook to remember the user's choice

'use client'

import { useLocalStorage } from './useLocalStorage';

// EXPLANATION: Define what theme options we have
// We could add more themes later (like "auto" to follow system preference)
export type Theme = 'light' | 'dark';

export function useTheme() {
  // EXPLANATION: Load the saved theme, or default to 'light'
  // The 'echonotes-theme' key is where we store it in localStorage
  const [theme, setTheme] = useLocalStorage<Theme>('echonotes-theme', 'light');

  // EXPLANATION: Helper function to switch between light and dark
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // EXPLANATION: Return everything other components might need
  return {
    theme,           // Current theme ('light' or 'dark')
    setTheme,        // Function to set a specific theme
    toggleTheme,     // Function to toggle between light and dark
    isDark: theme === 'dark'  // Easy way to check if dark mode is on
  };
}
