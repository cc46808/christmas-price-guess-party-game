// Test Supabase connection
import { supabase } from './src/api/supabaseClient.js';

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test 1: Check connection
    const { data: games, error } = await supabase
      .from('Game')
      .select('*')
      .eq('code', 'MERRY123');
    
    if (error) {
      console.error('❌ Query error:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log('✅ Query successful!');
      console.log('Games found:', games);
    }
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

testConnection();
