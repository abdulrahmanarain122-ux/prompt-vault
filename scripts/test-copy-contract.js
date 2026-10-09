import assert from 'node:assert';
import { formatPromptCopyPayload } from '../src/utils/promptCopy.js';

function runCopyContractTests() {
  console.log('=== EXACT PROMPT COPY CONTRACT VERIFICATION ===');

  // Example 1: M="Write a short story."; N=null -> "Write a short story."
  const ex1 = formatPromptCopyPayload({ body: 'Write a short story.', negativePrompt: null });
  assert.strictEqual(ex1, 'Write a short story.');
  console.log('✓ Case 1 passed: null negative prompt');

  // Example 2: M="Write a short story."; N="Avoid gore." -> "Write a short story.\n\nAvoid gore."
  const ex2 = formatPromptCopyPayload({ body: 'Write a short story.', negativePrompt: 'Avoid gore.' });
  assert.strictEqual(ex2, 'Write a short story.\n\nAvoid gore.');
  console.log('✓ Case 2 passed: normal negative prompt');

  // Example 3: M="  main\r\ntext\n"; N=" negative " -> "  main\r\ntext\n\n\n negative "
  const ex3 = formatPromptCopyPayload({ body: '  main\r\ntext\n', negativePrompt: ' negative ' });
  assert.strictEqual(ex3, '  main\r\ntext\n\n\n negative ');
  console.log('✓ Case 3 passed: CRLF, boundary newlines, and leading/trailing whitespace preserved');

  // Example 4: M="main"; N="" -> "main"
  const ex4 = formatPromptCopyPayload({ body: 'main', negativePrompt: '' });
  assert.strictEqual(ex4, 'main');
  console.log('✓ Case 4 passed: empty string negative prompt treated as absent');

  // Example 5: M="main"; N="   " -> "main\n\n   "
  const ex5 = formatPromptCopyPayload({ body: 'main', negativePrompt: '   ' });
  assert.strictEqual(ex5, 'main\n\n   ');
  console.log('✓ Case 5 passed: whitespace-only negative prompt preserved exactly');

  // Example 6: M="Prompt: literal user text"; N=null -> "Prompt: literal user text"
  const ex6 = formatPromptCopyPayload({ body: 'Prompt: literal user text', negativePrompt: null });
  assert.strictEqual(ex6, 'Prompt: literal user text');
  console.log('✓ Case 6 passed: literal label in user text preserved');

  // Example 7: Undefined negative prompt
  const ex7 = formatPromptCopyPayload({ body: 'Hello world', negativePrompt: undefined });
  assert.strictEqual(ex7, 'Hello world');
  console.log('✓ Case 7 passed: undefined negative prompt treated as absent');

  // Example 8: Unicode / Emoji in body and negative prompt
  const ex8 = formatPromptCopyPayload({ body: 'A futuristic 🤖 astronaut in 🌸 spring', negativePrompt: 'no 💥 explosions' });
  assert.strictEqual(ex8, 'A futuristic 🤖 astronaut in 🌸 spring\n\nno 💥 explosions');
  console.log('✓ Case 8 passed: Unicode & Emoji characters preserved');

  // Example 9: Explicit empty string main prompt
  const ex9a = formatPromptCopyPayload({ body: '', negativePrompt: 'avoid blur' });
  assert.strictEqual(ex9a, '\n\navoid blur');
  const ex9b = formatPromptCopyPayload({ body: '', negativePrompt: '' });
  assert.strictEqual(ex9b, '');
  console.log('✓ Case 9 passed: explicitly stored empty string main prompt');

  // Example 10: Missing/non-string main prompt throws data error
  assert.throws(() => formatPromptCopyPayload(null), /main prompt text is required/);
  assert.throws(() => formatPromptCopyPayload(undefined), /main prompt text is required/);
  assert.throws(() => formatPromptCopyPayload({ body: null }), /main prompt text is required/);
  assert.throws(() => formatPromptCopyPayload({ body: 123 }), /main prompt text is required/);
  console.log('✓ Case 10 passed: invalid/missing main prompt throws explicit data error');

  console.log('\n🎉 ALL 10 COPY CONTRACT SPECIFICATION CHECKS PASSED PERFECTLY!\n');
}

runCopyContractTests();
