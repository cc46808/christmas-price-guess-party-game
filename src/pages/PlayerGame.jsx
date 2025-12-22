import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { SnowfallBackground, ChristmasCard, GlowText } from '@/components/game/GameTheme';
import PlayerAvatar from '@/components/game/PlayerAvatar';
import PriceInput from '@/components/game/PriceInput';
import WalletAnimation, { MiniWalletChange } from '@/components/game/WalletAnimation';
import { TimerEdgePulse } from '@/components/game/Timer';
import { Loader2, Volume2, VolumeX, Wallet, Trophy } from 'lucide-react';

const POLL_INTERVAL = 400;

export default function PlayerGame() {
  const [gameCode, setGameCode] = useState('');
  const [playerToken, setPlayerToken] = useState('');
  const [game, setGame] = useState(null);
  const [player, setPlayer] = useState(null);
  const [currentRound, setCurrentRound] = useState(null);
  const [myGuess, setMyGuess] = useState(null);
  const [guessValue, setGuessValue] = useState(5);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showWalletAnimation, setShowWalletAnimation] = useState(null);
  const [lastBalance, setLastBalance] = useState(null);
  const [roundResult, setRoundResult] = useState(null);
  const [hasSeenStartAnimation, setHasSeenStartAnimation] = useState(false);
  const pollRef = useRef(null);
  const wakeLockRef = useRef(null);
  
  // Wake Lock to prevent screen timeout
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.log('Wake Lock not supported or denied');
      }
    };
    
    requestWakeLock();
    
    // Re-acquire on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    });
    
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, []);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const token = urlParams.get('token');
    
    if (code && token) {
      setGameCode(code);
      setPlayerToken(token);
    }
  }, []);
  
  const fetchData = useCallback(async () => {
    if (!gameCode || !playerToken) return;
    
    try {
      const games = await base44.entities.Game.filter({ code: gameCode });
      if (games.length === 0) return;
      
      const gameData = games[0];
      const prevGame = game;
      setGame(gameData);
      
      // Get player data
      const players = await base44.entities.Player.filter({ game_id: gameData.id });
      const myPlayer = players.find(p => p.session_token === playerToken);
      
      if (myPlayer) {
        // Update connection status
        await base44.entities.Player.update(myPlayer.id, {
          connection_status: 'connected',
          last_seen_at: new Date().toISOString()
        });
        
        // Check for game start (first time getting $20)
        if (!hasSeenStartAnimation && gameData.status === 'in_progress' && myPlayer.balance === 20 && lastBalance === null) {
          setShowWalletAnimation({ amount: 20, type: 'deposit' });
          setHasSeenStartAnimation(true);
        }
        
        // Track balance changes
        if (lastBalance !== null && myPlayer.balance !== lastBalance) {
          const diff = myPlayer.balance - lastBalance;
          if (diff !== 0 && !showWalletAnimation) {
            // Small inline animation for balance changes after initial
            setRoundResult({
              delta: diff,
              newBalance: myPlayer.balance
            });
          }
        }
        
        setLastBalance(myPlayer.balance);
        setPlayer(myPlayer);
      }
      
      // Get current round
      if (gameData.current_round_index > 0) {
        const rounds = await base44.entities.Round.filter({ game_id: gameData.id });
        const current = rounds.find(r => r.index === gameData.current_round_index);
        setCurrentRound(current);
        
        // Reset guess value when new round starts
        if (current && (!currentRound || currentRound.id !== current.id)) {
          const mid = Math.floor((current.min_guess + current.max_guess) / 2);
          setGuessValue(mid);
          setMyGuess(null);
          setRoundResult(null);
        }
        
        // Get my guess for current round
        if (current && myPlayer) {
          const guesses = await base44.entities.Guess.filter({ 
            round_id: current.id, 
            player_id: myPlayer.id 
          });
          if (guesses.length > 0) {
            setMyGuess(guesses[0]);
            setGuessValue(guesses[0].value);
          }
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
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }, [gameCode, playerToken, game, currentRound, lastBalance, hasSeenStartAnimation, showWalletAnimation]);
  
  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchData, POLL_INTERVAL);
    
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchData]);
  
  const handleSubmitGuess = async () => {
    if (!player || !currentRound || submitting) return;
    
    setSubmitting(true);
    
    try {
      if (myGuess) {
        // Update existing guess
        await base44.entities.Guess.update(myGuess.id, {
          value: guessValue,
          submitted_at: new Date().toISOString(),
          revision: (myGuess.revision || 1) + 1
        });
      } else {
        // Create new guess
        await base44.entities.Guess.create({
          game_id: game.id,
          round_id: currentRound.id,
          player_id: player.id,
          value: guessValue,
          submitted_at: new Date().toISOString(),
          revision: 1,
          is_final: false
        });
      }
      
      await fetchData();
    } catch (err) {
      console.error('Error submitting guess:', err);
    }
    
    setSubmitting(false);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-red-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }
  
  const isGuessing = game?.current_phase === 'guessing';
  const isListening = game?.current_phase === 'listening';
  const hasSubmitted = !!myGuess;
  const canEdit = isGuessing && (timeRemaining === null || timeRemaining > 0 || !hasSubmitted);
  const showUrgentPrompt = isGuessing && timeRemaining === 0 && !hasSubmitted;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-red-900 relative overflow-hidden">
      <SnowfallBackground intensity={20} />
      
      {/* Timer edge pulse */}
      <TimerEdgePulse seconds={timeRemaining} hasSubmitted={hasSubmitted} />
      
      {/* Wallet animation overlay */}
      <AnimatePresence>
        {showWalletAnimation && (
          <WalletAnimation
            amount={showWalletAnimation.amount}
            type={showWalletAnimation.type}
            onComplete={() => setShowWalletAnimation(null)}
          />
        )}
      </AnimatePresence>
      
      {/* Header */}
      <div className="relative z-10 p-4 flex justify-between items-center">
        {player && (
          <div className="flex items-center gap-3">
            <PlayerAvatar player={player} size="sm" showName={false} />
            <div>
              <div className="text-white font-bold">{player.name}</div>
              <div className={`font-mono font-bold ${player.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                <Wallet className="w-4 h-4 inline mr-1" />
                ${player.balance}
              </div>
            </div>
          </div>
        )}
        
        {game && (
          <div className="text-right">
            <div className="text-white/70 text-sm">Round</div>
            <div className="text-2xl font-bold text-yellow-300">
              {game.current_round_index} / {game.total_rounds}
            </div>
          </div>
        )}
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        {/* Waiting State */}
        {game?.status === 'lobby' && (
          <ChristmasCard className="text-center max-w-sm">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              🎄
            </motion.div>
            <h2 className="text-2xl font-bold">
              <GlowText>Waiting for Game to Start...</GlowText>
            </h2>
            <p className="text-white/70 mt-4">
              The GameMaster will start the game soon!
            </p>
          </ChristmasCard>
        )}
        
        {/* Listening State */}
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <ChristmasCard className="max-w-sm opacity-70">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-8xl mb-6"
              >
                👂
              </motion.div>
              <h2 className="text-3xl font-black">
                <GlowText>LISTENING...</GlowText>
              </h2>
              <p className="text-white/70 mt-4 text-lg">
                Pay attention to the host describing the item!
              </p>
              
              {currentRound && (
                <div className="mt-6 p-4 bg-black/30 rounded-xl">
                  <div className="text-xl font-bold text-yellow-300">
                    {currentRound.item_name}
                  </div>
                  {currentRound.show_hint_to_players && currentRound.hint_text && (
                    <div className="text-white/60 mt-2">
                      💡 {currentRound.hint_text}
                    </div>
                  )}
                </div>
              )}
            </ChristmasCard>
          </motion.div>
        )}
        
        {/* Guessing State */}
        {isGuessing && currentRound && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm"
          >
            {/* Item info */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                {currentRound.item_name}
              </h2>
              {currentRound.show_photo_to_players && currentRound.item_photo_url && (
                <div className="w-32 h-32 mx-auto rounded-xl overflow-hidden border-4 border-yellow-400 mb-4">
                  <img 
                    src={currentRound.item_photo_url} 
                    alt={currentRound.item_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {currentRound.show_hint_to_players && currentRound.hint_text && (
                <p className="text-white/70">💡 {currentRound.hint_text}</p>
              )}
            </div>
            
            {/* Timer */}
            {timeRemaining !== null && (
              <motion.div
                key={timeRemaining}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className={`
                  text-center text-5xl font-black mb-6
                  ${timeRemaining <= 3 ? 'text-red-400' : timeRemaining <= 6 ? 'text-yellow-400' : 'text-green-400'}
                `}
              >
                {timeRemaining}s
              </motion.div>
            )}
            
            {/* Urgent prompt */}
            {showUrgentPrompt && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6"
              >
                <div className="bg-red-600 rounded-2xl p-8 text-center border-4 border-red-400">
                  <div className="text-6xl mb-4">⏰</div>
                  <h2 className="text-3xl font-black text-white mb-4">TIME'S UP!</h2>
                  <p className="text-white/90 text-xl mb-6">Submit your final guess now!</p>
                  <PriceInput
                    value={guessValue}
                    onChange={setGuessValue}
                    onSubmit={handleSubmitGuess}
                    min={currentRound.min_guess}
                    max={currentRound.max_guess}
                    submitted={hasSubmitted}
                  />
                </div>
              </motion.div>
            )}
            
            {/* Price Input */}
            {!showUrgentPrompt && (
              <PriceInput
                value={guessValue}
                onChange={setGuessValue}
                onSubmit={handleSubmitGuess}
                min={currentRound.min_guess}
                max={currentRound.max_guess}
                disabled={!canEdit || submitting}
                submitted={hasSubmitted}
                canResubmit={canEdit}
              />
            )}
          </motion.div>
        )}
        
        {/* Closed/Revealing State */}
        {(game?.current_phase === 'closed' || game?.current_phase === 'revealing') && myGuess && (
          <ChristmasCard className="text-center max-w-sm">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-white mb-4">Guess Locked!</h2>
            <div className="text-5xl font-black text-yellow-300 font-mono">
              ${myGuess.value}
            </div>
            <p className="text-white/70 mt-4">Waiting for the reveal...</p>
          </ChristmasCard>
        )}
        
        {/* Results State */}
        {game?.current_phase === 'results' && currentRound && (
          <ChristmasCard className="text-center max-w-sm">
            <h2 className="text-xl font-bold text-white mb-2">Actual Price:</h2>
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring' }}
              className="text-6xl font-black text-yellow-300 font-mono mb-6"
            >
              ${currentRound.actual_price}
            </motion.div>
            
            {myGuess && (
              <div className="space-y-4">
                <div className="text-white/70">
                  Your guess: <span className="font-bold text-white">${myGuess.value}</span>
                </div>
                
                {roundResult && (
                  <MiniWalletChange amount={roundResult.delta} />
                )}
                
                {myGuess.value === currentRound.actual_price && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-4xl"
                  >
                    🎯 EXACT! 🎉
                  </motion.div>
                )}
              </div>
            )}
          </ChristmasCard>
        )}
        
        {/* Break State */}
        {game?.current_phase === 'break' && (
          <ChristmasCard className="text-center max-w-sm">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              🎁
            </motion.div>
            <h2 className="text-2xl font-bold">
              <GlowText>BREAK TIME!</GlowText>
            </h2>
            <p className="text-white/70 mt-4">
              Check the main screen for what's happening!
            </p>
            
            <div className="mt-6 p-4 bg-black/30 rounded-xl">
              <div className="text-white/70 text-sm">Your Balance</div>
              <div className={`text-4xl font-black font-mono ${player?.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${player?.balance}
              </div>
            </div>
          </ChristmasCard>
        )}
      </div>
      
      {/* Wake Lock hint */}
      {!wakeLockRef.current && (
        <div className="absolute bottom-4 left-0 right-0 text-center text-white/50 text-sm">
          💡 Keep this screen open during the game
        </div>
      )}
    </div>
  );
}