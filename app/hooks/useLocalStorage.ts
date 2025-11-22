// EXPLANATION: This is a custom React hook that saves data to your browser's localStorage
// Think of localStorage like a tiny database in the browser that remembers things
// even after you close and reopen the page.

'use client'

import { useState, useEffect } from 'react';

// EXPLANATION: This function is reusable - we can use it to save ANY setting
// The <T> means it works with any type of data (strings, numbers, objects, etc.)
export function useLocalStorage<T>(key: string, initialValue: T) {
  // EXPLANATION: We use useState to store the current value in React
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // EXPLANATION: When the component first loads, check if there's a saved value
  useEffect(() => {
    try {
      // EXPLANATION: Try to get the saved value from localStorage
      const item = window.localStorage.getItem(key);
      if (item) {
        // EXPLANATION: If we found a saved value, use it instead of the initial value
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      // EXPLANATION: If something goes wrong (like localStorage is disabled), 
      // just use the initial value
      console.error(`Error loading ${key} from localStorage:`, error);
    }
  }, [key]);

  // EXPLANATION: This function updates BOTH React state AND localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // EXPLANATION: Allow value to be a function (like setState)
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // EXPLANATION: Update React state (makes the UI update)
      setStoredValue(valueToStore);
      
      // EXPLANATION: Save to localStorage (makes it persist after refresh)
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  };

  // EXPLANATION: Return the value and the function to update it
  // Just like useState returns [value, setValue]
  return [storedValue, setValue] as const;
}
