import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

export default function WalletAnimation({ 
  amount, 
  type = 'deposit', // deposit, loss, bonus
  onComplete 
}) {
  const isPositive = type === 'deposit' || type === 'bonus';
  
  // Generate random positions for flying bills
  const billCount = Math.min(10, Math.abs(amount) / 10);
  const bills = Array.from({ length: Math.ceil(billCount) }, (_, i) => ({
    id: i,
    delay: i * 0.05,
    rotation: Math.random() * 360,
    x: (Math.random() - 0.5) * 200,
    y: isPositive ? -300 : 300
  }));
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      >
        {/* Flying bills */}
        {bills.map(bill => (
          <motion.div
            key={bill.id}
            initial={{ 
              x: '50vw',
              y: isPositive ? '-20vh' : '120vh',
              scale: 0,
              rotate: 0,
              opacity: 0
            }}
            animate={{
              x: `calc(50vw + ${bill.x}px)`,
              y: '50vh',
              scale: [0, 1, 0.8],
              rotate: bill.rotation,
              opacity: [0, 1, 0.8]
            }}
            transition={{
              delay: bill.delay,
              duration: 0.6,
              ease: 'easeOut'
            }}
            className="fixed text-6xl"
            style={{ zIndex: 40 }}
          >
            💵
          </motion.div>
        ))}
        
        <motion.div
          initial={{ scale: 0, y: -100 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0, y: 100 }}
          transition={{ type: 'spring', damping: 15 }}
          onAnimationComplete={() => {
            // Wait a bit to let users see the animation, then auto-close
            setTimeout(() => onComplete?.(), 2000);
          }}
          className="flex flex-col items-center gap-6"
        >
          {/* Money flying animation */}
          <motion.div
            className="relative"
            initial={{ y: -200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <motion.span
              className={`
                text-7xl font-black
                ${isPositive ? 'text-green-400' : 'text-red-400'}
                drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]
              `}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: 3 }}
            >
              {isPositive ? '+' : '-'}${Math.abs(amount)}
            </motion.span>
          </motion.div>
          
          {/* Wallet */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="relative"
          >
            <motion.div
              className="w-32 h-32 bg-gradient-to-br from-amber-600 to-amber-800 rounded-2xl flex items-center justify-center shadow-2xl border-4 border-amber-500"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, -5, 5, 0]
              }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <Wallet className="w-16 h-16 text-amber-200" />
            </motion.div>
            
            {/* Indicator arrow */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className={`
                absolute -top-8 left-1/2 -translate-x-1/2
                ${isPositive ? 'text-green-400' : 'text-red-400'}
              `}
            >
              {isPositive ? (
                <TrendingUp className="w-12 h-12" />
              ) : (
                <TrendingDown className="w-12 h-12" />
              )}
            </motion.div>
          </motion.div>
          
          {/* Label */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-white text-2xl font-bold text-center"
          >
            {type === 'deposit' && '💰 Starting Cash!'}
            {type === 'loss' && '😅 Better luck next time!'}
            {type === 'bonus' && '🎯 EXACT GUESS BONUS!'}
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function MiniWalletChange({ amount, onComplete }) {
  const isPositive = amount >= 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.5 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20 }}
      onAnimationComplete={onComplete}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-full
        ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}
        font-bold text-lg
      `}
    >
      {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
      {isPositive ? '+' : ''}{amount}
    </motion.div>
  );
}