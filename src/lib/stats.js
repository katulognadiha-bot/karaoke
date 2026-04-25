import { supabase } from './supabase';

export const recordSongPlay = async (song) => {
  if (!supabase) return;

  try {
    // Check if song exists to get current play count
    const { data, error } = await supabase
      .from('song_stats')
      .select('play_count')
      .eq('id', song.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
      console.error('Error fetching song stats:', error);
      return;
    }

    const newCount = (data?.play_count || 0) + 1;

    const { error: upsertError } = await supabase
      .from('song_stats')
      .upsert({
        id: song.id,
        title: song.title,
        thumbnail: song.thumbnail,
        channel: song.channel,
        play_count: newCount,
        last_played: new Date().toISOString()
      });

    if (upsertError) {
      console.error('Error recording song play:', upsertError);
    }
  } catch (err) {
    console.error('Failed to record song play:', err);
  }
};

export const getPopularSongs = async (limit = 10) => {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('song_stats')
      .select('*')
      .order('play_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching popular songs:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Failed to get popular songs:', err);
    return [];
  }
};
