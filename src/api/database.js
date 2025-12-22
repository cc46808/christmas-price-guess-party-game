import { supabase } from './supabaseClient';

// Helper functions to replace base44.entities calls with Supabase queries

export const db = {
  games: {
    async filter(conditions) {
      let query = supabase.from('games').select('*');
      Object.entries(conditions).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    
    async create(data) {
      const { data: result, error } = await supabase
        .from('games')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    
    async update(id, data) {
      const { data: result, error } = await supabase
        .from('games')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    }
  },
  
  players: {
    async filter(conditions) {
      let query = supabase.from('players').select('*');
      Object.entries(conditions).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    
    async create(data) {
      const { data: result, error } = await supabase
        .from('players')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    
    async update(id, data) {
      const { data: result, error } = await supabase
        .from('players')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    }
  },
  
  rounds: {
    async filter(conditions) {
      let query = supabase.from('rounds').select('*').order('round_number', { ascending: true });
      Object.entries(conditions).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    
    async create(data) {
      const { data: result, error } = await supabase
        .from('rounds')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    
    async update(id, data) {
      const { data: result, error } = await supabase
        .from('rounds')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    }
  },
  
  guesses: {
    async filter(conditions) {
      let query = supabase.from('guesses').select('*');
      Object.entries(conditions).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    
    async create(data) {
      const { data: result, error } = await supabase
        .from('guesses')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    
    async update(id, data) {
      const { data: result, error } = await supabase
        .from('guesses')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    }
  },
  
  balanceEvents: {
    async filter(conditions) {
      let query = supabase.from('balance_events').select('*').order('created_at', { ascending: true });
      Object.entries(conditions).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    
    async create(data) {
      const { data: result, error } = await supabase
        .from('balance_events')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    }
  },
  
  gameEventLogs: {
    async filter(conditions) {
      let query = supabase.from('game_event_logs').select('*').order('created_at', { ascending: true });
      Object.entries(conditions).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    
    async create(data) {
      const { data: result, error } = await supabase
        .from('game_event_logs')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    }
  }
};

// Backward compatibility - map old base44 entity names to new structure
export const entities = {
  Game: db.games,
  Player: db.players,
  Round: db.rounds,
  Guess: db.guesses,
  BalanceEvent: db.balanceEvents,
  GameEventLog: db.gameEventLogs
};
