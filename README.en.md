# Chat Turn Rail

[简体中文](README.md) · English · [Download the latest release](https://github.com/JorbanSS/chat-turn-rail/releases/latest)

A Chrome extension for **Chat and Work** on the ChatGPT website. Preview, search, and jump to earlier prompts from the conversation rail, or click a rendered formula to copy its LaTeX source.

## Install

1. Download and extract a ZIP from [GitHub Releases](https://github.com/JorbanSS/chat-turn-rail/releases). You can also choose **Code → Download ZIP** on the repository page.
2. Open `chrome://extensions` in Chrome and turn on **Developer mode**.
3. Choose **Load unpacked** and select the folder containing `manifest.json`.
4. Refresh any open ChatGPT pages.

> [!TIP]
> To upgrade, extract the new files into the folder Chrome already loads. Select **Reload** on the Chat Turn Rail card, then refresh ChatGPT.

## Use

| Feature | How it works |
| --- | --- |
| Preview and jump | Hover over a marker on the right of the conversation to preview a prompt. Click to jump to that turn. The rail appears when the conversation has at least two user prompts. |
| Search prompts | Open the list using the number at the top of the rail, then type a keyword. Press Enter to jump to the first result or Esc to close the list. |
| Browse older turns | Select **Scroll up to older messages** to let ChatGPT load an earlier batch. The number counts prompts indexed since you opened the conversation. |
| Copy LaTeX | Hover over a supported inline or display formula to highlight it and see a hint. Click to copy its LaTeX source. This also works in single-turn conversations. Scroll wide formulas horizontally to see both ends. |
| Change the rail background | Open the extension from the Chrome toolbar to toggle **Transparent navigation rail**, which is on by default. |

The rail follows the page theme and stays beside the conversation in Work’s split view. In narrow windows, use the number button to open the list.

## Permissions and privacy

The extension runs only on ChatGPT pages and builds an in-memory index of prompts in the current conversation. Clicking a formula writes its LaTeX to the system clipboard. Browser storage holds only the rail background preference. The extension makes no network requests.

## Local development

The extension uses Manifest V3 and plain JavaScript. Load the project root in Chrome without a build step.

- [`manifest.json`](manifest.json) defines site matches, version, and permissions.
- [`navigator.js`](navigator.js) and [`styles.js`](styles.js) handle turn indexing and navigation.
- [`formula-copy.js`](formula-copy.js) and [`formula-copy.css`](formula-copy.css) handle formula copying and feedback.
- [`settings.html`](settings.html), [`settings.js`](settings.js), and [`defaults.js`](defaults.js) handle toolbar settings.

The extension depends on ChatGPT’s message and formula markup. Report recognition or layout issues on [GitHub Issues](https://github.com/JorbanSS/chat-turn-rail/issues).

[MIT license](LICENSE)
