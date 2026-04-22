import { supabase } from '../lib/supabase';
import { HistoryItem } from '../types';

export const syncService = {
  saveHistory: async (userId: string, item: HistoryItem) => {
    try {
      const { error } = await supabase
        .from('reading_history')
        .upsert({
          user_id: userId,
          slug: item.slug,
          novel_title: item.novelTitle,
          chapter_id: item.chapterId,
          timestamp: new Date(item.timestamp).toISOString()
        }, {
          onConflict: 'user_id,slug'
        });

      if (error) {
        console.error('Error syncing history to Supabase:', error);
      }
    } catch (err) {
      console.error('Sync failed:', err);
    }
  },

  getHistory: async (userId: string): Promise<HistoryItem[]> => {
    try {
      const { data, error } = await supabase
        .from('reading_history')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(item => ({
        slug: item.slug,
        novelTitle: item.novel_title,
        chapterId: item.chapter_id,
        timestamp: new Date(item.timestamp).getTime()
      }));
    } catch (err) {
      console.error('Error fetching history from Supabase:', err);
      return [];
    }
  }
};
