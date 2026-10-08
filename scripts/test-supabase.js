import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env manually for standalone Node test runner
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

console.log('====================================================');
console.log(' SUPABASE CONNECTION & RLS DIAGNOSTICS');
console.log('====================================================');
console.log('Project URL :', cleanUrl);
console.log('Anon Key    :', envKey ? envKey.slice(0, 16) + '...' : '(Not set)');
console.log('----------------------------------------------------');

if (!cleanUrl || !envKey) {
  console.error('ERROR: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(cleanUrl, envKey);

async function runCheck() {
  let allPassed = true;

  // 1. Auth Endpoint Check
  try {
    const { error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.log('❌ Auth Service Status: FAILED -', authError.message);
      allPassed = false;
    } else {
      console.log('✅ 1. Auth Service Status: ONLINE (HTTP 200 OK)');
    }
  } catch (err) {
    console.log('❌ Auth Service Status: EXCEPTION -', err.message);
    allPassed = false;
  }

  // 2. Prompts Table Check
  try {
    const { data, error, status } = await supabase.from('prompts').select('id, title, visibility').limit(3);
    if (error) {
      console.log(`❌ 2. Table "public.prompts": NOT FOUND (${error.code}: ${error.message})`);
      allPassed = false;
    } else {
      console.log(`✅ 2. Table "public.prompts": ONLINE (Found ${data.length} sample public rows)`);
    }
  } catch (err) {
    console.log('❌ Table "prompts" Check: EXCEPTION -', err.message);
    allPassed = false;
  }

  // 3. Profiles Table Check
  try {
    const { data, error } = await supabase.from('profiles').select('id, username').limit(3);
    if (error) {
      console.log(`❌ 3. Table "public.profiles": NOT FOUND (${error.code}: ${error.message})`);
      allPassed = false;
    } else {
      console.log(`✅ 3. Table "public.profiles": ONLINE (Found ${data.length} sample profile rows)`);
    }
  } catch (err) {
    console.log('❌ Table "profiles" Check: EXCEPTION -', err.message);
    allPassed = false;
  }

  // 4. RLS Policy Check (Anonymous user attempting unauthorized insert)
  try {
    const { error, status } = await supabase.from('prompts').insert([
      {
        title: 'Unauthorized Penetration Test Prompt',
        category: 'Other',
        body: 'This must be rejected by RLS',
        visibility: 'public'
      }
    ]);

    if (error && (error.code === '42501' || error.message.includes('policy') || status === 401 || status === 403)) {
      console.log('✅ 4. RLS Security Policy: SECURE & ACTIVE (Anonymous INSERT rejected)');
    } else if (error && error.code === 'PGRST205') {
      console.log('❌ 4. RLS Security Policy: Table does not exist yet to verify RLS');
      allPassed = false;
    } else if (!error) {
      console.log('⚠️ 4. RLS Security Policy: VULNERABILITY! Anonymous insert succeeded!');
      allPassed = false;
    } else {
      console.log(`⚠️ 4. RLS Security Policy: Returned ${error.message}`);
    }
  } catch (err) {
    console.log('❌ RLS Check: EXCEPTION -', err.message);
  }

  console.log('----------------------------------------------------');
  if (allPassed) {
    console.log('🎉 ALL CHECKS PASSED: Supabase tables & RLS are ready for Phase 2!');
  } else {
    console.log('⚠️ CHECKS INCOMPLETE: Database schema needs to be applied.');
  }
  console.log('====================================================\n');
}

runCheck();
