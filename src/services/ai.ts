import type { Settings } from '../types';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiResponse {
  candidates?: Array<{
    content: { parts: Array<{ text: string }> };
    finishReason?: string;
  }>;
  error?: { message: string; code: number; status: string };
}

async function callGemini(prompt: string, settings: Settings): Promise<string> {
  if (!settings.apiKey) {
    throw new Error(
      'Gemini API key not set. Get a free key at aistudio.google.com and add it in Settings.',
    );
  }

  const model = settings.model || 'gemini-2.0-flash';
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${settings.apiKey}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
      }),
    });
  } catch {
    throw new Error('Network error. Check your internet connection and try again.');
  }

  if (response.status === 400) {
    const body = (await response.json().catch(() => ({}))) as GeminiResponse;
    throw new Error(body?.error?.message ?? 'Invalid API request. Check your API key.');
  }
  if (response.status === 403) {
    throw new Error('Invalid or expired Gemini API key. Please check your settings.');
  }
  if (response.status === 429) {
    throw new Error('Rate limit reached. Please wait a moment and try again.');
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as GeminiResponse;
    throw new Error(body?.error?.message ?? `API error (${response.status})`);
  }

  const data = (await response.json()) as GeminiResponse;
  if (data.error) throw new Error(data.error.message);

  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
}

export async function explainText(text: string, settings: Settings): Promise<string> {
  return callGemini(
    `You are an English tutor for non-native English speakers. Explain the following text in simple, clear English. Avoid complex vocabulary. Be concise — 2 to 4 sentences.\n\nText: "${text}"`,
    settings,
  );
}

export async function simplifyText(text: string, settings: Settings): Promise<string> {
  return callGemini(
    `Rewrite the following text in very simple English for someone with intermediate English skills. Use short sentences and common everyday words.\n\nText: "${text}"`,
    settings,
  );
}

export async function defineWordWithAI(word: string, settings: Settings): Promise<string> {
  return callGemini(
    `Define the English word "${word}" for a non-native speaker. Return ONLY a valid JSON object with these exact fields: "definition" (simple string), "partOfSpeech" (string like "noun" or "adjective"), "example" (a simple sentence using the word), "synonyms" (array of 3 simple synonyms). No markdown, no explanation — only raw JSON.`,
    settings,
  );
}
