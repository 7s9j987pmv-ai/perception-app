import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://pjqyymoazqaqlzfufcsj.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqcXl5bW9henFhcWx6ZnVmY3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3NTE1MDgsImV4cCI6MjEwMjMyNzUwOH0.5H3-oxd5WgmdUf8xg8BvX6Im7KiyebsNf_LT_M2eFqg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
