import { supabase } from './supabaseClient';

// Subscribe to all relevant tables for a game. onChange is called on any mutation.
export function subscribeToGame(gameId, onChange) {
  if (!gameId) return () => {};
  const channel = supabase.channel(`game-${gameId}`);

  // Subscribe to the Game table itself (by id, not game_id)
  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'Game',
      filter: `id=eq.${gameId}`
    },
    () => {
      onChange?.();
    }
  );

  // Subscribe to all child tables (by game_id)
  const childTables = ['Player', 'Round', 'Guess', 'BalanceEvent', 'GameEventLog'];
  childTables.forEach((table) => {
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter: `game_id=eq.${gameId}`
      },
      () => {
        onChange?.();
      }
    );
  });

  channel.subscribe();
  return () => {
    channel.unsubscribe();
  };
}
