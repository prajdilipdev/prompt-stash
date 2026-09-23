# Prompt Stash — Chrome Extension

A sleek, fast Chrome extension to search, copy, fill variables, and insert your Prompt Stash prompts anywhere on the web (ChatGPT, Claude, Gemini, etc.).

---

## Features

- **⚡ Instant 1-Click Copy**: Click "Copy" on any prompt card to copy the full prompt text with visual confirmation.
- **🪄 Dynamic Variable Substitution (`{{variable}}`)**: Click "Fill & Copy" on prompts with variables to type custom values into quick input fields and copy the resolved prompt text.
- **↗ 1-Click Insert into AI Chats**: Click "Insert" to paste the prompt directly into ChatGPT (`#prompt-textarea`), Claude (`div[contenteditable]`), Google Gemini, or any active web form.
- **🔍 Multi-Token Search**: Real-time search across titles, descriptions, prompt bodies, and tags.
- **★ Star / Favorite Prompts**: Quickly star prompts directly from the extension; synced in real-time to Supabase.
- **✂️ Context Menu Capture**: Highlight any text on any webpage -> right-click -> "Save to Prompt Stash".
- **🔐 Built-in Supabase Authentication**: Direct sign in and sign up with session persistence via `chrome.storage.local`.
- **⚙️ Connection Settings**: Connects by default to your Supabase project, with the option to customize credentials at any time.

---

## How to Install in Google Chrome (or Brave / Edge)

1. Open **Google Chrome** (or Edge / Brave).
2. In the URL address bar, navigate to:
   ```
   chrome://extensions
   ```
3. Enable **Developer mode** toggle in the top-right corner.
4. Click the **Load unpacked** button in the top-left corner.
5. In the file picker, select the `extension` folder located inside the `prompt-stash` directory:
   ```
   D:\Downloads\prompt-stash\extension
   ```
6. The **Prompt Stash** icon will appear in your Chrome toolbar!
7. Pin the extension to your toolbar by clicking the puzzle piece icon 🧩 next to your address bar and clicking the pin icon 📌 next to **Prompt Stash**.

---

## Keyboard Shortcut

- Press `Alt + P` (or `Option + P` on Mac) to open Prompt Stash from any tab at any time!
