import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { entities } from '@/api/database';
import { Button } from '@/components/ui/button';
import { SnowfallBackground, ChristmasCard, GlowText } from '@/components/game/GameTheme';
import PlayerAvatar from '@/components/game/PlayerAvatar';
import { AVATARS, generateSessionToken } from '@/components/game/avatars';
import { ArrowLeft, Check, Loader2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PlayerSelect() {
  const [gameCode, setGameCode] = useState('');
  const [game, setGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      setGameCode(code);
      loadGame(code);
    }
    
    // Check for existing session
    const existingToken = localStorage.getItem(`player_session_${code}`);
    if (existingToken) {
      // Auto-resume session
      checkExistingSession(code, existingToken);
    }
  }, []);
  
  const loadGame = async (code) => {
    try {
      const games = await entities.Game.filter({ code });
      if (games.length > 0) {
        setGame(games[0]);
        const playersData = await entities.Player.filter({ game_id: games[0].id });
        setPlayers(playersData.sort((a, b) => (a.order || 0) - (b.order || 0)));
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading game:', err);
      setLoading(false);
    }
  };
  
  const checkExistingSession = async (code, token) => {
    try {
      const games = await entities.Game.filter({ code });
      if (games.length > 0) {
        const playersData = await entities.Player.filter({ game_id: games[0].id });
        const existingPlayer = playersData.find(p => p.session_token === token);
        
        if (existingPlayer) {
          // Resume session
          await entities.Player.update(existingPlayer.id, {
            connection_status: 'connected',
            last_seen_at: new Date().toISOString()
          });
          navigate(createPageUrl('PlayerGame') + `?code=${code}&token=${token}`);
        }
      }
    } catch (err) {
      console.error('Error checking session:', err);
    }
  };
  
  const handleSelectPlayer = async (player) => {
    if (player.is_selected) return;
    
    setSelecting(true);
    setSelectedPlayer(player);
    
    try {
      const token = generateSessionToken();
      
      await entities.Player.update(player.id, {
        is_selected: true,
        session_token: token,
        connection_status: 'connected',
        last_seen_at: new Date().toISOString()
      });
      
      localStorage.setItem(`player_session_${gameCode}`, token);
      
      // Check if avatar change is allowed, show picker briefly
      if (!player.avatar_id || game?.allow_avatar_change_during_breaks !== false) {
        setShowAvatarPicker(true);
      } else {
        navigate(createPageUrl('PlayerGame') + `?code=${gameCode}&token=${token}`);
      }
    } catch (err) {
      console.error('Error selecting player:', err);
      setSelecting(false);
    }
  };
  
  const handleAvatarSelect = async (avatarId) => {
    try {
      const token = localStorage.getItem(`player_session_${gameCode}`);
      await entities.Player.update(selectedPlayer.id, {
        avatar_id: avatarId
      });
      navigate(createPageUrl('PlayerGame') + `?code=${gameCode}&token=${token}`);
    } catch (err) {
      console.error('Error updating avatar:', err);
    }
  };
  
  const handleRefresh = () => {
    setLoading(true);
    loadGame(gameCode);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-red-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }
  
  if (showAvatarPicker) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-red-900 p-6 relative overflow-hidden">
        <SnowfallBackground intensity={30} />
        
        <div className="relative z-10 max-w-2xl mx-auto">
          <ChristmasCard>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">
                <GlowText>Choose Your Avatar</GlowText>
              </h2>
              <p className="text-white/70 mt-2">{selectedPlayer?.name}</p>
            </div>
            
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
              {AVATARS.map((avatar) => (
                <motion.button
                  key={avatar.id}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleAvatarSelect(avatar.id)}
                  className={`
                    w-full aspect-square rounded-xl
                    ${avatar.bg}
                    flex items-center justify-center
                    text-3xl md:text-4xl
                    border-4 border-white/30
                    hover:border-yellow-400
                    transition-all
                  `}
                >
                  {avatar.emoji}
                </motion.button>
              ))}
            </div>
          </ChristmasCard>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-red-900 p-6 relative overflow-hidden">
      <SnowfallBackground intensity={30} />
      
      {/* Header */}
      <div className="relative z-10 flex justify-between items-center mb-6">
        <Link to={createPageUrl('JoinGame')}>
          <Button variant="ghost" className="text-white hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
        </Link>
        
        <Button 
          variant="ghost" 
          className="text-white hover:bg-white/10"
          onClick={handleRefresh}
        >
          <RefreshCw className="w-5 h-5" />
        </Button>
      </div>
      
      <div className="relative z-10 max-w-2xl mx-auto">
        <ChristmasCard>
          <div className="text-center mb-6">
            <h1 className="text-3xl font-black">
              <GlowText>WHO ARE YOU?</GlowText>
            </h1>
            <p className="text-white/70 mt-2">
              Game: <span className="font-mono font-bold text-yellow-300">{gameCode}</span>
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {players.map((player) => (
              <motion.div
                key={player.id}
                whileHover={!player.is_selected ? { scale: 1.02 } : {}}
                whileTap={!player.is_selected ? { scale: 0.98 } : {}}
              >
                <button
                  onClick={() => handleSelectPlayer(player)}
                  disabled={player.is_selected || selecting}
                  className={`
                    w-full p-4 rounded-xl
                    border-4 transition-all
                    ${player.is_selected 
                      ? 'bg-gray-800/50 border-gray-600 opacity-50 cursor-not-allowed' 
                      : 'bg-gradient-to-br from-green-600/30 to-green-700/30 border-green-500 hover:border-yellow-400'
                    }
                  `}
                >
                  <PlayerAvatar 
                    player={player} 
                    size="md"
                    disabled={player.is_selected}
                  />
                  {player.is_selected && (
                    <div className="mt-2 text-sm text-red-400 font-medium">
                      Already Taken
                    </div>
                  )}
                </button>
              </motion.div>
            ))}
          </div>
          
          {players.length === 0 && (
            <div className="text-center py-12 text-white/50">
              <p className="text-xl">No players available</p>
              <p className="mt-2">The GameMaster needs to add players first</p>
            </div>
          )}
        </ChristmasCard>
      </div>
    </div>
  );
}