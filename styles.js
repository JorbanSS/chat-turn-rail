const turnNavigatorStyles = `
  :host {
    position: fixed; z-index: 55; translate: -100% -50%;
    font: 13px/1.45 system-ui, sans-serif;
    --surface: #fff; --text: #242424; --muted: #646464;
    --border: #dedede; --hover: #f2f2f2; --marker: #919191;
    --shadow: 0 8px 30px #0002;
    color-scheme: light; color: var(--text);
  }
  :host([hidden]), [hidden] { display: none !important; }
  :host([data-theme="dark"]) {
    --surface: #262626; --text: #f3f3f3; --muted: #bbb;
    --border: #484848; --hover: #383838; --marker: #8f8f8f;
    --shadow: 0 8px 30px #0006;
    color-scheme: dark;
  }
  * { box-sizing: border-box; }
  button, input { font: inherit; color: inherit; }
  button { background: transparent; border: 0; cursor: pointer; }
  button:focus-visible, input:focus-visible {
    outline: 2px solid var(--text); outline-offset: -2px;
  }
  .rail {
    display: grid; justify-items: center; gap: 3px;
    padding: 3px; border: 1px solid var(--border); border-radius: 14px;
    background: var(--surface);
  }
  :host([data-transparent-rail]) .rail {
    background: transparent; border-color: transparent;
  }
  .toggle {
    min-width: 30px; height: 28px; padding: 0 3px; border-radius: 9px;
    font-size: 11px; font-variant-numeric: tabular-nums; color: var(--muted);
  }
  .toggle:hover, .toggle[aria-expanded="true"] { background: var(--hover); color: var(--text); }
  .markers, .rows { overflow: auto; overscroll-behavior: contain; }
  .markers { width: 30px; max-height: min(216px, max(44px, var(--turn-height) - 82px)); scrollbar-width: none; }
  .marker { display: grid; place-items: center; width: 100%; height: 21px; padding: 0; border-radius: 6px; }
  .marker::before { content: ''; width: 9px; height: 3px; border-radius: 4px; background: var(--marker); }
  .marker:hover { background: var(--hover); }
  .marker[aria-current="true"]::before { width: 17px; background: var(--text); }
  .panel, .preview {
    position: absolute; top: 0; right: calc(100% + 9px);
    width: clamp(125px, calc(var(--turn-width) - 64px), 310px);
    border: 1px solid var(--border); border-radius: 15px;
    background: var(--surface); box-shadow: var(--shadow);
  }
  .panel { top: 50%; transform: translateY(-50%); padding: 8px; }
  .search {
    display: block; width: 100%; min-width: 0; height: 34px;
    padding: 0 9px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface);
  }
  .rows { margin: 6px -2px 0; max-height: min(38vh, max(66px, var(--turn-height) - 122px)); }
  .row {
    display: grid; grid-template-columns: minmax(24px, auto) minmax(0, 1fr);
    gap: 5px; align-items: start; width: 100%;
    border-radius: 8px; padding: 7px 6px; text-align: start;
  }
  .row:hover, .row[aria-current="true"] { background: var(--hover); }
  .row span:first-child { color: var(--muted); font-variant-numeric: tabular-nums; }
  .row span:last-child, .preview {
    overflow: hidden; overflow-wrap: anywhere;
    display: -webkit-box; -webkit-box-orient: vertical;
  }
  .row span:last-child { -webkit-line-clamp: 2; }
  .preview {
    pointer-events: none; top: clamp(0px, var(--turn-preview-y), calc(100% - 38px));
    padding: 8px 10px; -webkit-line-clamp: 4; white-space: pre-line;
  }
  .older {
    width: 100%; border-radius: 8px; margin-top: 4px; padding: 5px 3px;
    text-align: start; color: var(--muted); font-size: 12px;
  }
  .older:hover { background: var(--hover); color: var(--text); }
  .empty { margin: 8px 6px; color: var(--muted); }
  @media (max-width: 640px), (max-height: 420px) {
    .markers { display: none; }
  }
  :host([data-narrow]) .markers { display: none; }
`;
