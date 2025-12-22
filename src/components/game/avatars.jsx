// Christmas-themed cartoon avatar library (24 avatars)
export const AVATARS = [
  { id: 'santa', emoji: '🎅', name: 'Santa', bg: 'bg-red-500' },
  { id: 'mrs-claus', emoji: '🤶', name: 'Mrs. Claus', bg: 'bg-pink-500' },
  { id: 'snowman', emoji: '⛄', name: 'Snowman', bg: 'bg-blue-300' },
  { id: 'reindeer', emoji: '🦌', name: 'Reindeer', bg: 'bg-amber-700' },
  { id: 'elf', emoji: '🧝', name: 'Elf', bg: 'bg-green-500' },
  { id: 'tree', emoji: '🎄', name: 'Christmas Tree', bg: 'bg-green-600' },
  { id: 'star', emoji: '⭐', name: 'Star', bg: 'bg-yellow-400' },
  { id: 'angel', emoji: '👼', name: 'Angel', bg: 'bg-white' },
  { id: 'gingerbread', emoji: '🍪', name: 'Gingerbread', bg: 'bg-orange-400' },
  { id: 'candy', emoji: '🍬', name: 'Candy', bg: 'bg-red-400' },
  { id: 'gift', emoji: '🎁', name: 'Gift', bg: 'bg-purple-500' },
  { id: 'bell', emoji: '🔔', name: 'Bell', bg: 'bg-yellow-500' },
  { id: 'snowflake', emoji: '❄️', name: 'Snowflake', bg: 'bg-cyan-400' },
  { id: 'mittens', emoji: '🧤', name: 'Mittens', bg: 'bg-red-600' },
  { id: 'penguin', emoji: '🐧', name: 'Penguin', bg: 'bg-gray-700' },
  { id: 'polar-bear', emoji: '🐻‍❄️', name: 'Polar Bear', bg: 'bg-slate-200' },
  { id: 'cocoa', emoji: '☕', name: 'Hot Cocoa', bg: 'bg-amber-600' },
  { id: 'stocking', emoji: '🧦', name: 'Stocking', bg: 'bg-red-500' },
  { id: 'wreath', emoji: '🎀', name: 'Wreath', bg: 'bg-green-700' },
  { id: 'candle', emoji: '🕯️', name: 'Candle', bg: 'bg-orange-300' },
  { id: 'sleigh', emoji: '🛷', name: 'Sleigh', bg: 'bg-red-700' },
  { id: 'moon', emoji: '🌙', name: 'Moon', bg: 'bg-indigo-600' },
  { id: 'comet', emoji: '☄️', name: 'Comet', bg: 'bg-orange-500' },
  { id: 'sparkle', emoji: '✨', name: 'Sparkle', bg: 'bg-violet-500' }
];

export const getAvatar = (id) => {
  return AVATARS.find(a => a.id === id) || AVATARS[0];
};

export const generateGameCode = () => {
  const words = ['SNOW', 'BELL', 'TREE', 'GIFT', 'STAR', 'JOLLY', 'MERRY', 'CANDY', 'FROST', 'HOLLY'];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${word}${num}`;
};

export const generateSessionToken = () => {
  return 'player_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
};