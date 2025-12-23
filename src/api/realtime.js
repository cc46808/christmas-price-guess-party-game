import { supabase } from './supabaseClient';

// Subscribe to all relevant tables for a game. onChange is called on any mutation.
export function subscribeToGame(gameId, onChange) {
  if (!gameId) return () => {};
  const channel = supabase.channel(`game-${gameId}`);
  const tables = ['Game', 'Player', 'Round', 'Guess', 'BalanceEvent', 'GameEventLog'];

  tables.forEach((table) => {
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
