export type ActionType = 'explain' | 'simplify' | 'define';

export interface HistoryEntry {
  id: string;
  text: string;
  action: ActionType;
  result: string;
  timestamp: number;
}

export interface WordDefinition {
  definition: string;
  partOfSpeech: string;
  example: string;
  synonyms: string[];
}

export interface Settings {
  apiKey: string;
  model: string;
  theme: 'light' | 'dark';
  autoShowPopup: boolean;
}

export type MessageType = 'EXPLAIN' | 'SIMPLIFY' | 'DEFINE' | 'GET_SETTINGS';

export interface MessageRequest {
  type: MessageType;
  text?: string;
}

export interface MessageResponse {
  success: boolean;
  data?: string | Settings;
  error?: string;
}

export interface SelectionPosition {
  top: number;
  bottom: number;
  left: number;
  right: number;
  centerX: number;
}
