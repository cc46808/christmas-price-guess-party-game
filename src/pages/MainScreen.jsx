import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SnowfallBackground, ChristmasCard, GlowText, PriceTag, ConfettiExplosion } from '@/components/game/GameTheme';
import PlayerAvatar from '@/components/game/PlayerAvatar';
import Timer from '@/components/game/Timer';
import Leaderboard from '@/components/game/Leaderboard';
import QRCode from '@/components/game/QRCode';
import BreakScreen from '@/components/game/BreakScreen';
import { soundManager } from '@/components/game/SoundManager';
import { Loader2, Volume2, Check, X } from 'lucide-react';

const POLL_INTERVAL = 400;

export default function MainScreen() {
  const [gameCode, setGameCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [game, setGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentRound, setCurrentRound] = useState(null);
  const [guesses, setGuesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastTimeRemaining, setLastTimeRemaining] = useState(null);
  const pollRef = useRef(null);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      setGameCode(code);
      setInputCode(code);
    }
  }, []);
  
  const enableAudio = async () => {
    await soundManager.init();
    setAudioEnabled(true);
  };
  
  const fetchData = useCallback(async () => {
    if (!gameCode) return;
    
    try {
      const games = await base44.entities.Game.filter({ code: gameCode });
      if (games.length === 0) return;
      
      const gameData = games[0];
      setGame(gameData);
      
      const playersData = await base44.entities.Player.filter({ game_id: gameData.id });
      setPlayers(playersData.sort((a, b) => (a.order || 0) - (b.order || 0)));
      
      if (gameData.current_round_index > 0) {
        const rounds = await base44.entities.Round.filter({ game_id: gameData.id });
        const current = rounds.find(r => r.index === gameData.current_round_index);
        setCurrentRound(current);
        
        if (current) {
          const guessesData = await base44.entities.Guess.filter({ round_id: current.id });
          setGuesses(guessesData);
        }
        
        // Calculate time remaining
        if (gameData.current_phase === 'guessing' && gameData.guessing_start_time) {
          const startTime = new Date(gameData.guessing_start_time).getTime();
          const duration = (gameData.guessing_duration_seconds || 10) * 1000;
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, Math.ceil((duration - elapsed) / 1000));
          
          // Play tick sound
          if (audioEnabled && remaining !== lastTimeRemaining && remaining <= 10 && remaining > 0) {
            soundManager.play('tick');
          }
          
          setLastTimeRemaining(remaining);
          setTimeRemaining(remaining);
        } else {
          setTimeRemaining(null);
        }
        
        // Check for confetti triggers (round 10 and 20 results)
        if ((gameData.current_round_index === 10 || gameData.current_round_index === 20) && 
            gameData.current_phase === 'break') {
          setShowConfetti(true);
          if (audioEnabled) soundManager.play('success');
          setTimeout(() => setShowConfetti(false), 5000);
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }, [gameCode, audioEnabled, lastTimeRemaining]);
  
  useEffect(() => {
    if (gameCode) {
      setLoading(true);
      fetchData();
      pollRef.current = setInterval(fetchData, POLL_INTERVAL);
    }
    
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [gameCode, fetchData]);
  
  const handleJoinCode = () => {
    if (inputCode.trim()) {
      setGameCode(inputCode.toUpperCase());
      window.history.replaceState(null, '', `?code=${inputCode.toUpperCase()}`);
    }
  };
  
  const joinUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${createPageUrl('JoinGame')}?code=${gameCode}` 
    : '';
  
  // Audio enable overlay
  if (!audioEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-red-900 flex items-center justify-center p-6">
        <SnowfallBackground intensity={40} />
        
        <ChristmasCard className="text-center max-w-md relative z-10">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-8xl mb-6"
          >
            🔔
          </motion.div>
          <h1 className="text-3xl font-black mb-4">
            <GlowText>MAIN SCREEN</GlowText>
          </h1>
          <p className="text-white/70 mb-8">
            Tap to enable sound effects for the full experience!
          </p>
          
          <div className="space-y-4">
            <Input
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="GAME CODE"
              className="h-14 text-2xl text-center font-mono font-bold bg-white/90 border-4 border-yellow-400 rounded-xl"
            />
            
            <Button
              onClick={() => {
                enableAudio();
                handleJoinCode();
              }}
              disabled={!inputCode.trim()}
              className="w-full h-16 text-xl font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-4 border-green-400"
            >
              <Volume2 className="w-6 h-6 mr-2" />
              Enable Audio & Start
            </Button>
          </div>
        </ChristmasCard>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-red-900 flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-white animate-spin" />
      </div>
    );
  }
  
  // Break screens
  if (game?.current_phase === 'break') {
    const breakType = 
      game.current_round_index === 5 ? 'mini-game' :
      game.current_round_index === 10 ? 'wheel-spin' :
      game.current_round_index === 15 ? 'lucky-seven' :
      game.current_round_index === 20 ? 'finale' : 'mini-game';
    
    return (
      <>
        <ConfettiExplosion active={showConfetti} />
        <BreakScreen 
          roundNumber={game.current_round_index}
          players={players}
          type={breakType}
        />
      </>
    );
  }
  
  // Lobby screen
  if (!game || game.status === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-red-900 p-8 relative">
        <SnowfallBackground intensity={50} />
        <ConfettiExplosion active={showConfetti} />
        
        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.h1
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-5xl md:text-7xl font-black mb-4"
            >
              <GlowText>🎄 THE PRICE IS CHRISTMAS! 🎅</GlowText>
            </motion.h1>
          </div>
          
          {/* Join section */}
          {game && (
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12">
              {/* QR Code */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                <QRCode value={joinUrl} size={200} />
              </motion.div>
              
              {/* Game Code */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="text-center"
              >
                <p className="text-white/70 text-xl mb-2">GAME CODE</p>
                <div className="text-6xl md:text-8xl font-black font-mono text-yellow-300 tracking-wider drop-shadow-[0_0_30px_rgba(255,215,0,0.5)]">
                  {gameCode}
                </div>
                <p className="text-white/50 mt-4">Scan QR or enter code on your phone</p>
              </motion.div>
            </div>
          )}
          
          {/* Players grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {players.map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <ChristmasCard className="text-center p-4">
                  <PlayerAvatar 
                    player={player} 
                    size="lg" 
                    showBalance={game?.status === 'in_progress'}
                    showStatus
                  />
                </ChristmasCard>
              </motion.div>
            ))}
          </div>
          
          {players.length === 0 && (
            <div className="text-center text-white/50 text-2xl py-12">
              Waiting for players to join...
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // In-game screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-red-900 p-6 relative">
      <SnowfallBackground intensity={30} />
      <ConfettiExplosion active={showConfetti} />
      
      <div className="relative z-10 max-w-7xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-white">
            <span className="text-xl opacity-70">Round</span>
            <span className="text-4xl font-black ml-2 text-yellow-300">
              {game.current_round_index} / {game.total_rounds}
            </span>
          </div>
          
          <div className="text-right">
            <span className="text-4xl font-black text-yellow-300">
              {gameCode}
            </span>
          </div>
        </div>
        
        <div className="flex-1 flex gap-6">
          {/* Left side - Item + Timer */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Item display */}
            {currentRound && (
              <ChristmasCard className="w-full max-w-lg text-center mb-6">
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                  {currentRound.item_name}
                </h2>
                
                {currentRound.item_photo_url && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-48 h-48 mx-auto rounded-xl overflow-hidden border-4 border-yellow-400 mb-4"
                  >
                    <img 
                      src={currentRound.item_photo_url} 
                      alt={currentRound.item_name}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                )}
                
                {currentRound.hint_text && (
                  <p className="text-xl text-white/70">
                    💡 {currentRound.hint_text}
                  </p>
                )}
              </ChristmasCard>
            )}
            
            {/* Timer */}
            {game.current_phase === 'guessing' && timeRemaining !== null && (
              <Timer seconds={timeRemaining} size="xl" playSound={audioEnabled} />
            )}
            
            {/* Listening state */}
            {game.current_phase === 'listening' && (
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-center"
              >
                <div className="text-8xl mb-4">👂</div>
                <div className="text-4xl font-black text-yellow-300">LISTENING...</div>
              </motion.div>
            )}
            
            {/* Reveal */}
            {(game.current_phase === 'revealing' || game.current_phase === 'results') && currentRound && (
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 10 }}
              >
                <PriceTag value={currentRound.actual_price} size="xl" animate />
              </motion.div>
            )}
          </div>
          
          {/* Right side - Players */}
          <div className="w-80 flex flex-col gap-3 overflow-y-auto">
            {players.map((player) => {
              const playerGuess = guesses.find(g => g.player_id === player.id);
              const hasSubmitted = !!playerGuess;
              
              // Calculate if this player is the closest winner
              let isClosest = false;
              let isExact = false;
              
              if (game.current_phase === 'results' && currentRound) {
                const diffs = players.map(p => {
                  const g = guesses.find(gg => gg.player_id === p.id);
                  return {
                    playerId: p.id,
                    diff: g ? Math.abs(g.value - currentRound.actual_price) : 999,
                    submittedAt: g?.submitted_at || '9999'
                  };
                });
                
                const minDiff = Math.min(...diffs.map(d => d.diff));
                const closestPlayers = diffs.filter(d => d.diff === minDiff);
                
                if (closestPlayers.length > 0) {
                  closestPlayers.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
                  isClosest = closestPlayers[0].playerId === player.id;
                }
                
                if (playerGuess && playerGuess.value === currentRound.actual_price) {
                  isExact = true;
                }
              }
              
              return (
                <motion.div
                  key={player.id}
                  layout
                  className={`
                    flex items-center gap-3 p-3 rounded-xl
                    ${isClosest ? 'bg-yellow-500/30 border-2 border-yellow-400' : 
                      isExact ? 'bg-green-500/30 border-2 border-green-400' :
                      'bg-white/10 border-2 border-transparent'}
                    ${player.connection_status === 'disconnected' ? 'opacity-50' : ''}
                  `}
                >
                  <PlayerAvatar player={player} size="sm" showName={false} />
                  
                  <div className="flex-1">
                    <div className="text-white font-bold truncate">{player.name}</div>
                    <div className={`font-mono font-bold text-lg ${player.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${player.balance}
                    </div>
                  </div>
                  
                  {/* Submission status */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center">
                    {hasSubmitted ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center"
                      >
                        <Check className="w-6 h-6 text-white" />
                      </motion.div>
                    ) : game.current_phase === 'guessing' ? (
                      <div className="w-10 h-10 rounded-full bg-gray-500/50 flex items-center justify-center">
                        <X className="w-6 h-6 text-white/50" />
                      </div>
                    ) : null}
                  </div>
                  
                  {/* Result indicators */}
                  {isClosest && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-2xl"
                    >
                      🏆
                    </motion.div>
                  )}
                  {isExact && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-2xl"
                    >
                      🎯
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}