import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Timer({ 
  seconds, 
  size = 'md', 
  showLabel = true,
  onTick,
  playSound = false 
}) {
  const [displaySeconds, setDisplaySeconds] = useState(seconds);
  
  useEffect(() => {
    setDisplaySeconds(seconds);
    if (onTick) onTick(seconds);
  }, [seconds, onTick]);
  
  const sizes = {
    sm: 'text-4xl w-20 h-20',
    md: 'text-6xl w-32 h-32',
    lg: 'text-8xl w-48 h-48',
    xl: 'text-9xl w-64 h-64'
  };
  
  const getColor = () => {
    if (displaySeconds <= 3) return 'from-red-500 to-red-700';
    if (displaySeconds <= 6) return 'from-yellow-500 to-orange-600';
    return 'from-green-500 to-green-700';
  };
  
  const getGlow = () => {
    if (displaySeconds <= 3) return 'shadow-[0_0_60px_rgba(239,68,68,0.8)]';
    if (displaySeconds <= 6) return 'shadow-[0_0_60px_rgba(234,179,8,0.6)]';
    return 'shadow-[0_0_40px_rgba(34,197,94,0.5)]';
  };
  
  return (
    <div className="flex flex-col items-center gap-2">
      {showLabel && (
        <span className="text-white/70 text-lg font-medium uppercase tracking-wider">
          Time Remaining
        </span>
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={displaySeconds}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={`
            ${sizes[size]}
            bg-gradient-to-br ${getColor()}
            ${getGlow()}
            rounded-full
            flex items-center justify-center
            font-black text-white
            border-4 border-white/30
            font-mono
          `}
        >
          {displaySeconds}
        </motion.div>
      </AnimatePresence>
      
      {/* Progress ring */}
      <svg className="hidden absolute" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
        <circle
          cx="50%"
          cy="50%"
          r="48%"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="4"
        />
        <motion.circle
          cx="50%"
          cy="50%"
          r="48%"
          fill="none"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 1 }}
          animate={{ pathLength: displaySeconds / 10 }}
          transition={{ duration: 0.3 }}
        />
      </svg>
    </div>
  );
}

export function TimerEdgePulse({ seconds, hasSubmitted }) {
  if (hasSubmitted || seconds === null || seconds > 6) return null;
  
  const color = seconds <= 3 ? 'red' : 'yellow';
  
  return (
    <motion.div
      className={`
        fixed inset-0 pointer-events-none z-40
        border-[12px] rounded-lg
        ${color === 'red' ? 'border-red-500' : 'border-yellow-500'}
      `}
      animate={{
        opacity: [0.3, 0.8, 0.3],
        scale: [1, 1.01, 1]
      }}
      transition={{
        duration: color === 'red' ? 0.5 : 0.8,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
      style={{
        boxShadow: `inset 0 0 60px ${color === 'red' ? 'rgba(239,68,68,0.5)' : 'rgba(234,179,8,0.4)'}`
      }}
    />
  );
}