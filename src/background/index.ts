import { explainText, simplifyText, defineWordWithAI } from '../services/ai';
import { lookupWord } from '../services/dictionary';
import { getSettings, addToHistory } from '../utils/storage';
import type { MessageRequest, MessageResponse } from '../types';

chrome.runtime.onMessage.addListener(
  (request: MessageRequest, _sender, sendResponse) => {
    handleMessage(request)
      .then(sendResponse)
      .catch((err) =>
        sendResponse({ success: false, error: err instanceof Error ? err.message : String(err) }),
      );
    return true; // keep channel open for async response
  },
);

async function handleMessage(request: MessageRequest): Promise<MessageResponse> {
  if (request.type === 'GET_SETTINGS') {
    const settings = await getSettings();
    return { success: true, data: settings as unknown as string };
  }

  const text = request.text?.trim();
  if (!text) return { success: false, error: 'No text provided.' };

  const settings = await getSettings();

  switch (request.type) {
    case 'EXPLAIN': {
      const result = await explainText(text, settings);
      await addToHistory({ id: `${Date.now()}`, text, action: 'explain', result, timestamp: Date.now() });
      return { success: true, data: result };
    }

    case 'SIMPLIFY': {
      const result = await simplifyText(text, settings);
      await addToHistory({ id: `${Date.now()}`, text, action: 'simplify', result, timestamp: Date.now() });
      return { success: true, data: result };
    }

    case 'DEFINE': {
      let result: string;

      try {
        // Always try the free dictionary API first — no API key required
        const wordDef = await lookupWord(text);
        result = JSON.stringify(wordDef);
      } catch (dictError) {
        // Dictionary couldn't find the word — fall back to Gemini AI if a key is set
        if (settings.apiKey) {
          result = await defineWordWithAI(text, settings);
        } else {
          throw dictError;
        }
      }

      await addToHistory({ id: `${Date.now()}`, text, action: 'define', result, timestamp: Date.now() });
      return { success: true, data: result };
    }

    default:
      return { success: false, error: 'Unknown request type.' };
  }
}
