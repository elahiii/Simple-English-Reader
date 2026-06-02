import type { MessageRequest, MessageResponse } from '../types';

export function sendToBackground(request: MessageRequest): Promise<MessageResponse> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(request, (response: MessageResponse) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message ?? 'Extension error' });
      } else {
        resolve(response ?? { success: false, error: 'No response from background' });
      }
    });
  });
}
