import type { WordDefinition } from '../types';

const BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en';

interface DictDef {
  definition: string;
  example?: string;
  synonyms: string[];
  antonyms: string[];
}

interface DictMeaning {
  partOfSpeech: string;
  definitions: DictDef[];
  synonyms: string[];
  antonyms: string[];
}

interface DictEntry {
  word: string;
  phonetic?: string;
  phonetics?: Array<{ text?: string }>;
  meanings: DictMeaning[];
}

export async function lookupWord(word: string): Promise<WordDefinition> {
  let response: Response;
  try {
    response = await fetch(`${BASE}/${encodeURIComponent(word.toLowerCase().trim())}`);
  } catch {
    throw new Error('Network error. Check your internet connection and try again.');
  }

  if (response.status === 404) {
    throw new Error(`No definition found for "${word}". Try the Explain feature instead.`);
  }
  if (!response.ok) {
    throw new Error(`Dictionary error (${response.status}). Try again later.`);
  }

  const data = (await response.json()) as DictEntry[];
  const entry = data[0];
  const meaning = entry.meanings[0];
  const def = meaning?.definitions[0];

  // Collect synonyms from meaning-level and definition-level, deduplicated
  const synonyms = Array.from(
    new Set([...(meaning?.synonyms ?? []), ...(def?.synonyms ?? [])]),
  ).slice(0, 4);

  // Pick the best phonetic text available
  const phonetic =
    entry.phonetic ||
    entry.phonetics?.find((p) => p.text)?.text ||
    '';

  return {
    definition: def?.definition ?? 'Definition not available.',
    partOfSpeech: meaning?.partOfSpeech ?? '',
    example: def?.example ?? '',
    synonyms,
    phonetic,
  };
}
