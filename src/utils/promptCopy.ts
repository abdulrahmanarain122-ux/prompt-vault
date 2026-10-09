/**
 * Single shared copy-payload implementation conforming to the Prompt Vault Exact Copy Contract.
 *
 * Let M be the canonical stored main-prompt string and N the canonical stored negative-prompt value.
 * - A negative prompt is present when N is a string with length greater than zero.
 *   Whitespace-only N counts as present: preserve it exactly. Null, undefined, or an empty string means absent.
 * - If N is absent, clipboard payload = M.
 * - If N is present, clipboard payload = M + "\n\n" + N.
 * - The separator is exactly two LF newline characters. Append it literally even if M ends with newlines
 *   or N begins with newlines; do not trim or deduplicate them.
 * - Preserve every character of M and N, including leading/trailing spaces, internal blank lines,
 *   Unicode, punctuation, and their stored CRLF/LF sequences. Do not normalize line endings within either field.
 * - Add no title, labels such as "Prompt:" or "Negative prompt:", category, collection name, tags,
 *   author, description, IDs, JSON, Markdown fences, commentary, or surrounding newline.
 * - Never stringify null or undefined. Treat a missing/non-string main prompt as a data error:
 *   do not copy metadata or silently fabricate content; use the current error pattern.
 * - If M is an explicitly stored empty string, retain that exact value and apply the same composition rule.
 */

export interface PromptCopyable {
  body?: unknown;
  negativePrompt?: unknown;
}

export function formatPromptCopyPayload(prompt: PromptCopyable | null | undefined): string {
  if (!prompt || typeof prompt.body !== 'string') {
    throw new Error('Invalid prompt data: canonical main prompt text is required.');
  }

  const M: string = prompt.body;
  const N = prompt.negativePrompt;

  // Present only when N is a string with length > 0 (whitespace-only counts as present)
  if (typeof N === 'string' && N.length > 0) {
    return M + '\n\n' + N;
  }

  return M;
}

export async function copyPromptToClipboard(prompt: PromptCopyable | null | undefined): Promise<string> {
  const payload = formatPromptCopyPayload(prompt);

  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(payload);
  } else if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.value = payload;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    textarea.setAttribute('aria-hidden', 'true');
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    if (!successful) {
      throw new Error('document.execCommand copy fallback failed');
    }
  } else {
    throw new Error('Clipboard API is not available');
  }

  return payload;
}
