import { supabase } from './supabaseClient';

// Helper function to generate IDs similar to base44 format
function generateId() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return timestamp + randomPart;
}

// Helper functions to replace base44.entities calls with Supabase queries

export const db = {
  Game: {
    async filter(conditions) {
      let query = supabase.from('Game').select('*');
      Object.entries(conditions).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    
    async create(data) {
      const dataWithId = { id: generateId(), ...data };
      const { data: result, error } = await supabase
        .from('Game')
        .insert(dataWithId)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    
    async update(id, data) {
      const { data: result, error } = await supabase
        .from('Game')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    }
  },
  
  Player: {
    async filter(conditions) {
      let query = supabase.from('Player').select('*');
      Object.entries(conditions).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    
    async create(data) {
      const dataWithId = { id: generateId(), ...data };
      const { data: result, error } = await supabase
        .from('Player')
        .insert(dataWithId)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    
    async update(id, data) {
      const { data: result, error } = await supabase
        .from('Player')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    }
  },
  
 Round: {
    async filter(conditions) {
      let query = supabase.from('Round').select('*').order('index', { ascending: true });
      Object.entries(conditions).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    
    async create(data) {
      const dataWithId = { id: generateId(), ...data };
      const { data: result, error } = await supabase
        .from('Round')
        .insert(dataWithId)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    
    async update(id, data) {
      const { data: result, error } = await supabase
        .from('Round')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    }
  },
  
  Guess: {
    async filter(conditions) {
      let query = supabase.from('Guess').select('*');
      Object.entries(conditions).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    
    async create(data) {
      const dataWithId = { id: generateId(), ...data };
      const { data: result, error } = await supabase
        .from('Guess')
        .insert(dataWithId)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    
    async update(id, data) {
      const { data: result, error } = await supabase
        .from('Guess')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    }
  },
  
  BalanceEvent: {
    async filter(conditions) {
      let query = supabase.from('BalanceEvent').select('*').order('created_date', { ascending: true });
      Object.entries(conditions).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    
    async create(data) {
      const dataWithId = { id: generateId(), ...data };
      const { data: result, error } = await supabase
        .from('BalanceEvent')
        .insert(dataWithId)
        .select()
        .single();
      if (error) throw error;
      return result;
    }
  },
  
  GameEventLog: {
    async filter(conditions) {
      let query = supabase.from('GameEventLog').select('*').order('created_date', { ascending: true });
      Object.entries(conditions).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    
    async create(data) {
      const dataWithId = { id: generateId(), ...data };
      const { data: result, error } = await supabase
        .from('GameEventLog')
        .insert(dataWithId)
        .select()
        .single();
      if (error) throw error;
      return result;
    }
  }
};

// Backward compatibility - map old base44 entity names to new structure
export const entities = {
  Game: db.Game,
  Player: db.Player,
  Round: db.Round,
  Guess: db.Guess,
  BalanceEvent: db.BalanceEvent,
  GameEventLog: db.GameEventLog
};
