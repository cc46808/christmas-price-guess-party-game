import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlayerAvatar from './PlayerAvatar';
import { Trophy, Medal, Award } from 'lucide-react';

export default function Leaderboard({ 
  players, 
  size = 'md',
  showPodium = false,
  highlightTop = 0,
  title = 'Leaderboard'
}) {
  // Sort by balance descending
  const sorted = [...players].sort((a, b) => b.balance - a.balance);
  
  if (showPodium && sorted.length >= 3) {
    return <PodiumView players={sorted} highlightTop={highlightTop} />;
  }
  
  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 h-6 text-white/50 font-bold text-center">{rank}</span>;
  };
  
  const getRankBg = (rank, highlight) => {
    if (highlight) return 'bg-gradient-to-r from-yellow-500/30 to-yellow-600/30 border-yellow-400';
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500/20 to-transparent border-yellow-500/50';
    if (rank === 2) return 'bg-gradient-to-r from-gray-400/20 to-transparent border-gray-400/50';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600/20 to-transparent border-amber-600/50';
    return 'bg-white/5 border-white/10';
  };
  
  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-yellow-300 mb-4 text-center">{title}</h3>
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {sorted.map((player, index) => {
            const rank = index + 1;
            const shouldHighlight = highlightTop > 0 && rank <= highlightTop;
            
            return (
              <motion.div
                key={player.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: 'spring', damping: 20 }}
                className={`
                  flex items-center gap-4 p-3 rounded-xl
                  border-2 ${getRankBg(rank, shouldHighlight)}
                  ${shouldHighlight ? 'animate-pulse' : ''}
                `}
              >
                {/* Rank */}
                <div className="w-10 flex items-center justify-center">
                  {getRankIcon(rank)}
                </div>
                
                {/* Avatar */}
                <PlayerAvatar player={player} size="sm" showName={false} />
                
                {/* Name */}
                <div className="flex-1 font-bold text-white truncate">
                  {player.name}
                </div>
                
                {/* Balance */}
                <motion.div
                  key={player.balance}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className={`
                    font-mono font-black text-xl
                    ${player.balance >= 0 ? 'text-green-400' : 'text-red-400'}
                  `}
                >
                  ${player.balance}
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PodiumView({ players, highlightTop }) {
  const [first, second, third, ...rest] = players;
  
  const podiumOrder = [second, first, third].filter(Boolean);
  const heights = ['h-32', 'h-44', 'h-24'];
  const positions = ['2nd', '1st', '3rd'];
  const colors = [
    'from-gray-400 to-gray-500',
    'from-yellow-400 to-yellow-500',
    'from-amber-600 to-amber-700'
  ];
  
  return (
    <div className="w-full">
      {/* Podium */}
      <div className="flex items-end justify-center gap-4 mb-8">
        {podiumOrder.map((player, i) => {
          if (!player) return null;
          const actualRank = i === 1 ? 1 : i === 0 ? 2 : 3;
          const shouldHighlight = highlightTop > 0 && actualRank <= highlightTop;
          
          return (
            <motion.div
              key={player.id}
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.2, type: 'spring' }}
              className="flex flex-col items-center"
            >
              <PlayerAvatar 
                player={player} 
                size="lg" 
                showBalance 
                highlight={shouldHighlight}
              />
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                transition={{ delay: 0.5 + i * 0.2 }}
                className={`
                  ${heights[i]} w-28
                  bg-gradient-to-t ${colors[i]}
                  rounded-t-lg mt-2
                  flex items-center justify-center
                  shadow-lg border-t-4 border-white/30
                `}
              >
                <span className="text-4xl font-black text-white drop-shadow-lg">
                  {positions[i]}
                </span>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Rest of players */}
      {rest.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {rest.map((player, i) => {
            const rank = i + 4;
            const shouldHighlight = highlightTop > 0 && rank <= highlightTop;
            
            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                className={`
                  flex flex-col items-center p-4 rounded-xl
                  bg-white/10 border-2
                  ${shouldHighlight ? 'border-yellow-400 animate-pulse' : 'border-white/20'}
                `}
              >
                <span className="text-white/50 text-sm mb-2">#{rank}</span>
                <PlayerAvatar player={player} size="sm" showBalance />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}