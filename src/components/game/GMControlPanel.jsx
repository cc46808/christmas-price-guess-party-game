import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { entities } from '@/api/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SnowfallBackground, ChristmasCard, GlowText } from './GameTheme';
import PlayerAvatar from './PlayerAvatar';
import Leaderboard from './Leaderboard';
import { 
  Play, Pause, SkipForward, Eye, CheckCircle, 
  RotateCcw, DollarSign, Users, ListOrdered, History,
  Loader2, AlertCircle, Coffee, Trophy
} from 'lucide-react';

const POLL_INTERVAL = 500;

export default function GMControlPanel({ gameCode }) {
  const [game, setGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [currentRound, setCurrentRound] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [balanceEvents, setBalanceEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const pollRef = useRef(null);
  
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
        
        // Calculate time remaining
        if (gameData.current_phase === 'guessing' && gameData.guessing_start_time) {
          const startTime = new Date(gameData.guessing_start_time).getTime();
          const duration = (gameData.guessing_duration_seconds || 10) * 1000;
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, Math.ceil((duration - elapsed) / 1000));
          setTimeRemaining(remaining);
        } else {
          setTimeRemaining(null);
        }
      }
      
      // Fetch balance events
      const events = await entities.BalanceEvent.filter({ game_id: gameData.id });
      setBalanceEvents(events);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }, [gameCode]);
  
  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchData, POLL_INTERVAL);
    
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchData]);
  
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
        
        // Update player balance
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
        
        await entities.Player.update(player.id, { balance: newBalance });
        
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
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 p-4 relative">
      <SnowfallBackground intensity={15} />
      
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
          </div>
        </div>
        
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
                      return (
                        <div key={player.id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                          <div className="flex items-center gap-3">
                            <PlayerAvatar player={player} size="sm" showName={false} />
                            <span className="text-white font-medium">{player.name}</span>
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
                className="bg-white/90 mt-1"
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
    </div>
  );
}
