import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { entities } from '@/api/database';
import { subscribeToGame } from '@/api/realtime';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChristmasCard, GlowText } from './GameTheme';
import PlayerAvatar from './PlayerAvatar';
import Leaderboard from './Leaderboard';
import { AVATARS } from './avatars';
import { 
  Play, Pause, SkipForward, Eye, CheckCircle, 
  RotateCcw, DollarSign, Users, ListOrdered, History,
  Loader2, AlertCircle, Coffee, Trophy, Settings, Plus, Trash2, Save, UserX, Check
} from 'lucide-react';

export default function GMControlPanel({ gameCode }) {
  const [game, setGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [currentRound, setCurrentRound] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [balanceEvents, setBalanceEvents] = useState([]);
  const [eventLogs, setEventLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [activeTab, setActiveTab] = useState('controls');
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [showMissingGuessDialog, setShowMissingGuessDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [missingGuessValue, setMissingGuessValue] = useState('');
  const [editTab, setEditTab] = useState('settings');
  const [editExactBonus, setEditExactBonus] = useState(5);
  const [editDefaultMissing, setEditDefaultMissing] = useState(1);
  const [editPlayers, setEditPlayers] = useState([]);
  const [editRounds, setEditRounds] = useState([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const timerRef = useRef(null);
  const unsubscribeRef = useRef(null);
  
  const fetchData = useCallback(async () => {
    try {
      const games = await entities.Game.filter({ code: gameCode });
      if (games.length === 0) return;
      
      const gameData = games[0];
      setGame(gameData);
      
      const [playersData, roundsData] = await Promise.all([
        entities.Player.filter({ game_id: gameData.id }),
        entities.Round.filter({ game_id: gameData.id })
      ]);
      
      setPlayers(playersData.sort((a, b) => (a.order || 0) - (b.order || 0)));
      setRounds(roundsData.sort((a, b) => a.index - b.index));
      
      if (gameData.current_round_index > 0) {
        const current = roundsData.find(r => r.index === gameData.current_round_index);
        setCurrentRound(current);
        
        if (current) {
          const guessesData = await entities.Guess.filter({ round_id: current.id });
          setGuesses(guessesData);
        }
        
        if (gameData.current_phase !== 'guessing') {
          setTimeRemaining(null);
        }
      }
      
      // Fetch balance events
      const events = await entities.BalanceEvent.filter({ game_id: gameData.id });
      setBalanceEvents(events);
      
      // Fetch event logs
      const logs = await entities.GameEventLog.filter({ game_id: gameData.id });
      setEventLogs(logs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }, [gameCode]);
  
  useEffect(() => {
    fetchData();
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [fetchData]);

  useEffect(() => {
    if (!game?.id) return;
    if (unsubscribeRef.current) unsubscribeRef.current();
    unsubscribeRef.current = subscribeToGame(game.id, fetchData);
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, [game?.id, fetchData]);

  // Polling fallback when realtime is unavailable
  useEffect(() => {
    if (!game?.id) return;
    
    // Poll every 2 seconds for GM updates
    const pollTimer = setInterval(() => {
      fetchData();
    }, 2000);
    
    return () => clearInterval(pollTimer);
  }, [game?.id, fetchData]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!game?.current_phase || game.current_phase !== 'guessing' || !game.guessing_start_time) {
      setTimeRemaining(null);
      return;
    }
    const tick = () => {
      const startTime = new Date(game.guessing_start_time).getTime();
      const duration = (game.guessing_duration_seconds || 10) * 1000;
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.ceil((duration - elapsed) / 1000));
      setTimeRemaining(remaining);
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [game?.current_phase, game?.guessing_start_time, game?.guessing_duration_seconds]);
  
  // Game control actions
  const startGame = async () => {
    setActionLoading(true);
    try {
      // Give all players $20
      for (const player of players) {
        await entities.Player.update(player.id, { balance: 20 });
        await entities.BalanceEvent.create({
          game_id: game.id,
          player_id: player.id,
          type: 'deposit',
          amount: 20,
          note: 'Starting balance'
        });
      }
      
      await entities.Game.update(game.id, {
        status: 'in_progress',
        started_at: new Date().toISOString(),
        current_round_index: 1,
        current_phase: 'listening'
      });
      
      // Update first round status
      const firstRound = rounds.find(r => r.index === 1);
      if (firstRound) {
        await entities.Round.update(firstRound.id, { status: 'listening' });
      }
      
      await entities.GameEventLog.create({
        game_id: game.id,
        type: 'game_started',
        payload: {}
      });
      
      await fetchData();
    } catch (err) {
      console.error('Error starting game:', err);
    }
    setActionLoading(false);
  };
  
  const startRound = async () => {
    setActionLoading(true);
    try {
      await entities.Game.update(game.id, { current_phase: 'listening' });
      
      if (currentRound) {
        await entities.Round.update(currentRound.id, { status: 'listening' });
      }
      
      await entities.GameEventLog.create({
        game_id: game.id,
        type: 'round_start',
        payload: { round: game.current_round_index }
      });
      
      await fetchData();
    } catch (err) {
      console.error('Error starting round:', err);
    }
    setActionLoading(false);
  };
  
  const openGuessing = async () => {
    setActionLoading(true);
    try {
      await entities.Game.update(game.id, {
        current_phase: 'guessing',
        guessing_start_time: new Date().toISOString(),
        guessing_duration_seconds: 10
      });
      
      if (currentRound) {
        await entities.Round.update(currentRound.id, { 
          status: 'guessing',
          guessing_start_time: new Date().toISOString()
        });
      }
      
      await entities.GameEventLog.create({
        game_id: game.id,
        type: 'guessing_open',
        payload: { round: game.current_round_index }
      });
      
      await fetchData();
    } catch (err) {
      console.error('Error opening guessing:', err);
    }
    setActionLoading(false);
  };
  
  const closeGuessing = async () => {
    setActionLoading(true);
    try {
      await entities.Game.update(game.id, { current_phase: 'closed' });
      
      if (currentRound) {
        await entities.Round.update(currentRound.id, { status: 'closed' });
      }
      
      await entities.GameEventLog.create({
        game_id: game.id,
        type: 'guessing_closed',
        payload: { round: game.current_round_index }
      });
      
      await fetchData();
    } catch (err) {
      console.error('Error closing guessing:', err);
    }
    setActionLoading(false);
  };
  
  const revealPrice = async () => {
    setActionLoading(true);
    try {
      await entities.Game.update(game.id, { current_phase: 'revealing' });
      
      if (currentRound) {
        await entities.Round.update(currentRound.id, { status: 'revealed' });
      }
      
      await entities.GameEventLog.create({
        game_id: game.id,
        type: 'price_revealed',
        payload: { round: game.current_round_index, price: currentRound?.actual_price }
      });
      
      await fetchData();
    } catch (err) {
      console.error('Error revealing price:', err);
    }
    setActionLoading(false);
  };
  
  const scoreRound = async () => {
    setActionLoading(true);
    try {
      const actualPrice = currentRound.actual_price;
      const exactGuessers = [];
      let closestDiff = Infinity;
      let closestPlayers = [];
      
      // Calculate scores
      for (const player of players) {
        const playerGuess = guesses.find(g => g.player_id === player.id);
        const guessValue = playerGuess ? playerGuess.value : game.default_missing_guess_value;
        const diff = Math.abs(guessValue - actualPrice);
        const delta = -diff;
        
        // Track cumulative answer time (only if they submitted)
        let cumulativeTime = player.cumulative_answer_time || 0;
        if (playerGuess && playerGuess.submitted_at && currentRound.guessing_start_time) {
          const guessTime = new Date(playerGuess.submitted_at).getTime();
          const startTime = new Date(currentRound.guessing_start_time).getTime();
          const answerTime = Math.max(0, (guessTime - startTime) / 1000); // seconds
          cumulativeTime += answerTime;
        }
        
        // Update player balance and cumulative time
        let newBalance = player.balance + delta;
        
        // Check for exact guess bonus
        if (diff === 0 && game.exact_bonus_amount > 0) {
          newBalance += game.exact_bonus_amount;
          exactGuessers.push(player.id);
          
          await entities.BalanceEvent.create({
            game_id: game.id,
            player_id: player.id,
            type: 'exact_bonus',
            amount: game.exact_bonus_amount,
            round_id: currentRound.id,
            note: 'Exact guess bonus'
          });
        }
        
        await entities.Player.update(player.id, { 
          balance: newBalance,
          cumulative_answer_time: cumulativeTime
        });
        
        await entities.BalanceEvent.create({
          game_id: game.id,
          player_id: player.id,
          type: 'round_delta',
          amount: delta,
          round_id: currentRound.id,
          note: `Guess: $${guessValue}, Actual: $${actualPrice}`
        });
        
        // Track closest
        if (diff < closestDiff) {
          closestDiff = diff;
          closestPlayers = [{ playerId: player.id, submittedAt: playerGuess?.submitted_at || '9999' }];
        } else if (diff === closestDiff) {
          closestPlayers.push({ playerId: player.id, submittedAt: playerGuess?.submitted_at || '9999' });
        }
      }
      
      // Determine closest winner (tie-break by submission time)
      closestPlayers.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
      const closestWinnerId = closestPlayers[0]?.playerId;
      
      await entities.Round.update(currentRound.id, { 
        status: 'scored',
        closest_winner_id: closestWinnerId,
        exact_guessers: exactGuessers
      });
      
      await entities.Game.update(game.id, { current_phase: 'results' });
      
      await entities.GameEventLog.create({
        game_id: game.id,
        type: 'round_scored',
        payload: { 
          round: game.current_round_index,
          closestWinner: closestWinnerId,
          exactGuessers
        }
      });
      
      await fetchData();
    } catch (err) {
      console.error('Error scoring round:', err);
    }
    setActionLoading(false);
  };
  
  const endRound = async () => {
    setActionLoading(true);
    try {
      const nextRoundIndex = game.current_round_index + 1;
      const isBreakRound = [5, 10, 15, 20].includes(game.current_round_index);
      const isGameOver = nextRoundIndex > game.total_rounds;
      
      if (isBreakRound) {
        await entities.Game.update(game.id, { current_phase: 'break' });
        await entities.GameEventLog.create({
          game_id: game.id,
          type: 'break_started',
          payload: { afterRound: game.current_round_index }
        });
      } else if (isGameOver) {
        await entities.Game.update(game.id, { 
          status: 'finished',
          current_phase: 'break'
        });
      } else {
        // Move to next round
        await entities.Game.update(game.id, {
          current_round_index: nextRoundIndex,
          current_phase: 'listening'
        });
        
        const nextRound = rounds.find(r => r.index === nextRoundIndex);
        if (nextRound) {
          await entities.Round.update(nextRound.id, { status: 'listening' });
        }
      }
      
      await fetchData();
    } catch (err) {
      console.error('Error ending round:', err);
    }
    setActionLoading(false);
  };
  
  const continueFromBreak = async () => {
    setActionLoading(true);
    try {
      const nextRoundIndex = game.current_round_index + 1;
      
      if (nextRoundIndex <= game.total_rounds) {
        await entities.Game.update(game.id, {
          current_round_index: nextRoundIndex,
          current_phase: 'listening'
        });
        
        const nextRound = rounds.find(r => r.index === nextRoundIndex);
        if (nextRound) {
          await entities.Round.update(nextRound.id, { status: 'listening' });
        }
      }
      
      await fetchData();
    } catch (err) {
      console.error('Error continuing from break:', err);
    }
    setActionLoading(false);
  };
  
  const togglePause = async () => {
    setActionLoading(true);
    try {
      await entities.Game.update(game.id, { is_paused: !game.is_paused });
      
      await entities.GameEventLog.create({
        game_id: game.id,
        type: game.is_paused ? 'game_resumed' : 'game_paused',
        payload: {}
      });
      
      await fetchData();
    } catch (err) {
      console.error('Error toggling pause:', err);
    }
    setActionLoading(false);
  };
  
  const undoRound = async () => {
    if (!currentRound || currentRound.status !== 'scored') return;
    
    setActionLoading(true);
    try {
      // Revert balance changes for this round
      const roundEvents = balanceEvents.filter(e => e.round_id === currentRound.id);
      
      for (const event of roundEvents) {
        const player = players.find(p => p.id === event.player_id);
        if (player) {
          await entities.Player.update(player.id, { 
            balance: player.balance - event.amount 
          });
        }
        
        // Delete the event
        await entities.BalanceEvent.delete(event.id);
      }
      
      // Delete guesses
      for (const guess of guesses) {
        await entities.Guess.delete(guess.id);
      }
      
      // Reset round
      await entities.Round.update(currentRound.id, { 
        status: 'listening',
        closest_winner_id: null,
        exact_guessers: []
      });
      
      await entities.Game.update(game.id, { current_phase: 'listening' });
      
      await entities.GameEventLog.create({
        game_id: game.id,
        type: 'round_undone',
        payload: { round: game.current_round_index }
      });
      
      await fetchData();
    } catch (err) {
      console.error('Error undoing round:', err);
    }
    setActionLoading(false);
  };
  
  const resetGame = async () => {
    setActionLoading(true);
    try {
      // Delete all balance events
      for (const event of balanceEvents) {
        await entities.BalanceEvent.delete(event.id);
      }
      
      // Delete all guesses
      const allGuesses = await entities.Guess.filter({ game_id: game.id });
      for (const guess of allGuesses) {
        await entities.Guess.delete(guess.id);
      }
      
      // Reset all rounds to listening status
      for (const round of rounds) {
        await entities.Round.update(round.id, {
          status: 'listening',
          closest_winner_id: null,
          exact_guessers: []
        });
      }
      
      // Reset all players to starting balance
      for (const player of players) {
        await entities.Player.update(player.id, {
          balance: game.starting_balance || 20,
          cumulative_answer_time: 0
        });
      }
      
      // Reset game to first round
      await entities.Game.update(game.id, {
        status: 'lobby',
        current_round_index: 0,
        current_phase: 'lobby',
        is_paused: false
      });
      
      await entities.GameEventLog.create({
        game_id: game.id,
        type: 'game_reset',
        payload: { message: 'Game reset to beginning' }
      });
      
      setShowResetDialog(false);
      await fetchData();
    } catch (err) {
      console.error('Error resetting game:', err);
    }
    setActionLoading(false);
  };
  
  const adjustBalance = async () => {
    if (!selectedPlayer || !balanceAmount) return;
    
    setActionLoading(true);
    try {
      const amount = parseInt(balanceAmount);
      const newBalance = selectedPlayer.balance + amount;
      
      await entities.Player.update(selectedPlayer.id, { balance: newBalance });
      
      await entities.BalanceEvent.create({
        game_id: game.id,
        player_id: selectedPlayer.id,
        type: 'manual_adjust',
        amount: amount,
        note: 'GM manual adjustment'
      });
      
      await entities.GameEventLog.create({
        game_id: game.id,
        type: 'manual_balance',
        payload: { playerId: selectedPlayer.id, amount }
      });
      
      setShowBalanceDialog(false);
      setSelectedPlayer(null);
      setBalanceAmount('');
      await fetchData();
    } catch (err) {
      console.error('Error adjusting balance:', err);
    }
    setActionLoading(false);
  };
  
  const exportGameData = async () => {
    try {
      // Gather all game data
      const allGuesses = await entities.Guess.filter({ game_id: game.id });
      const allEvents = await entities.GameEventLog.filter({ game_id: game.id });
      
      const exportData = {
        game: game,
        players: players,
        rounds: rounds,
        guesses: allGuesses,
        balanceEvents: balanceEvents,
        eventLog: allEvents,
        exportedAt: new Date().toISOString()
      };
      
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `game-${game.code}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting game data:', err);
    }
  };
  
  const overrideMissingGuess = async () => {
    if (!selectedPlayer || !missingGuessValue || !currentRound) return;
    
    setActionLoading(true);
    try {
      const value = parseInt(missingGuessValue);
      
      // Create or update guess with override
      const existingGuess = guesses.find(g => g.player_id === selectedPlayer.id);
      
      if (existingGuess) {
        await entities.Guess.update(existingGuess.id, {
          value: value,
          submitted_at: new Date().toISOString(),
          revision: (existingGuess.revision || 1) + 1,
          is_override: true
        });
      } else {
        await entities.Guess.create({
          game_id: game.id,
          round_id: currentRound.id,
          player_id: selectedPlayer.id,
          value: value,
          submitted_at: new Date().toISOString(),
          revision: 1,
          is_override: true
        });
      }
      
      await entities.GameEventLog.create({
        game_id: game.id,
        type: 'missing_guess_override',
        payload: { 
          playerId: selectedPlayer.id, 
          roundId: currentRound.id,
          value: value 
        }
      });
      
      setShowMissingGuessDialog(false);
      setSelectedPlayer(null);
      setMissingGuessValue('');
      await fetchData();
    } catch (err) {
      console.error('Error overriding missing guess:', err);
    }
    setActionLoading(false);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b1c2c] via-[#0f3b33] to-[#0b1c2c] flex items-center justify-center relative">
        <Loader2 className="w-12 h-12 text-amber-200 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1c2c] via-[#0f3b33] to-[#0b1c2c] p-4 relative">
      
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-yellow-300">GM Control: {gameCode}</h1>
            <div className="text-white/70">
              Status: <span className="text-white font-bold">{game?.status}</span>
              {game?.is_paused && <span className="text-red-400 ml-2">PAUSED</span>}
            </div>
          </div>
          
          <div className="flex gap-2">
            {game?.status === 'in_progress' && (
              <Button
                onClick={togglePause}
                variant="outline"
                className="border-yellow-400 text-yellow-300"
              >
                {game?.is_paused ? <Play className="w-4 h-4 mr-1" /> : <Pause className="w-4 h-4 mr-1" />}
                {game?.is_paused ? 'Resume' : 'Pause'}
              </Button>
            )}
            <Button
              onClick={exportGameData}
              variant="outline"
              className="border-green-400 text-green-300"
            >
              <History className="w-4 h-4 mr-1" />
              Export Data
            </Button>
            <Button
              onClick={() => {
                setEditExactBonus(game?.exact_bonus_amount || 5);
                setEditDefaultMissing(game?.default_missing_guess_value || 1);
                setEditPlayers([...players]);
                setEditRounds([...rounds]);
                setEditTab('settings');
                setEditError('');
                setShowEditDialog(true);
              }}
              variant="outline"
              className="border-blue-400 text-blue-300"
            >
              <Settings className="w-4 h-4 mr-1" />
              Edit Game
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-6">
            <TabsTrigger value="controls">Controls</TabsTrigger>
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="controls">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Game Controls */}
          <div className="lg:col-span-2 space-y-4">
            {/* Current Round Info */}
            {currentRound && (
              <Card className="bg-white/10 border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-yellow-300 flex items-center justify-between">
                    <span>Round {game.current_round_index} / {game.total_rounds}</span>
                    <span className="text-sm text-white/70 font-normal">
                      Phase: {game.current_phase}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-white/70 text-sm">Item</div>
                      <div className="text-white font-bold text-lg">{currentRound.item_name}</div>
                    </div>
                    <div>
                      <div className="text-white/70 text-sm">Actual Price</div>
                      <div className="text-green-400 font-bold text-2xl font-mono">
                        ${currentRound.actual_price}
                      </div>
                    </div>
                    <div>
                      <div className="text-white/70 text-sm">Range</div>
                      <div className="text-white">${currentRound.min_guess} - ${currentRound.max_guess}</div>
                    </div>
                    <div>
                      <div className="text-white/70 text-sm">Submitted</div>
                      <div className="text-white">{guesses.length} / {players.length}</div>
                    </div>
                  </div>
                  
                  {timeRemaining !== null && (
                    <div className="text-center mb-4">
                      <span className={`text-4xl font-black ${
                        timeRemaining <= 3 ? 'text-red-400' : timeRemaining <= 6 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {timeRemaining}s
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Control Buttons */}
            <Card className="bg-white/10 border-white/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-white">Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {game?.status === 'lobby' && (
                    <Button
                      onClick={startGame}
                      disabled={actionLoading || players.length < 2}
                      className="h-16 bg-green-600 hover:bg-green-700 col-span-2 md:col-span-3"
                    >
                      {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                        <><Play className="w-5 h-5 mr-2" /> START GAME</>}
                    </Button>
                  )}
                  
                  {game?.current_phase === 'waiting' && game?.status === 'in_progress' && (
                    <Button
                      onClick={startRound}
                      disabled={actionLoading}
                      className="h-14 bg-blue-600 hover:bg-blue-700"
                    >
                      <Play className="w-5 h-5 mr-2" /> Start Round
                    </Button>
                  )}
                  
                  {game?.current_phase === 'listening' && (
                    <Button
                      onClick={openGuessing}
                      disabled={actionLoading}
                      className="h-14 bg-green-600 hover:bg-green-700"
                    >
                      <Play className="w-5 h-5 mr-2" /> Open Guessing
                    </Button>
                  )}
                  
                  {game?.current_phase === 'guessing' && (
                    <Button
                      onClick={closeGuessing}
                      disabled={actionLoading}
                      className="h-14 bg-yellow-600 hover:bg-yellow-700"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" /> Close Guessing
                    </Button>
                  )}
                  
                  {game?.current_phase === 'closed' && (
                    <Button
                      onClick={revealPrice}
                      disabled={actionLoading}
                      className="h-14 bg-purple-600 hover:bg-purple-700"
                    >
                      <Eye className="w-5 h-5 mr-2" /> Reveal Price
                    </Button>
                  )}
                  
                  {game?.current_phase === 'revealing' && (
                    <Button
                      onClick={scoreRound}
                      disabled={actionLoading}
                      className="h-14 bg-orange-600 hover:bg-orange-700"
                    >
                      <DollarSign className="w-5 h-5 mr-2" /> Score Round
                    </Button>
                  )}
                  
                  {game?.current_phase === 'results' && (
                    <Button
                      onClick={endRound}
                      disabled={actionLoading}
                      className="h-14 bg-blue-600 hover:bg-blue-700"
                    >
                      <SkipForward className="w-5 h-5 mr-2" /> End Round
                    </Button>
                  )}
                  
                  {game?.current_phase === 'break' && (
                    <Button
                      onClick={continueFromBreak}
                      disabled={actionLoading || game.current_round_index >= game.total_rounds}
                      className="h-14 bg-green-600 hover:bg-green-700 col-span-2"
                    >
                      <Play className="w-5 h-5 mr-2" /> Continue to Next Round
                    </Button>
                  )}
                  
                  {currentRound?.status === 'scored' && (
                    <Button
                      onClick={undoRound}
                      disabled={actionLoading}
                      variant="outline"
                      className="h-14 border-red-400 text-red-300"
                    >
                      <RotateCcw className="w-5 h-5 mr-2" /> Undo Round
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => setShowResetDialog(true)}
                    disabled={actionLoading}
                    variant="outline"
                    className="h-14 border-orange-400 text-orange-300"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" /> Reset Game
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Guesses Table */}
            {guesses.length > 0 && (
              <Card className="bg-white/10 border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white">Current Round Guesses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {players.map(player => {
                      const guess = guesses.find(g => g.player_id === player.id);
                      const submissionTime = guess && game.guessing_start_time 
                        ? ((new Date(guess.submitted_at) - new Date(game.guessing_start_time)) / 1000).toFixed(1)
                        : null;
                      return (
                        <div key={player.id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                          <div className="flex items-center gap-3">
                            <PlayerAvatar player={player} size="sm" showName={false} />
                            <div>
                              <div className="text-white font-medium">{player.name}</div>
                              {submissionTime && (
                                <div className="text-xs text-white/60 font-mono">⏱️ {submissionTime}s</div>
                              )}
                            </div>
                          </div>
                          {guess ? (
                            <span className="text-yellow-300 font-bold font-mono text-xl">${guess.value}</span>
                          ) : (
                            <span className="text-white/50">Not submitted</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Right: Players & Leaderboard */}
          <div className="space-y-4">
            {/* Players with balance adjustment */}
            <Card className="bg-white/10 border-white/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Players
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {players.map(player => (
                  <div key={player.id} className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        player.connection_status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <PlayerAvatar player={player} size="sm" showName={false} />
                      <span className="text-white text-sm truncate max-w-[100px]">{player.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-bold ${
                        player.balance >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        ${player.balance}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedPlayer(player);
                          setShowBalanceDialog(true);
                        }}
                        className="h-8 w-8 p-0 text-yellow-300"
                      >
                        <DollarSign className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            
            {/* Leaderboard */}
            <Card className="bg-white/10 border-white/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Leaderboard players={players} size="sm" />
              </CardContent>
            </Card>
          </div>
        </div>
          </TabsContent>
          
          <TabsContent value="players">
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Player Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {players.map(player => {
                  const playerGuess = guesses.find(g => g.player_id === player.id);
                  const hasGuess = !!playerGuess;
                  
                  return (
                    <div key={player.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <PlayerAvatar player={player} size="sm" showStatus />
                        <div>
                          <div className="text-white font-bold">{player.name}</div>
                          <div className="text-sm text-white/60">
                            Balance: ${player.balance} | 
                            Time: {(player.cumulative_answer_time || 0).toFixed(1)}s
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedPlayer(player);
                            setShowBalanceDialog(true);
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <DollarSign className="w-4 h-4 mr-1" />
                          Balance
                        </Button>
                        
                        {currentRound && game.current_phase !== 'lobby' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPlayer(player);
                              setMissingGuessValue(hasGuess ? String(playerGuess.value) : '');
                              setShowMissingGuessDialog(true);
                            }}
                            className="border-yellow-400 text-yellow-300"
                          >
                            {hasGuess ? 'Edit' : 'Set'} Guess
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history">
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Game Event Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {eventLogs.map((log, i) => (
                    <div key={i} className="p-3 bg-white/5 rounded text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-mono text-yellow-300">{log.type}</span>
                        <span className="text-white/50 text-xs">
                          {new Date(log.created_date).toLocaleString()}
                        </span>
                      </div>
                      {log.payload && (
                        <pre className="text-white/70 text-xs mt-1 whitespace-pre-wrap">
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                  {eventLogs.length === 0 && (
                    <div className="text-white/50 text-center py-8">No events yet</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Balance Adjustment Dialog */}
      <Dialog open={showBalanceDialog} onOpenChange={setShowBalanceDialog}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              Adjust Balance: {selectedPlayer?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-white/70">Current Balance: </span>
              <span className={`font-bold font-mono text-xl ${
                (selectedPlayer?.balance || 0) >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                ${selectedPlayer?.balance}
              </span>
            </div>
            
            <div>
              <label className="text-white/70 text-sm">Amount to add/subtract</label>
              <Input
                type="number"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                placeholder="e.g., 5 or -3"
                className="bg-white/10 mt-1"
              />
              <p className="text-white/50 text-xs mt-1">Use negative numbers to subtract</p>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => setShowBalanceDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={adjustBalance}
                disabled={!balanceAmount || actionLoading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Missing Guess Override Dialog */}
      <Dialog open={showMissingGuessDialog} onOpenChange={setShowMissingGuessDialog}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              Override Guess: {selectedPlayer?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-white/70 text-sm">
              Set or override this player's guess for Round {game?.current_round_index}.
              This will be used for scoring.
            </div>
            <div>
              <label className="text-white text-sm mb-2 block">Guess Value ($)</label>
              <Input
                type="number"
                value={missingGuessValue}
                onChange={(e) => setMissingGuessValue(e.target.value)}
                placeholder="Enter dollar amount"
                className="bg-white/10 text-white border-white/20"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowMissingGuessDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={overrideMissingGuess}
                disabled={!missingGuessValue || actionLoading}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set Guess'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Reset Game Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="bg-[#0f2838] border-2 border-orange-400">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-orange-400" />
              Reset Game?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-white/80">
              This will reset the game back to the beginning:
            </p>
            <ul className="text-white/70 space-y-2 list-disc list-inside">
              <li>All players reset to starting balance</li>
              <li>All guesses and balance events deleted</li>
              <li>Game returns to lobby (Round 0)</li>
              <li>All rounds reset to unplayed status</li>
            </ul>
            <p className="text-orange-300 font-bold">
              ⚠️ This action cannot be undone!
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowResetDialog(false)}
                variant="outline"
                className="flex-1 border-white/20 text-white"
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={resetGame}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                disabled={actionLoading}
              >
                {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Reset Game
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Game Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-[#0f2838] border-2 border-blue-400 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl flex items-center gap-2">
              <Settings className="w-6 h-6 text-blue-400" />
              Edit Game
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editError && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded-lg">
                {editError}
              </div>
            )}
            
            <Tabs value={editTab} onValueChange={setEditTab}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="players">Players</TabsTrigger>
                <TabsTrigger value="rounds">Rounds</TabsTrigger>
              </TabsList>
              
              <TabsContent value="settings">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-white text-sm block mb-2">Exact Guess Bonus ($)</label>
                      <Input
                        type="number"
                        value={editExactBonus}
                        onChange={(e) => setEditExactBonus(parseInt(e.target.value) || 0)}
                        min={0}
                        className="bg-white/10 text-white border-white/20"
                      />
                    </div>
                    <div>
                      <label className="text-white text-sm block mb-2">Default Missing Guess ($)</label>
                      <Input
                        type="number"
                        value={editDefaultMissing}
                        onChange={(e) => setEditDefaultMissing(parseInt(e.target.value) || 1)}
                        min={1}
                        className="bg-white/10 text-white border-white/20"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="players">
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-white font-medium">Manage Players</span>
                    <Button
                      onClick={() => setEditPlayers([...editPlayers, { name: '', avatar_id: 'santa', isNew: true }])}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Player
                    </Button>
                  </div>
                  {editPlayers.map((player, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-lg">
                      <span className="text-white/50 w-6">{i + 1}.</span>
                      
                      {/* Avatar Display */}
                      <button
                        onClick={() => {
                          setSelectedPlayerIndex(i);
                          setShowAvatarPicker(true);
                        }}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-2xl hover:ring-2 hover:ring-yellow-400 transition-all cursor-pointer bg-white/10"
                        title="Change avatar"
                      >
                        {AVATARS.find(a => a.id === player.avatar_id)?.emoji || '🎅'}
                      </button>
                      
                      <Input
                        value={player.name}
                        onChange={(e) => {
                          const updated = [...editPlayers];
                          updated[i] = { ...updated[i], name: e.target.value };
                          setEditPlayers(updated);
                        }}
                        placeholder="Player name"
                        className="flex-1 bg-white/10 text-white border-white/20"
                      />
                      {player.is_selected && (
                        <div className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">
                          <Check className="w-3 h-3" />
                          Logged In
                        </div>
                      )}
                      {player.id && player.is_selected && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedPlayer(player);
                            setSelectedPlayerIndex(i);
                            setShowUnlinkDialog(true);
                          }}
                          className="text-orange-400 hover:bg-orange-500/20"
                          title="Force re-login"
                        >
                          <UserX className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditPlayers(editPlayers.filter((_, idx) => idx !== i))}
                        className="text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {editPlayers.length === 0 && (
                    <p className="text-white/50 text-center py-8">No players</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="rounds">
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-white font-medium">Manage Rounds</span>
                    <Button
                      onClick={() => setEditRounds([...editRounds, {
                        item_name: '',
                        item_photo_url: '',
                        hint_text: '',
                        min_guess: 1,
                        max_guess: 10,
                        actual_price: '',
                        show_photo_to_players: true,
                        show_hint_to_players: true,
                        isNew: true
                      }])}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Round
                    </Button>
                  </div>
                  {editRounds.map((round, i) => (
                    <div key={i} className="bg-white/5 p-4 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-yellow-300 font-bold">Round {i + 1}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditRounds(editRounds.filter((_, idx) => idx !== i))}
                          className="text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-white text-xs mb-1 block">Item Name *</label>
                          <Input
                            value={round.item_name}
                            onChange={(e) => {
                              const updated = [...editRounds];
                              updated[i] = { ...updated[i], item_name: e.target.value };
                              setEditRounds(updated);
                            }}
                            placeholder="e.g., Teddy Bear"
                            className="bg-white/10 text-white border-white/20 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-white text-xs mb-1 block">Actual Price ($) *</label>
                          <Input
                            type="number"
                            value={round.actual_price}
                            onChange={(e) => {
                              const updated = [...editRounds];
                              updated[i] = { ...updated[i], actual_price: e.target.value };
                              setEditRounds(updated);
                            }}
                            placeholder="e.g., 5"
                            className="bg-white/10 text-white border-white/20 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-white text-xs mb-1 block">Photo URL</label>
                          <Input
                            value={round.item_photo_url}
                            onChange={(e) => {
                              const updated = [...editRounds];
                              updated[i] = { ...updated[i], item_photo_url: e.target.value };
                              setEditRounds(updated);
                            }}
                            placeholder="https://..."
                            className="bg-white/10 text-white border-white/20 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-white text-xs mb-1 block">Hint</label>
                          <Input
                            value={round.hint_text}
                            onChange={(e) => {
                              const updated = [...editRounds];
                              updated[i] = { ...updated[i], hint_text: e.target.value };
                              setEditRounds(updated);
                            }}
                            placeholder="e.g., Popular toy"
                            className="bg-white/10 text-white border-white/20 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-white text-xs mb-1 block">Min Guess ($)</label>
                          <Input
                            type="number"
                            value={round.min_guess}
                            onChange={(e) => {
                              const updated = [...editRounds];
                              updated[i] = { ...updated[i], min_guess: parseInt(e.target.value) || 1 };
                              setEditRounds(updated);
                            }}
                            className="bg-white/10 text-white border-white/20 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-white text-xs mb-1 block">Max Guess ($)</label>
                          <Input
                            type="number"
                            value={round.max_guess}
                            onChange={(e) => {
                              const updated = [...editRounds];
                              updated[i] = { ...updated[i], max_guess: parseInt(e.target.value) || 10 };
                              setEditRounds(updated);
                            }}
                            className="bg-white/10 text-white border-white/20 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {editRounds.length === 0 && (
                    <p className="text-white/50 text-center py-8">No rounds</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex gap-3 pt-4 border-t border-white/20">
              <Button
                onClick={() => setShowEditDialog(false)}
                variant="outline"
                className="flex-1 border-white/20 text-white"
                disabled={editSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  setEditSaving(true);
                  setEditError('');
                  
                  try {
                    // Update game settings
                    await entities.Game.update(game.id, {
                      exact_bonus_amount: editExactBonus,
                      default_missing_guess_value: editDefaultMissing,
                      total_rounds: editRounds.filter(r => r.item_name.trim() && r.actual_price).length
                    });
                    
                    // Update/create/delete players
                    const existingPlayerIds = players.map(p => p.id);
                    const editPlayerIds = editPlayers.filter(p => p.id).map(p => p.id);
                    
                    // Delete removed players
                    for (const playerId of existingPlayerIds) {
                      if (!editPlayerIds.includes(playerId)) {
                        await entities.Player.delete(playerId);
                      }
                    }
                    
                    // Update/create players
                    for (let i = 0; i < editPlayers.length; i++) {
                      const player = editPlayers[i];
                      if (!player.name.trim()) continue;
                      
                      if (player.id) {
                        // Update existing
                        await entities.Player.update(player.id, {
                          name: player.name,
                          avatar_id: player.avatar_id,
                          order: i
                        });
                      } else {
                        // Create new
                        await entities.Player.create({
                          game_id: game.id,
                          name: player.name,
                          avatar_id: player.avatar_id || 'santa',
                          balance: 0,
                          is_selected: false,
                          connection_status: 'disconnected',
                          order: i
                        });
                      }
                    }
                    
                    // Update/create/delete rounds
                    const existingRoundIds = rounds.map(r => r.id);
                    const editRoundIds = editRounds.filter(r => r.id).map(r => r.id);
                    
                    // Delete removed rounds
                    for (const roundId of existingRoundIds) {
                      if (!editRoundIds.includes(roundId)) {
                        await entities.Round.delete(roundId);
                      }
                    }
                    
                    // Update/create rounds
                    for (let i = 0; i < editRounds.length; i++) {
                      const round = editRounds[i];
                      if (!round.item_name.trim() || !round.actual_price) continue;
                      
                      const roundData = {
                        index: i + 1,
                        item_name: round.item_name,
                        item_photo_url: round.item_photo_url || '',
                        hint_text: round.hint_text || '',
                        min_guess: round.min_guess || 1,
                        max_guess: round.max_guess || 10,
                        actual_price: parseInt(round.actual_price),
                        show_photo_to_players: round.show_photo_to_players !== false,
                        show_hint_to_players: round.show_hint_to_players !== false
                      };
                      
                      if (round.id) {
                        // Update existing
                        await entities.Round.update(round.id, roundData);
                      } else {
                        // Create new
                        await entities.Round.create({
                          game_id: game.id,
                          ...roundData,
                          status: 'pending'
                        });
                      }
                    }
                    
                    // Log the edit
                    await entities.GameEventLog.create({
                      game_id: game.id,
                      type: 'game_edited',
                      payload: { 
                        players: editPlayers.filter(p => p.name.trim()).length,
                        rounds: editRounds.filter(r => r.item_name.trim() && r.actual_price).length
                      }
                    });
                    
                    setShowEditDialog(false);
                    await fetchData();
                  } catch (err) {
                    console.error('Error updating game:', err);
                    setEditError('Failed to update game. Please try again.');
                  }
                  
                  setEditSaving(false);
                }}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                disabled={editSaving}
              >
                {editSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Unlink Player Confirmation Dialog */}
      <Dialog open={showUnlinkDialog} onOpenChange={setShowUnlinkDialog}>
        <DialogContent className="bg-[#0f2838] border-2 border-orange-400">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <UserX className="w-6 h-6 text-orange-400" />
              Force Player Re-login?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-white/80">
              Unlink <span className="font-bold text-white">{selectedPlayer?.name}</span>?
            </p>
            <p className="text-white/70 text-sm">
              This will log them out and they'll need to select their name again to rejoin the game.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowUnlinkDialog(false)}
                variant="outline"
                className="flex-1 border-white/20 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await entities.Player.update(selectedPlayer.id, {
                      is_selected: false,
                      session_token: null,
                      connection_status: 'disconnected'
                    });
                    const updated = [...editPlayers];
                    updated[selectedPlayerIndex] = { 
                      ...updated[selectedPlayerIndex], 
                      is_selected: false, 
                      session_token: null 
                    };
                    setEditPlayers(updated);
                    setShowUnlinkDialog(false);
                  } catch (err) {
                    console.error('Error unlinking player:', err);
                    setEditError('Failed to unlink player');
                  }
                }}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                Unlink Player
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Avatar Picker Dialog */}
      <Dialog open={showAvatarPicker} onOpenChange={setShowAvatarPicker}>
        <DialogContent className="bg-[#0f2838] border-2 border-yellow-400 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">
              Choose Avatar
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-6 gap-3">
            {AVATARS.map((avatar) => (
              <button
                key={avatar.id}
                onClick={() => {
                  const updated = [...editPlayers];
                  updated[selectedPlayerIndex] = { 
                    ...updated[selectedPlayerIndex], 
                    avatar_id: avatar.id 
                  };
                  setEditPlayers(updated);
                  setShowAvatarPicker(false);
                }}
                className={`
                  w-full aspect-square rounded-xl flex flex-col items-center justify-center
                  transition-all hover:scale-110 hover:shadow-lg
                  ${avatar.bg} border-4
                  ${editPlayers[selectedPlayerIndex]?.avatar_id === avatar.id 
                    ? 'border-yellow-400 ring-4 ring-yellow-400/50' 
                    : 'border-white/20 hover:border-yellow-400'
                  }
                `}
                title={avatar.name}
              >
                <span className="text-4xl mb-1">{avatar.emoji}</span>
                <span className="text-xs text-white/80 font-medium text-center px-1">
                  {avatar.name}
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
