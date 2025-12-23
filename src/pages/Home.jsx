import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Users, Monitor, Settings, Gift, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlowText, MarqueeBorder } from '@/components/game/GameTheme';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1c2c] via-[#0f3b33] to-[#0b1c2c] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <MarqueeBorder position="top" />
      <MarqueeBorder position="bottom" />
      
      {/* Decorative holly */}
      <div className="absolute top-4 left-4 text-6xl">🎄</div>
      <div className="absolute top-4 right-4 text-6xl">🎄</div>
      
      {/* Main content */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className="relative z-10 text-center max-w-2xl"
      >
        {/* Title */}
        <motion.div
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          className="mb-8"
        >
          <h1 className="text-5xl md:text-7xl font-black mb-4">
            <GlowText className="text-6xl md:text-8xl">🎅 THE PRICE IS</GlowText>
          </h1>
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [-2, 2, -2]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <h2 className="text-6xl md:text-8xl font-black text-white drop-shadow-[0_0_30px_rgba(255,215,0,0.8)]">
              CHRISTMAS! 🎄
            </h2>
          </motion.div>
        </motion.div>
        
        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl md:text-2xl text-white/80 mb-12"
        >
          A festive family price guessing game!
        </motion.p>
        
        {/* Action buttons */}
        <div className="grid gap-4 max-w-md mx-auto">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link to={createPageUrl('JoinGame')}>
              <Button
                size="lg"
                className="w-full h-20 text-2xl font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-4 border-green-400 shadow-xl"
              >
                <Users className="w-8 h-8 mr-3" />
                Join Game
              </Button>
            </Link>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link to={createPageUrl('MainScreen')}>
              <Button
                size="lg"
                variant="outline"
                className="w-full h-16 text-xl font-bold bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 border-4 border-blue-400 text-white"
              >
                <Monitor className="w-7 h-7 mr-3" />
                Main Screen (TV)
              </Button>
            </Link>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link to={createPageUrl('GameMaster')}>
              <Button
                size="lg"
                variant="outline"
                className="w-full h-16 text-xl font-bold bg-gradient-to-r from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 border-4 border-purple-400 text-white"
              >
                <Settings className="w-7 h-7 mr-3" />
                GameMaster Control
              </Button>
            </Link>
          </motion.div>
        </div>
        
        {/* Decorative elements */}
        <motion.div
          className="flex justify-center gap-4 mt-12 text-4xl"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span>🎁</span>
          <span>⭐</span>
          <span>🔔</span>
          <span>❄️</span>
          <span>🎁</span>
        </motion.div>
      </motion.div>
      
      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white/10 to-transparent" />
    </div>
  );
}