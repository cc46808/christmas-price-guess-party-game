import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PriceInput({
  value,
  onChange,
  onSubmit,
  min = 1,
  max = 10,
  disabled = false,
  submitted = false,
  canResubmit = false
}) {
  const increment = () => {
    if (value < max) onChange(value + 1);
  };
  
  const decrement = () => {
    if (value > min) onChange(value - 1);
  };
  
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Value Display */}
      <motion.div
        key={value}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        className={`
          relative
          w-48 h-48
          bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500
          rounded-3xl
          flex items-center justify-center
          shadow-2xl
          border-4 border-yellow-600
          ${disabled ? 'opacity-50' : ''}
        `}
      >
        <span className="text-7xl font-black text-gray-900 font-mono">
          ${value}
        </span>
        
        {/* Range indicator */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium whitespace-nowrap">
          Range: ${min} - ${max}
        </div>
      </motion.div>
      
      {/* Stepper Controls */}
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={decrement}
          disabled={disabled || value <= min}
          className={`
            w-20 h-20
            rounded-full
            bg-gradient-to-br from-red-500 to-red-700
            text-white
            flex items-center justify-center
            shadow-lg
            border-4 border-red-400
            disabled:opacity-30 disabled:cursor-not-allowed
            active:shadow-inner
          `}
        >
          <Minus className="w-10 h-10" strokeWidth={4} />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={increment}
          disabled={disabled || value >= max}
          className={`
            w-20 h-20
            rounded-full
            bg-gradient-to-br from-green-500 to-green-700
            text-white
            flex items-center justify-center
            shadow-lg
            border-4 border-green-400
            disabled:opacity-30 disabled:cursor-not-allowed
            active:shadow-inner
          `}
        >
          <Plus className="w-10 h-10" strokeWidth={4} />
        </motion.button>
      </div>
      
      {/* Submit Button */}
      <motion.button
        whileHover={!disabled ? { scale: 1.02 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        onClick={onSubmit}
        disabled={disabled}
        className={`
          w-full max-w-xs
          py-5 px-8
          rounded-2xl
          font-black text-2xl uppercase tracking-wide
          flex items-center justify-center gap-3
          shadow-xl
          transition-all
          ${submitted
            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white border-4 border-green-400'
            : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 border-4 border-yellow-300'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <Lock className="w-7 h-7" />
        {submitted ? 'Locked In!' : 'Lock In Price'}
      </motion.button>
      
      {/* Resubmit hint */}
      {submitted && canResubmit && !disabled && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white/70 text-center text-sm"
        >
          Tap the button again to change your guess
        </motion.p>
      )}
    </div>
  );
}