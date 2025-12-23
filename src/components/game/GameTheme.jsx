import React from 'react';
import { motion } from 'framer-motion';

// Vegas game-show with Christmas sparkle
export const THEME = {
  primary: '#ff2e63', // neon red
  secondary: '#0f3b33', // casino green
  emerald: '#0d5c63',
  gold: '#ffd166',
  champagne: '#fff4d6',
  teal: '#00d1c1',
  magenta: '#ff3fa4',
  dark: '#0b1c2c'
};

export function SnowfallBackground({ intensity = 50 }) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(intensity)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-white text-opacity-70"
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
            fontSize: 8 + Math.random() * 12,
            color: Math.random() > 0.7 ? THEME.gold : '#f8fbff'
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
    gold: 'shadow-[0_0_28px_rgba(255,209,102,0.55)]',
    red: 'shadow-[0_0_28px_rgba(255,46,99,0.45)]',
    green: 'shadow-[0_0_28px_rgba(13,92,99,0.45)]'
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
        bg-gradient-to-br from-yellow-200 via-yellow-400 to-amber-500
        text-slate-900 font-black rounded-xl
        border-[6px] border-amber-600
        shadow-[0_0_30px_rgba(255,209,102,0.5)] transform
        font-mono tracking-tight
        relative overflow-hidden
      `}
    >
      ${value}
    </Component>
  );
}

export function ChristmasCard({ children, className = '' }) {
  return (
    <div className={`
      bg-gradient-to-br from-[#0b1c2c] via-[#0f3b33] to-[#0b1c2c]
      border-4 border-amber-400
      rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.45)]
      p-6
      relative overflow-hidden
      before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_10%_20%,rgba(255,209,102,0.12),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(255,63,164,0.08),transparent_25%)] before:opacity-90
      after:content-[''] after:absolute after:inset-[10px] after:border-[6px] after:border-dotted after:border-amber-200 after:rounded-2xl after:opacity-70
      ${className}
    `}>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export function GlowText({ children, className = '' }) {
  return (
    <span className={`
      text-amber-200
      drop-shadow-[0_0_14px_rgba(255,209,102,0.9)]
      font-bold tracking-wide uppercase
      font-['Bebas_Neue','Archivo',sans-serif]
      ${className}
    `}>
      {children}
    </span>
  );
}

export function ConfettiExplosion({ active }) {
  if (!active) return null;
  
  const confettiColors = ['#ff2e63', '#0f3b33', '#ffd166', '#00d1c1', '#ff3fa4', '#fff4d6'];
  
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

export function MarqueeBorder({ position = 'top', bulbs = 48 }) {
  const posClass = position === 'bottom' ? 'bottom-0' : 'top-0';
  return (
    <div className={`pointer-events-none absolute ${posClass} left-0 right-0 h-12 flex items-center justify-center z-10`}
      style={{
        background: 'linear-gradient(90deg, rgba(255,209,102,0.08), rgba(255,63,164,0.06), rgba(0,209,193,0.06))'
      }}
    >
      <div className="flex gap-2">
        {[...Array(bulbs)].map((_, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full shadow-[0_0_12px_rgba(0,0,0,0.6)]"
            style={{
              backgroundColor: ['#ffd166', '#ff2e63', '#00d1c1', '#fff4d6'][i % 4],
              opacity: 0.75 + (i % 3) * 0.08,
              animation: 'pulse 2s ease-in-out infinite',
              animationDelay: `${i * 40}ms`
            }}
          />
        ))}
      </div>
    </div>
  );
}