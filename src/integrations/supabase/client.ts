
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const SUPABASE_URL = "https://whmvgdhodoybcixjaodm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndobXZnZGhvZG95YmNpeGphb2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTM0MjcsImV4cCI6MjA2MDIyOTQyN30.1X7AaBjetL5ypw2pvfPSpKMb1X0QZU2xAK5yTrD4iXw";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Clear any old non-user-specific data from localStorage
const clearOldLocalStorage = () => {
  // Clear any old non-user-specific data
  localStorage.removeItem('workoutHistory');
  localStorage.removeItem('workouts');
  localStorage.removeItem('exerciseWeights');
  
  // We'll also clear any user-specific data that isn't prefixed properly
  // This helps reset all workout histories
  Object.keys(localStorage).forEach(key => {
    if (key.includes('workout') || key.includes('exercise')) {
      localStorage.removeItem(key);
    }
  });
};

// Run cleanup on initialization
clearOldLocalStorage();

// Enable session persistence for "logged in forever" functionality
export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true, // Enable session persistence
      autoRefreshToken: true,
      storage: localStorage, // Use localStorage for persistence
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: { 'x-app-version': '1.0.0' },
    },
  }
);
