import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a single supabase client for interaction with your database
export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL') 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * DATABASE SCHEMA (Requirement):
 * table: queues
 * - id: uuid (primary key)
 * - session_id: text (unique room id)
 * - items: jsonb (list of songs)
 * - current_video: jsonb (currently playing)
 * - created_at: timestamp
 */
