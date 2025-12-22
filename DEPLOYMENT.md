# Christmas Price Guess Party Game

A fun multiplayer party game where players guess the prices of Christmas items!

## Migration to Supabase + Vercel Complete! 🎉

This project has been successfully migrated from base44 to Supabase and is ready for Vercel deployment.

## Setup Instructions

### 1. Database Setup (Supabase)

Your Supabase database schema is already configured. The tables include:
- `games` - Game sessions
- `players` - Player information
- `rounds` - Game rounds with items to guess
- `guesses` - Player guesses for each round
- `balance_events` - Player balance transaction history
- `game_event_logs` - Game event tracking

### 2. Environment Variables

The `.env` file has been created with your Supabase credentials:
```
VITE_SUPABASE_URL=https://antwnaviqmaqlqshkhmc.supabase.co
VITE_SUPABASE_ANON_KEY=your_key_here
```

**Important**: The `.env` file is already in `.gitignore` and will not be committed to Git.

### 3. Local Development

```bash
# Install dependencies (already done)
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### 4. Deploy to Vercel

#### Option A: Via Vercel CLI
```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Deploy
vercel
```

#### Option B: Via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the Vite framework
5. **Add Environment Variables**:
   - `VITE_SUPABASE_URL` = `https://antwnaviqmaqlqshkhmc.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your_anon_key`
6. Click "Deploy"

**Note**: The `vercel.json` configuration file has been created to handle client-side routing.

## What Changed?

### Removed
- ❌ `@base44/sdk` - Replaced with `@supabase/supabase-js`
- ❌ `@base44/vite-plugin` - No longer needed
- ❌ `src/api/base44Client.js` - Replaced with `supabaseClient.js`
- ❌ `src/lib/app-params.js` - base44-specific, no longer needed

### Added
- ✅ `@supabase/supabase-js` - Supabase client library
- ✅ `src/api/supabaseClient.js` - Supabase connection
- ✅ `src/api/database.js` - Database helper functions
- ✅ `.env` - Environment variables
- ✅ `.env.example` - Template for environment variables
- ✅ `vercel.json` - Vercel deployment configuration

### Updated
- 🔄 All page components (GameMaster, JoinGame, MainScreen, PlayerGame, PlayerSelect)
- 🔄 All game components (GMControlPanel, useGameState)
- 🔄 AuthContext - Now uses Supabase Auth
- 🔄 vite.config.js - Removed base44 plugin
- 🔄 package.json - Updated dependencies

## Database Migration Notes

Your existing data structure maps to Supabase as follows:

| base44 Field | Supabase Field | Notes |
|--------------|----------------|-------|
| `game_id` | `game_id` | UUID reference |
| `avatar_id` | `avatar` | Renamed for consistency |
| `index` | `round_number` | More descriptive name |
| `item_photo_url` | `item_image_url` | Renamed |
| `value` | `guess_amount` | More descriptive |
| `type` | `event_type` | More descriptive |
| `payload` | `metadata` | JSON field |

## Features

- 🎮 Multiplayer game master controls
- 👥 Multiple player support with avatars
- 🎯 Price guessing rounds
- 💰 Balance tracking and scoring
- 📊 Real-time leaderboard
- 🎄 Christmas-themed UI
- ❄️ Snowfall animations
- 🎵 Sound effects

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Animations**: Framer Motion

## Next Steps

1. ✅ Code migration complete
2. ✅ Dependencies installed
3. ⏳ Test locally: `npm run dev`
4. ⏳ Deploy to Vercel
5. ⏳ Test production deployment
6. ⏳ Optional: Set up Supabase Realtime for live updates

## Realtime Updates (Optional Enhancement)

Currently, the app uses polling for updates. To add true realtime updates with Supabase:

```javascript
// In your components
const channel = supabase
  .channel('game_changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'games' },
    (payload) => {
      // Handle game updates
    }
  )
  .subscribe();

// Cleanup
return () => supabase.removeChannel(channel);
```

## Support

For issues or questions:
- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- Vite Docs: https://vitejs.dev

---

🎄 Happy Holidays! Enjoy your game! 🎄
