import { useState, useEffect, useCallback, useRef } from 'react';
import { entities } from '@/api/database';
import { subscribeToGame } from '@/api/realtime';

export function useGameState(gameCode, role = 'player') {
  const [game, setGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [currentRound, setCurrentRound] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [balanceEvents, setBalanceEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serverTime, setServerTime] = useState(Date.now());
  const unsubscribeRef = useRef(null);

  const fetchGameData = useCallback(async () => {
    if (!gameCode) return;
    
    try {
      const games = await entities.Game.filter({ code: gameCode });
      if (games.length === 0) {
        setError('Game not found');
        setLoading(false);
        return;
      }
      
      const gameData = games[0];
      setGame(gameData);
      
      const [playersData, roundsData] = await Promise.all([
        entities.Player.filter({ game_id: gameData.id }),
        entities.Round.filter({ game_id: gameData.id })
      ]);
      
      setPlayers(playersData.sort((a, b) => (a.order || 0) - (b.order || 0)));
      setRounds(roundsData.sort((a, b) => a.index - b.index));
      
      // Get current round
      if (gameData.current_round_index > 0 && roundsData.length > 0) {
        const current = roundsData.find(r => r.index === gameData.current_round_index);
        setCurrentRound(current || null);
        
        // Fetch guesses for current round
        if (current) {
          const guessesData = await entities.Guess.filter({ round_id: current.id });
          setGuesses(guessesData);
        }
      }
      
      // Fetch balance events if GM
      if (role === 'gm') {
        const events = await entities.BalanceEvent.filter({ game_id: gameData.id });
        setBalanceEvents(events);
      }
      
      setServerTime(Date.now());
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error fetching game data:', err);
      setError('Failed to load game data');
      setLoading(false);
    }
  }, [gameCode, role]);

  // Initial fetch and cleanup
  useEffect(() => {
    fetchGameData();
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [fetchGameData]);

  // Realtime subscription once game is known
  useEffect(() => {
    if (!game?.id) return;
    if (unsubscribeRef.current) unsubscribeRef.current();
    unsubscribeRef.current = subscribeToGame(game.id, fetchGameData);
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, [game?.id, fetchGameData]);

  // Local clock to keep time-based calculations current between realtime events
  useEffect(() => {
    const intervalId = setInterval(() => setServerTime(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Calculate time remaining for guessing phase
  const getTimeRemaining = useCallback(() => {
    if (!game || game.current_phase !== 'guessing' || !game.guessing_start_time) {
      return null;
    }
    
    const startTime = new Date(game.guessing_start_time).getTime();
    const duration = (game.guessing_duration_seconds || 10) * 1000;
    const elapsed = serverTime - startTime;
    const remaining = Math.max(0, duration - elapsed);
    
    return Math.ceil(remaining / 1000);
  }, [game, serverTime]);

  return {
    game,
    players,
    rounds,
    currentRound,
    guesses,
    balanceEvents,
    loading,
    error,
    serverTime,
    getTimeRemaining,
    refresh: fetchGameData
  };
}

export function usePlayerSession(gameCode) {
  const [playerToken, setPlayerToken] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);

  useEffect(() => {
    // Check localStorage for existing session
    const stored = localStorage.getItem(`player_session_${gameCode}`);
    if (stored) {
      setPlayerToken(stored);
    }
  }, [gameCode]);

  const selectPlayer = async (playerId, token) => {
    localStorage.setItem(`player_session_${gameCode}`, token);
    setPlayerToken(token);
    
    // Update player as selected
    await entities.Player.update(playerId, {
      is_selected: true,
      session_token: token,
      connection_status: 'connected',
      last_seen_at: new Date().toISOString()
    });
  };

  const clearSession = () => {
    localStorage.removeItem(`player_session_${gameCode}`);
    setPlayerToken(null);
    setCurrentPlayer(null);
  };

  return {
    playerToken,
    currentPlayer,
    setCurrentPlayer,
    selectPlayer,
    clearSession
  };
}