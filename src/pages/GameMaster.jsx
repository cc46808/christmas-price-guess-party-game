import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SnowfallBackground, ChristmasCard, GlowText } from '@/components/game/GameTheme';
import { generateGameCode } from '@/components/game/avatars';
import { 
  ArrowLeft, Plus, Trash2, Play, Settings, Users, 
  ListOrdered, Loader2, Lock, Save
} from 'lucide-react';

export default function GameMaster() {
  const [mode, setMode] = useState('select'); // select, create, authenticate, control
  const [gameCode, setGameCode] = useState('');
  const [gmPin, setGmPin] = useState('');
  const [inputPin, setInputPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Check URL for code
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      setGameCode(code);
      setMode('authenticate');
    }
  }, []);
  
  const handleCreateGame = () => {
    setGameCode(generateGameCode());
    setMode('create');
  };
  
  const handleJoinExisting = async () => {
    if (!gameCode.trim()) {
      setError('Please enter a game code');
      return;
    }
    
    setLoading(true);
    try {
      const games = await base44.entities.Game.filter({ code: gameCode.toUpperCase() });
      if (games.length === 0) {
        setError('Game not found');
        setLoading(false);
        return;
      }
      setGameCode(gameCode.toUpperCase());
      setMode('authenticate');
    } catch (err) {
      setError('Error finding game');
    }
    setLoading(false);
  };
  
  const handleAuthenticate = async () => {
    setLoading(true);
    try {
      const games = await base44.entities.Game.filter({ code: gameCode });
      if (games.length > 0 && games[0].gm_pin === inputPin) {
        setGmPin(inputPin);
        window.history.replaceState(null, '', `?code=${gameCode}`);
        setMode('control');
      } else {
        setError('Invalid PIN');
      }
    } catch (err) {
      setError('Error authenticating');
    }
    setLoading(false);
  };
  
  if (mode === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 p-6 relative">
        <SnowfallBackground intensity={30} />
        
        <Link to={createPageUrl('Home')} className="absolute top-4 left-4 z-20">
          <Button variant="ghost" className="text-white hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
        </Link>
        
        <div className="relative z-10 max-w-md mx-auto pt-20">
          <ChristmasCard>
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎮</div>
              <h1 className="text-3xl font-black">
                <GlowText>GAMEMASTER</GlowText>
              </h1>
            </div>
            
            <div className="space-y-4">
              <Button
                onClick={handleCreateGame}
                className="w-full h-16 text-xl font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-4 border-green-400"
              >
                <Plus className="w-6 h-6 mr-2" />
                Create New Game
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-red-800 text-white/50 text-sm">OR</span>
                </div>
              </div>
              
              <Input
                value={gameCode}
                onChange={(e) => {
                  setGameCode(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="ENTER GAME CODE"
                className="h-14 text-xl text-center font-mono font-bold bg-white/90 border-4 border-yellow-400 rounded-xl"
              />
              
              {error && <p className="text-red-300 text-center">{error}</p>}
              
              <Button
                onClick={handleJoinExisting}
                disabled={loading || !gameCode.trim()}
                variant="outline"
                className="w-full h-14 text-lg font-bold border-4 border-purple-400 text-white"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Join Existing Game'}
              </Button>
            </div>
          </ChristmasCard>
        </div>
      </div>
    );
  }
  
  if (mode === 'authenticate') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 p-6 relative">
        <SnowfallBackground intensity={30} />
        
        <div className="relative z-10 max-w-md mx-auto pt-20">
          <ChristmasCard>
            <div className="text-center mb-8">
              <Lock className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
              <h1 className="text-2xl font-black">
                <GlowText>ENTER GM PIN</GlowText>
              </h1>
              <p className="text-white/70 mt-2">Game: {gameCode}</p>
            </div>
            
            <div className="space-y-4">
              <Input
                type="password"
                value={inputPin}
                onChange={(e) => {
                  setInputPin(e.target.value);
                  setError('');
                }}
                placeholder="PIN"
                className="h-14 text-2xl text-center font-mono font-bold bg-white/90 border-4 border-yellow-400 rounded-xl"
                maxLength={6}
              />
              
              {error && <p className="text-red-300 text-center">{error}</p>}
              
              <Button
                onClick={handleAuthenticate}
                disabled={loading || !inputPin}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-500 to-purple-600 border-4 border-purple-400"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Authenticate'}
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => setMode('select')}
                className="w-full text-white/70"
              >
                Back
              </Button>
            </div>
          </ChristmasCard>
        </div>
      </div>
    );
  }
  
  if (mode === 'create') {
    return <GameSetup gameCode={gameCode} onComplete={() => setMode('select')} />;
  }
  
  return <GMControlPanel gameCode={gameCode} />;
}

function GameSetup({ gameCode, onComplete }) {
  const [pin, setPin] = useState('');
  const [totalRounds, setTotalRounds] = useState(20);
  const [exactBonus, setExactBonus] = useState(5);
  const [defaultMissingGuess, setDefaultMissingGuess] = useState(1);
  const [players, setPlayers] = useState([{ name: '', avatar_id: 'santa' }]);
  const [rounds, setRounds] = useState([]);
  const [activeTab, setActiveTab] = useState('settings');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const addPlayer = () => {
    if (players.length < 10) {
      setPlayers([...players, { name: '', avatar_id: 'gift' }]);
    }
  };
  
  const removePlayer = (index) => {
    setPlayers(players.filter((_, i) => i !== index));
  };
  
  const updatePlayer = (index, field, value) => {
    const updated = [...players];
    updated[index] = { ...updated[index], [field]: value };
    setPlayers(updated);
  };
  
  const addRound = () => {
    setRounds([...rounds, {
      item_name: '',
      item_photo_url: '',
      hint_text: '',
      min_guess: 1,
      max_guess: 10,
      actual_price: '',
      show_photo_to_players: true,
      show_hint_to_players: true
    }]);
  };
  
  const removeRound = (index) => {
    setRounds(rounds.filter((_, i) => i !== index));
  };
  
  const updateRound = (index, field, value) => {
    const updated = [...rounds];
    updated[index] = { ...updated[index], [field]: value };
    setRounds(updated);
  };
  
  const handleSave = async () => {
    // Validation
    if (!pin || pin.length < 4) {
      setError('PIN must be at least 4 characters');
      return;
    }
    
    const validPlayers = players.filter(p => p.name.trim());
    if (validPlayers.length < 2) {
      setError('Add at least 2 players');
      return;
    }
    
    const validRounds = rounds.filter(r => r.item_name.trim() && r.actual_price);
    if (validRounds.length < 1) {
      setError('Add at least 1 round with item name and price');
      return;
    }
    
    setSaving(true);
    setError('');
    
    try {
      // Create game
      const game = await base44.entities.Game.create({
        code: gameCode,
        gm_pin: pin,
        status: 'lobby',
        total_rounds: validRounds.length,
        exact_bonus_amount: exactBonus,
        default_missing_guess_value: defaultMissingGuess,
        current_round_index: 0,
        current_phase: 'waiting'
      });
      
      // Create players
      for (let i = 0; i < validPlayers.length; i++) {
        await base44.entities.Player.create({
          game_id: game.id,
          name: validPlayers[i].name,
          avatar_id: validPlayers[i].avatar_id,
          balance: 0,
          is_selected: false,
          connection_status: 'disconnected',
          order: i
        });
      }
      
      // Create rounds
      for (let i = 0; i < validRounds.length; i++) {
        await base44.entities.Round.create({
          game_id: game.id,
          index: i + 1,
          item_name: validRounds[i].item_name,
          item_photo_url: validRounds[i].item_photo_url,
          hint_text: validRounds[i].hint_text,
          min_guess: validRounds[i].min_guess || 1,
          max_guess: validRounds[i].max_guess || 10,
          actual_price: parseInt(validRounds[i].actual_price),
          show_photo_to_players: validRounds[i].show_photo_to_players,
          show_hint_to_players: validRounds[i].show_hint_to_players,
          status: 'pending'
        });
      }
      
      // Log event
      await base44.entities.GameEventLog.create({
        game_id: game.id,
        type: 'game_created',
        payload: { players: validPlayers.length, rounds: validRounds.length }
      });
      
      // Redirect to control panel
      window.location.href = createPageUrl('GameMaster') + `?code=${gameCode}`;
    } catch (err) {
      console.error('Error creating game:', err);
      setError('Failed to create game. Please try again.');
    }
    
    setSaving(false);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 p-6 relative">
      <SnowfallBackground intensity={20} />
      
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-black text-yellow-300">Create Game</h1>
            <p className="text-white/70">Code: <span className="font-mono font-bold text-white">{gameCode}</span></p>
          </div>
          
          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-12 px-6 text-lg font-bold bg-gradient-to-r from-green-500 to-green-600 border-4 border-green-400"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            Save & Create
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="settings" className="text-lg">
              <Settings className="w-5 h-5 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="players" className="text-lg">
              <Users className="w-5 h-5 mr-2" />
              Players ({players.filter(p => p.name.trim()).length})
            </TabsTrigger>
            <TabsTrigger value="rounds" className="text-lg">
              <ListOrdered className="w-5 h-5 mr-2" />
              Rounds ({rounds.filter(r => r.item_name.trim()).length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="settings">
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Game Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-white">GM PIN (required to access controls)</Label>
                  <Input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter PIN (min 4 characters)"
                    className="mt-2 bg-white/90"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Exact Guess Bonus ($)</Label>
                    <Input
                      type="number"
                      value={exactBonus}
                      onChange={(e) => setExactBonus(parseInt(e.target.value) || 0)}
                      min={0}
                      className="mt-2 bg-white/90"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-white">Default Missing Guess ($)</Label>
                    <Input
                      type="number"
                      value={defaultMissingGuess}
                      onChange={(e) => setDefaultMissingGuess(parseInt(e.target.value) || 1)}
                      min={1}
                      className="mt-2 bg-white/90"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="players">
            <Card className="bg-white/10 border-white/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Players (max 10)</CardTitle>
                <Button onClick={addPlayer} disabled={players.length >= 10} size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Add Player
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {players.map((player, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-lg">
                    <span className="text-white/50 w-6">{i + 1}.</span>
                    <Input
                      value={player.name}
                      onChange={(e) => updatePlayer(i, 'name', e.target.value)}
                      placeholder="Player name"
                      className="flex-1 bg-white/90"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePlayer(i)}
                      className="text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                
                {players.length === 0 && (
                  <p className="text-white/50 text-center py-8">No players added yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="rounds">
            <Card className="bg-white/10 border-white/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Rounds</CardTitle>
                <Button onClick={addRound} size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Add Round
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {rounds.map((round, i) => (
                  <div key={i} className="bg-white/5 p-4 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-300 font-bold">Round {i + 1}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRound(i)}
                        className="text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-white text-sm">Item Name *</Label>
                        <Input
                          value={round.item_name}
                          onChange={(e) => updateRound(i, 'item_name', e.target.value)}
                          placeholder="e.g., Teddy Bear"
                          className="mt-1 bg-white/90"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-white text-sm">Actual Price ($) *</Label>
                        <Input
                          type="number"
                          value={round.actual_price}
                          onChange={(e) => updateRound(i, 'actual_price', e.target.value)}
                          placeholder="e.g., 5"
                          className="mt-1 bg-white/90"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-white text-sm">Photo URL (optional)</Label>
                        <Input
                          value={round.item_photo_url}
                          onChange={(e) => updateRound(i, 'item_photo_url', e.target.value)}
                          placeholder="https://..."
                          className="mt-1 bg-white/90"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-white text-sm">Hint (optional)</Label>
                        <Input
                          value={round.hint_text}
                          onChange={(e) => updateRound(i, 'hint_text', e.target.value)}
                          placeholder="e.g., Popular toy"
                          className="mt-1 bg-white/90"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-white text-sm">Min Guess ($)</Label>
                        <Input
                          type="number"
                          value={round.min_guess}
                          onChange={(e) => updateRound(i, 'min_guess', parseInt(e.target.value) || 1)}
                          className="mt-1 bg-white/90"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-white text-sm">Max Guess ($)</Label>
                        <Input
                          type="number"
                          value={round.max_guess}
                          onChange={(e) => updateRound(i, 'max_guess', parseInt(e.target.value) || 10)}
                          className="mt-1 bg-white/90"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {rounds.length === 0 && (
                  <p className="text-white/50 text-center py-8">No rounds added yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Re-export GM Control Panel from components
import GMControlPanelComponent from '@/components/game/GMControlPanel';

function GMControlPanel({ gameCode }) {
  return <GMControlPanelComponent gameCode={gameCode} />;
}