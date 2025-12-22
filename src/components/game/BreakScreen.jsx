import React from 'react';
import { motion } from 'framer-motion';
import { ConfettiExplosion, ChristmasCard, GlowText } from './GameTheme';
import Leaderboard from './Leaderboard';
import { Gift, Trophy, Star, Sparkles } from 'lucide-react';

export default function BreakScreen({ 
  roundNumber, 
  players,
  type // 'mini-game' | 'wheel-spin' | 'lucky-seven' | 'finale'
}) {
  const getBreakContent = () => {
    switch (type) {
      case 'mini-game':
        return {
          icon: <Gift className="w-16 h-16 text-yellow-300" />,
          title: 'BREAK TIME!',
          subtitle: 'Time for a Mini-Game!',
          description: 'Get ready for some offline fun! GM can add bonus money to players.',
          showPodium: false,
          highlightTop: 0
        };
      case 'wheel-spin':
        return {
          icon: <Trophy className="w-16 h-16 text-yellow-300" />,
          title: 'WHEEL SPIN TIME!',
          subtitle: 'Top 4 Players Advance!',
          description: 'The top 4 players will compete in Wheel Spin #1!',
          showPodium: true,
          highlightTop: 4
        };
      case 'lucky-seven':
        return {
          icon: <Star className="w-16 h-16 text-yellow-300" />,
          title: 'LUCKY SEVEN!',
          subtitle: 'Bonus Round',
          description: 'Time for Lucky Seven! GM can add bonus money to players.',
          showPodium: false,
          highlightTop: 0
        };
      case 'finale':
        return {
          icon: <Sparkles className="w-16 h-16 text-yellow-300" />,
          title: '🎄 FINALE! 🎄',
          subtitle: 'Final Wheel Spin!',
          description: 'Top 4 compete in Wheel Spin #2! Winner plays Showcase Showdown against Wheel Spin #1 winner!',
          showPodium: true,
          highlightTop: 4
        };
      default:
        return {
          icon: <Gift className="w-16 h-16 text-yellow-300" />,
          title: 'BREAK TIME!',
          subtitle: 'Take a breather!',
          description: '',
          showPodium: false,
          highlightTop: 0
        };
    }
  };
  
  const content = getBreakContent();
  const showConfetti = type === 'wheel-spin' || type === 'finale';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-red-900 to-green-900 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <ConfettiExplosion active={showConfetti} />
      
      {/* Decorative lights */}
      <div className="absolute top-0 left-0 right-0 h-8 flex justify-between px-4">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className={`w-4 h-4 rounded-full ${['bg-red-500', 'bg-green-500', 'bg-yellow-400', 'bg-blue-500'][i % 4]}`}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, delay: i * 0.1, repeat: Infinity }}
          />
        ))}
      </div>
      
      <ChristmasCard className="max-w-4xl w-full">
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 10 }}
          className="flex flex-col items-center gap-6 py-8"
        >
          {/* Icon */}
          <motion.div
            animate={{ 
              rotate: [0, -10, 10, 0],
              y: [0, -10, 0]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {content.icon}
          </motion.div>
          
          {/* Title */}
          <motion.h1
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-black text-center"
          >
            <GlowText>{content.title}</GlowText>
          </motion.h1>
          
          {/* Round indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white/70 text-xl"
          >
            After Round {roundNumber}
          </motion.div>
          
          {/* Subtitle */}
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-bold text-white text-center"
          >
            {content.subtitle}
          </motion.h2>
          
          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-white/80 text-center max-w-lg"
          >
            {content.description}
          </motion.p>
        </motion.div>
        
        {/* Leaderboard */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Leaderboard 
            players={players} 
            showPodium={content.showPodium}
            highlightTop={content.highlightTop}
            title={content.showPodium ? "🏆 Current Standings 🏆" : "Standings"}
          />
        </motion.div>
      </ChristmasCard>
    </div>
  );
}