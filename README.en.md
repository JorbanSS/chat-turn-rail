# Chat Turn Rail

[简体中文](README.md) · English

A Chrome extension that adds prompt navigation inside **Chat and Work** conversations on the ChatGPT website. Hover to preview a prompt, click to jump to it, or search the turn list.

## Installation

1. On GitHub, select **Code → Download ZIP**, or download a release archive, then extract it.
2. Open `chrome://extensions` in Chrome and enable **Developer mode**.
3. Select **Load unpacked** and choose the folder containing `manifest.json`.
4. Refresh ChatGPT and open a conversation with at least two user prompts.

To upgrade, replace the files in the folder Chrome already loads. On the extensions page, select **Reload** on the **Chat Turn Rail** card, then refresh ChatGPT.

## Usage

- **Preview and jump** · Hover over a marker on the right edge of the conversation to preview that prompt. Click the marker to jump to it.
- **Search the list** · Click the number at the top of the rail and type a keyword. Press Enter to jump to the first result or Esc to close the list.
- **Browse older turns** · The number counts prompts indexed since you opened the conversation. Indexed prompts stay in the list when ChatGPT unmounts off-screen messages. Select **Scroll up to older messages** to let the site load another batch. Reloading the page or switching conversations starts a new index.
- **Set the rail background** · The rail background and border are transparent by default. Use the toolbar popup to change the preference. Saved choices carry over when you upgrade. The expanded list and hover previews use solid backgrounds.

The rail follows the website’s light or dark theme and stays alongside the transcript in Work’s split view. Narrow windows keep the count button and hide individual markers.

## Permissions and privacy

The extension runs on ChatGPT pages. It reads prompts from the current conversation and holds its index in memory. Browser storage is used only for the transparency preference. The extension makes no network requests.

## Development

The extension uses Manifest V3 and plain JavaScript. Load the repository root directly in Chrome.

| File | Purpose |
| --- | --- |
| `manifest.json` | Site matches, permissions, and toolbar entry |
| `navigator.js` | Prompt indexing, navigation, and list interactions |
| `styles.js` | Rail, list, and preview styles |
| `defaults.js` | Defaults shared by the content script and popup |
| `settings.html`, `settings.js` | Toolbar settings popup |

The extension relies on ChatGPT’s page structure, which may change. Current verification covers simulated Chat, Work, and virtualized conversation layouts in Chromium.

Chat Turn Rail is an independently maintained extension inspired by ChatGPT’s long-conversation outline and Codex’s turn navigation. [ChatGPT release notes](https://help.openai.com/en/articles/6825453-chatgpt-release-notes#june-8-2026)

## License

[MIT](LICENSE)
