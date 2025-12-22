import React from 'react';
import { motion } from 'framer-motion';

// Christmas + 70s Price Is Right theme colors
export const THEME = {
  primary: '#c41e3a', // Christmas red
  secondary: '#1a472a', // Christmas green
  gold: '#ffd700',
  bronze: '#cd7f32',
  cream: '#fffbeb',
  warmWhite: '#fef3c7',
  retro: {
    orange: '#ff6b35',
    yellow: '#f7c948',
    teal: '#00a896',
    purple: '#9b5de5'
  }
};

export function SnowfallBackground({ intensity = 50 }) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(intensity)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-white text-opacity-60"
          initial={{
            x: Math.random() * window.innerWidth,
            y: -20,
            rotate: 0
          }}
          animate={{
            y: window.innerHeight + 20,
            rotate: 360,
            x: `+=${Math.sin(i) * 100}`
          }}
          transition={{
            duration: 5 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'linear'
          }}
          style={{
            fontSize: 8 + Math.random() * 12
          }}
        >
          ❄
        </motion.div>
      ))}
    </div>
  );
}

export function RetroGlow({ children, color = 'gold' }) {
  const glowColors = {
    gold: 'shadow-[0_0_30px_rgba(255,215,0,0.5)]',
    red: 'shadow-[0_0_30px_rgba(196,30,58,0.5)]',
    green: 'shadow-[0_0_30px_rgba(26,71,42,0.5)]'
  };
  
  return (
    <div className={`${glowColors[color]} rounded-lg`}>
      {children}
    </div>
  );
}

export function PriceTag({ value, size = 'md', animate = false }) {
  const sizes = {
    sm: 'text-2xl px-4 py-2',
    md: 'text-4xl px-6 py-3',
    lg: 'text-6xl px-8 py-4',
    xl: 'text-8xl px-12 py-6'
  };
  
  const Component = animate ? motion.div : 'div';
  const props = animate ? {
    initial: { scale: 0, rotate: -10 },
    animate: { scale: 1, rotate: 0 },
    transition: { type: 'spring', damping: 10 }
  } : {};
  
  return (
    <Component
      {...props}
      className={`
        ${sizes[size]}
        bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500
        text-gray-900 font-black rounded-lg
        border-4 border-yellow-600
        shadow-lg transform
        font-mono tracking-tight
      `}
    >
      ${value}
    </Component>
  );
}

export function ChristmasCard({ children, className = '' }) {
  return (
    <div className={`
      bg-gradient-to-br from-red-800 via-red-700 to-red-900
      border-4 border-yellow-500
      rounded-2xl shadow-2xl
      p-6
      relative overflow-hidden
      ${className}
    `}>
      {/* Retro scanline effect */}
      <div className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export function GlowText({ children, className = '' }) {
  return (
    <span className={`
      text-yellow-300
      drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]
      font-bold
      ${className}
    `}>
      {children}
    </span>
  );
}

export function ConfettiExplosion({ active }) {
  if (!active) return null;
  
  const confettiColors = ['#c41e3a', '#1a472a', '#ffd700', '#ff6b35', '#9b5de5', '#00a896'];
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {[...Array(100)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            backgroundColor: confettiColors[i % confettiColors.length],
            left: '50%',
            top: '50%'
          }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{
            x: (Math.random() - 0.5) * window.innerWidth,
            y: (Math.random() - 0.5) * window.innerHeight + 500,
            rotate: Math.random() * 720,
            opacity: 0
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  );
}