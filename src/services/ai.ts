import type { Settings } from '../types';

interface OAIMessage {
  role: 'system' | 'user';
  content: string;
}

interface OAIResponse {
  choices: Array<{ message: { content: string } }>;
  error?: { message: string; type: string; code: string };
}

async function callOpenAI(messages: OAIMessage[], settings: Settings): Promise<string> {
  if (!settings.apiKey) {
    throw new Error('API key not set. Open extension settings to add your OpenAI API key.');
  }

  let response: Response;
  try {
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.model || 'gpt-4o-mini',
        messages,
        max_tokens: 600,
        temperature: 0.7,
      }),
    });
  } catch {
    throw new Error('Network error. Check your internet connection and try again.');
  }

  if (response.status === 401) {
    throw new Error('Invalid API key. Please check your API key in extension settings.');
  }
  if (response.status === 429) {
    throw new Error('Rate limit reached. Please wait a moment and try again.');
  }
  if (response.status === 402) {
    throw new Error('OpenAI account has insufficient credits. Please add credits to your account.');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(body?.error?.message ?? `API error (${response.status})`);
  }

  const data = (await response.json()) as OAIResponse;
  if (data.error) throw new Error(data.error.message);

  return data.choices[0]?.message?.content?.trim() ?? '';
}

export async function explainText(text: string, settings: Settings): Promise<string> {
  return callOpenAI(
    [
      {
        role: 'system',
        content:
          'You are an English tutor for non-native English speakers. Explain the following text in simple, clear English. Avoid complex vocabulary. Be concise — 2 to 4 sentences.',
      },
      { role: 'user', content: `Explain this in simple English:\n\n"${text}"` },
    ],
    settings,
  );
}

export async function simplifyText(text: string, settings: Settings): Promise<string> {
  return callOpenAI(
    [
      {
        role: 'system',
        content:
          'You are an English writing assistant. Rewrite the given text in very simple English for someone with intermediate English skills. Use short sentences and common everyday words.',
      },
      { role: 'user', content: `Rewrite this in simple English:\n\n"${text}"` },
    ],
    settings,
  );
}

export async function defineWord(word: string, settings: Settings): Promise<string> {
  return callOpenAI(
    [
      {
        role: 'system',
        content:
          'You are an English dictionary for non-native speakers. Return a JSON object with these exact fields: "definition" (simple string), "partOfSpeech" (string), "example" (a simple sentence using the word), "synonyms" (array of 3-4 simple synonyms). No extra text, only valid JSON.',
      },
      { role: 'user', content: `Define the word: "${word}"` },
    ],
    settings,
  );
}
