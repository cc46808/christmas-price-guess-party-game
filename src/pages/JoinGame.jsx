import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { entities } from '@/api/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChristmasCard, GlowText, MarqueeBorder } from '@/components/game/GameTheme';
import { ArrowLeft, LogIn, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function JoinGame() {
  const [gameCode, setGameCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // Check URL for code parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      setGameCode(code.toUpperCase());
    }
  }, []);
  
  const handleJoin = async () => {
    if (!gameCode.trim()) {
      setError('Please enter a game code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Check if game exists
      const games = await entities.Game.filter({ code: gameCode.toUpperCase() });
      
      if (games.length === 0) {
        setError('Game not found. Check the code and try again.');
        setLoading(false);
        return;
      }
      
      // Navigate to player select screen
      navigate(createPageUrl('PlayerSelect') + `?code=${gameCode.toUpperCase()}`);
    } catch (err) {
      setError('Failed to join game. Please try again.');
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1c2c] via-[#0f3b33] to-[#0b1c2c] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <MarqueeBorder position="top" />
      <MarqueeBorder position="bottom" />
      
      {/* Back button */}
      <Link 
        to={createPageUrl('Home')}
        className="absolute top-4 left-4 z-20"
      >
        <Button variant="ghost" className="text-white hover:bg-white/10">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>
      </Link>
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-full max-w-md"
      >
        <ChristmasCard>
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              🎮
            </motion.div>
            <h1 className="text-3xl font-black">
              <GlowText>JOIN GAME</GlowText>
            </h1>
            <p className="text-white/70 mt-2">Enter the game code shown on the main screen</p>
          </div>
          
          <div className="space-y-4">
            <Input
              value={gameCode}
              onChange={(e) => {
                setGameCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="GAME CODE"
              className="h-16 text-3xl text-center font-mono font-bold tracking-widest bg-white/90 border-4 border-yellow-400 rounded-xl"
              maxLength={10}
            />
            
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-300 text-center font-medium"
              >
                {error}
              </motion.p>
            )}
            
            <Button
              onClick={handleJoin}
              disabled={loading || !gameCode.trim()}
              className="w-full h-16 text-xl font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-4 border-green-400"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-6 h-6 mr-2" />
                  Join Game
                </>
              )}
            </Button>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-white/50 text-sm">
              Look for the game code on the big screen, or scan the QR code
            </p>
          </div>
        </ChristmasCard>
      </motion.div>
    </div>
  );
}