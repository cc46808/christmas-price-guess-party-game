import React from 'react';
import { motion } from 'framer-motion';
import { getAvatar } from './avatars';
import { Wifi, WifiOff } from 'lucide-react';

export default function PlayerAvatar({ 
  player, 
  size = 'md', 
  showName = true, 
  showBalance = false,
  showStatus = false,
  onClick,
  disabled = false,
  selected = false,
  highlight = false
}) {
  const avatar = getAvatar(player.avatar_id);
  
  const sizes = {
    sm: { container: 'w-16 h-16', emoji: 'text-3xl', name: 'text-xs' },
    md: { container: 'w-24 h-24', emoji: 'text-5xl', name: 'text-sm' },
    lg: { container: 'w-32 h-32', emoji: 'text-7xl', name: 'text-base' },
    xl: { container: 'w-40 h-40', emoji: 'text-8xl', name: 'text-lg' }
  };
  
  const s = sizes[size];
  
  return (
    <motion.div
      className={`
        flex flex-col items-center gap-2
        ${onClick && !disabled ? 'cursor-pointer' : ''}
        ${disabled ? 'opacity-40' : ''}
        ${selected ? 'ring-4 ring-yellow-400 ring-offset-2 rounded-xl' : ''}
      `}
      onClick={!disabled && onClick ? onClick : undefined}
      whileHover={onClick && !disabled ? { scale: 1.05 } : {}}
      whileTap={onClick && !disabled ? { scale: 0.95 } : {}}
    >
      <div className={`
        ${s.container}
        ${avatar.bg}
        rounded-2xl
        flex items-center justify-center
        shadow-lg
        border-4 border-white/30
        relative
        ${highlight ? 'ring-4 ring-yellow-400 animate-pulse' : ''}
      `}>
        <span className={s.emoji}>{avatar.emoji}</span>
        
        {/* Connection status indicator */}
        {showStatus && (
          <div className={`
            absolute -top-1 -right-1
            w-6 h-6 rounded-full
            flex items-center justify-center
            ${player.connection_status === 'connected' ? 'bg-green-500' : 'bg-red-500'}
            border-2 border-white
          `}>
            {player.connection_status === 'connected' ? (
              <Wifi className="w-3 h-3 text-white" />
            ) : (
              <WifiOff className="w-3 h-3 text-white" />
            )}
          </div>
        )}
      </div>
      
      {showName && (
        <span className={`${s.name} font-bold text-white drop-shadow-md text-center truncate max-w-full`}>
          {player.name}
        </span>
      )}
      
      {showBalance && (
        <motion.span 
          className={`
            ${s.name} font-mono font-bold
            ${player.balance >= 0 ? 'text-green-400' : 'text-red-400'}
            drop-shadow-md
          `}
          key={player.balance}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
        >
          ${player.balance}
        </motion.span>
      )}
    </motion.div>
  );
}