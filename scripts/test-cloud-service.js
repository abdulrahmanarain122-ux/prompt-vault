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
const supabase = createClient(cleanUrl, envKey);

async function testCloudService() {
  console.log('--- Phase 3 Cloud Prompt Service Verification ---');
  let passed = 0;
  let total = 3;

  // Test 1: Fetch public prompts (Anonymous)
  try {
    const { data, error } = await supabase
      .from('prompts')
      .select('id, user_id, title, category, body, visibility, engine, aspect_ratio, tags, copy_count, created_at, updated_at')
      .eq('visibility', 'public');

    if (!error && Array.isArray(data)) {
      console.log(`✓ Test 1: Anonymous fetch of public prompts succeeded (${data.length} public prompts found).`);
      passed++;
    } else {
      console.error('❌ Test 1 Failed:', error);
    }
  } catch (err) {
    console.error('❌ Test 1 Exception:', err.message);
  }

  // Test 2: RLS Check - Anonymous user cannot fetch private prompts
  try {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('visibility', 'private');

    if (!error && data.length === 0) {
      console.log('✓ Test 2: RLS isolated private prompts from anonymous queries (0 private returned).');
      passed++;
    } else {
      console.error('❌ Test 2 Failed - Private prompts leaked to anonymous user:', data);
    }
  } catch (err) {
    console.error('❌ Test 2 Exception:', err.message);
  }

  // Test 3: Check Schema columns compatibility
  try {
    const { error } = await supabase
      .from('prompts')
      .select('id, user_id, title, category, body, visibility, engine, aspect_ratio, negative_prompt, tags, copy_count, created_at, updated_at')
      .limit(1);

    if (!error) {
      console.log('✓ Test 3: Database schema column mapping validated.');
      passed++;
    } else {
      console.error('❌ Test 3 Failed column mapping check:', error);
    }
  } catch (err) {
    console.error('❌ Test 3 Exception:', err.message);
  }

  console.log(`\nResult: ${passed}/${total} checks PASSED.`);
  if (passed !== total) {
    process.exit(1);
  }
}

testCloudService();
