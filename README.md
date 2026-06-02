# Simple English Reader

A Chrome Extension that helps non-native English speakers understand difficult words, phrases, and sentences using AI-powered explanations.

## Features

- **Explain** — Get a simple explanation of any selected text
- **Simplify** — Rewrite text in simpler English
- **Define** — Look up single words with definition, part of speech, example, and synonyms
- **Pronunciation** — Listen to the selected text or result via Web Speech API
- **History** — Browse your last 50 lookups with search and delete
- **Settings** — Configure API key, AI model, theme, and auto-show behavior

## Requirements

- Node.js 18+
- An OpenAI API key ([get one here](https://platform.openai.com/api-keys))

## Install & Build

```bash
cd Simple-English-Reader
npm install
npm run build
```

The built extension will be in the `dist/` folder.

## Load into Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder

## First-time Setup

1. Click the extension icon in the toolbar
2. Click **Settings** (or the warning banner)
3. Enter your OpenAI API key
4. Click **Save Settings**

## Usage

1. Visit any webpage
2. Highlight any text
3. A small tooltip will appear — click:
   - **Explain** — AI explains the text in simple English
   - **Simplify** — rewrites the text in simpler words
   - **Define** — shows definition, part of speech, example sentence, and synonyms (single words only)
4. Use the speaker button to hear the text pronounced
5. Use the copy button to copy the result
6. View your history at `chrome-extension://<id>/history.html` or via the popup

## Development

```bash
npm run dev   # Watch mode — rebuilds on file changes
```

Then reload the extension in `chrome://extensions` after each build.

## Project Structure

```
src/
├── background/     Background service worker — handles AI API calls
├── content/        Content script — floating tooltip and popup UI
├── popup/          Extension popup (toolbar icon click)
├── options/        Settings page
├── history/        Lookup history page
├── services/       OpenAI API service layer
├── types/          TypeScript type definitions
└── utils/          Chrome storage and messaging utilities
```

## Architecture

- **Content Script** uses a Shadow DOM for full style isolation from the host page
- **API calls** are made exclusively from the background service worker (never the content script) to keep the API key secure
- **Chrome Storage Sync** stores settings; **Chrome Storage Local** stores history
- Messages between content script and background use type-safe `MessageRequest`/`MessageResponse` interfaces

## Security

- API keys are stored in `chrome.storage.sync` — never in code or plain cookies
- API calls happen only in the background service worker — the key is never accessible to page content
- All inter-component communication uses structured message passing with type validation

## Supported Models

- `gpt-4o-mini` (default — fast and affordable)
- `gpt-4o`
- `gpt-4-turbo`
- `gpt-5-mini`
- Any custom model ID you enter in settings
