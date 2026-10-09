import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
let envUrl = '';
let envKey = '';

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('VITE_SUPABASE_URL=')) {
      envUrl = trimmed.replace('VITE_SUPABASE_URL=', '').trim();
    }
    if (trimmed.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      envKey = trimmed.replace('VITE_SUPABASE_ANON_KEY=', '').trim();
    }
  }
}

const cleanUrl = envUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabase = createClient(cleanUrl, envKey);

async function testRegister() {
  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  console.log('Testing Supabase SignUp for:', testEmail);

  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        username: 'test_creator_' + Math.floor(Math.random() * 1000),
        display_name: 'Test Creator',
      },
    },
  });

  if (error) {
    console.error('❌ SignUp Error:', error);
  } else {
    console.log('✅ SignUp Result User ID:', data.user?.id);
    console.log('✅ SignUp Session active?:', Boolean(data.session));

    // Try signing in immediately
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      console.warn('⚠️ Instant SignIn Warning:', signInError.message);
    } else {
      console.log('🎉 Instant SignIn Succeeded! Session token generated.');
    }
  }
}

testRegister();
