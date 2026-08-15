import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://pjqyymoazqaqlzfufcsj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqcXl5bW9henFhcWx6ZnVmY3NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3NTE1MDgsImV4cCI6MjEwMjMyNzUwOH0.5H3-oxd5WgmdUf8xg8BvX6Im7KiyebsNf_LT_M2eFqg";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
