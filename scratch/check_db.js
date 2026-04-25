
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTable() {
  const { data, error } = await supabase.from('song_stats').select('*').limit(1);
  if (error) {
    console.log('Error or table does not exist:', error.message);
  } else {
    console.log('Table exists, data:', data);
  }
}

checkTable();
