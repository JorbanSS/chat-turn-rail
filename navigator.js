(() => {
  const host = document.createElement('div');
  host.hidden = true;
  const root = host.attachShadow({ mode: 'open' });
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(turnNavigatorStyles);
  root.adoptedStyleSheets = [sheet];

  const strings = {
    zh: ['轮次导航', '搜索已索引的提问', '暂无匹配的提问', '滚到顶部查看更早消息', '含附件或无文本的提问', '这条提问暂未重新加载，滚动到附近后可再试。'],
    en: ['Turn navigator', 'Search indexed prompts', 'No matching prompts', 'Scroll up to older messages', 'Prompt with attachment or no text', 'This prompt has not reloaded. Scroll nearby and try again.']
  };
  const [title, searchLabel, emptyLabel, olderLabel, attachmentLabel, unavailableLabel] =
    /^zh\b/i.test(document.documentElement.lang || navigator.language) ? strings.zh : strings.en;

  function create(tag, className, parent) {
    const element = document.createElement(tag);
    element.className = className;
    if (tag === 'button') element.type = 'button';
    parent.append(element);
    return element;
  }

  const rail = create('nav', 'rail', root);
  rail.setAttribute('aria-label', title);
  const toggle = create('button', 'toggle', rail);
  toggle.setAttribute('aria-label', title);
  toggle.setAttribute('aria-controls', 'turn-list');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.title = title;
  const markers = create('div', 'markers', rail);
  const preview = create('div', 'preview', root);
  preview.hidden = true;
  preview.setAttribute('aria-hidden', 'true');
  const panel = create('section', 'panel', root);
  panel.id = 'turn-list';
  panel.setAttribute('aria-label', title);
  panel.hidden = true;
  const search = create('input', 'search', panel);
  search.type = 'search';
  search.placeholder = searchLabel;
  search.setAttribute('aria-label', searchLabel);
  const rows = create('div', 'rows', panel);
  const older = create('button', 'older', panel);
  older.textContent = olderLabel;
  const feedback = create('p', 'empty', panel);
  feedback.setAttribute('role', 'status');
  feedback.hidden = true;

  const modernUnit = '[data-content-search-unit-key$=":user"],[data-chatgpt-search-unit-key$=":user"]';
  const legacyMessage = '[data-message-author-role="user"]';
  const userBubble = '[data-user-message-bubble="true"]';
  const legacyTurn = 'article[data-turn="user"]';
  const candidates = [modernUnit, legacyMessage, userBubble, legacyTurn].join(',');
  const modernTranscript = '[data-thread-find-target="conversation"],[data-chatgpt-conversation-selection-target]';
  const excluded = '[role="dialog"],[aria-modal="true"],[inert],[hidden],[aria-hidden="true"],[data-side-chat-id]';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const darkMode = matchMedia('(prefers-color-scheme: dark)');

  let prompts = [];
  let scroller;
  let active;
  let selected;
  let updateTimer;
  let frame;
  let path = location.pathname;
  let conversationId;
  let transcript;
  let pendingJump;
  const resize = new ResizeObserver(scheduleUpdate);
  const index = new Map();

  function applyRailBackground(transparentRail) {
    host.toggleAttribute('data-transparent-rail', transparentRail);
  }

  applyRailBackground(defaultSettings.transparentRail);
  chrome.storage.local.get(defaultSettings).then(({ transparentRail }) => {
    applyRailBackground(transparentRail);
  }).catch(() => {});
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.transparentRail) {
      applyRailBackground(changes.transparentRail.newValue ?? defaultSettings.transparentRail);
    }
  });

  function visible(node) {
    return node.getClientRects().length > 0 && !node.closest(excluded);
  }

  function findTranscript() {
    const mainRegions = [...document.querySelectorAll('main,[role="main"]')].filter(visible);
    const scope = mainRegions.find(node => node.querySelector(candidates)) ?? document.body;
    const modern = [...scope.querySelectorAll(modernTranscript)]
      .find(node => visible(node) && node.querySelector(candidates));
    return modern ?? scope;
  }

  function collectPrompts(transcript) {
    const result = [];
    const seen = new Set();
    for (const match of transcript.querySelectorAll(candidates)) {
      const unit = match.closest(modernUnit) ?? match.querySelector(modernUnit);
      const message = match.closest(legacyMessage) ?? match.querySelector(legacyMessage);
      const anchor = unit ?? message ?? match;
      if (seen.has(anchor) || !visible(anchor)) continue;
      seen.add(anchor);

      const bubble = anchor.matches(userBubble) ? anchor :
        anchor.querySelector(`${userBubble},.user-message-bubble-color`);
      const messageBody = bubble?.querySelector('[data-search-result-target]') ?? bubble;
      // A focused editor or an attachment-only turn may have no readable bubble.
      const editor = anchor.querySelector('textarea,[contenteditable="true"]');
      const rawText = messageBody?.innerText ?? editor?.value ?? editor?.innerText ?? anchor.innerText;
      const text = rawText?.replace(/\s+/gu, ' ').trim() || attachmentLabel;
      const turnKey = anchor.closest('[data-turn-key]')?.dataset.turnKey;
      const id = anchor.closest('[data-chatgpt-search-message-ids]')
        ?.getAttribute('data-chatgpt-search-message-ids') || message?.dataset.messageId ||
        anchor.closest('[data-turn-id]')?.getAttribute('data-turn-id');
      const stableTurn = turnKey && !/^fallback-turn/.test(turnKey) ? turnKey : undefined;
      const key = id || stableTurn || anchor.dataset.contentSearchUnitKey ||
        anchor.dataset.chatgptSearchUnitKey || anchor;
      if (seen.has(key) && key !== anchor) continue;
      seen.add(key);
      result.push({ anchor, key, text, stableTurn });
    }
    return result;
  }

  function findScroller(anchor) {
    const timeline = anchor.closest('[data-app-action-timeline-scroll]');
    if (timeline) return timeline;
    for (let node = anchor.parentElement; node && node !== document.body; node = node.parentElement) {
      if (['auto', 'scroll', 'overlay'].includes(getComputedStyle(node).overflowY)) return node;
    }
    return document.scrollingElement;
  }

  function setScroller(next) {
    if (next === scroller) return;
    resize.disconnect();
    scroller = next;
    if (scroller) resize.observe(scroller);
  }

  function scrollTarget() {
    return scroller === document.scrollingElement ? window : scroller;
  }

  function contentOffset(anchor) {
    const top = scroller === document.scrollingElement ? 0 : scroller.getBoundingClientRect().top;
    return scroller.scrollTop + anchor.getBoundingClientRect().top - top;
  }

  function updateIndex(mounted) {
    // Virtual rendering removes nodes but leaves their place in the scroll area.
    // When history is prepended, use turns that stayed mounted to calibrate old offsets.
    const measured = new Map(mounted.map(item => [
      item.key, { ...item, offset: contentOffset(item.anchor) }
    ]));
    const references = [];
    for (const [key, item] of measured) {
      const previous = index.get(key);
      if (previous) references.push({ before: previous.offset, shift: item.offset - previous.offset });
    }
    references.sort((a, b) => a.before - b.before);
    let reference = 0;
    for (const previous of index.values()) {
      if (measured.has(previous.key)) continue;
      if (typeof previous.key !== 'string') index.delete(previous.key);
      previous.anchor = undefined;
    }
    for (const previous of prompts) {
      if (measured.has(previous.key) || !references.length) continue;
      while (reference + 1 < references.length &&
        Math.abs(references[reference + 1].before - previous.offset) <
        Math.abs(references[reference].before - previous.offset)) reference++;
      previous.offset += references[reference].shift;
    }
    for (const item of measured.values()) index.set(item.key, item);
    return [...index.values()].sort((a, b) => a.offset - b.offset);
  }

  function resetConversation() {
    index.clear();
    prompts = [];
    active = selected = undefined;
    cancelJump();
    setScroller(undefined);
    setPanel(false);
  }

  function setPanel(open, restoreFocus = false) {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    preview.hidden = true;
    if (open) {
      feedback.hidden = true;
      search.value = '';
      renderRows();
      search.focus({ preventScroll: true });
    } else if (restoreFocus && !host.hidden) {
      toggle.focus({ preventScroll: true });
    }
  }

  function cancelJump() {
    if (!pendingJump) return;
    clearTimeout(pendingJump.timeout);
    pendingJump = undefined;
  }

  function land(current) {
    cancelJump();
    selected = current.key;
    paintActive(current.key);
    scrollTarget().scrollTo({ top: contentOffset(current.anchor) - 24, behavior: 'instant' });
    preview.hidden = true;
    if (!panel.hidden) setPanel(false, true);
    schedulePosition();
  }

  function jump(item) {
    cancelJump();
    const current = index.get(item.key);
    if (!current || !scroller) return;
    if (current.anchor?.isConnected) {
      land(current);
      return;
    }
    // A virtualized turn may still have a measured placeholder in the transcript.
    const placeholder = current.stableTurn && transcript.querySelector(
      `[data-turn-key="${CSS.escape(current.stableTurn)}"]`
    );
    pendingJump = {
      key: current.key,
      timeout: setTimeout(() => {
        cancelJump();
        if (panel.hidden) setPanel(true);
        feedback.textContent = unavailableLabel;
        feedback.hidden = false;
      }, 1500)
    };
    const offset = placeholder ? contentOffset(placeholder) : current.offset;
    scrollTarget().scrollTo({ top: offset - 24, behavior: 'instant' });
    scheduleUpdate();
  }

  function renderMarkers() {
    preview.hidden = true;
    const scrollTop = markers.scrollTop;
    const focusIndex = [...markers.children].indexOf(root.activeElement);
    markers.replaceChildren();
    for (const [index, item] of prompts.entries()) {
      const mark = create('button', 'marker', markers);
      mark.setAttribute('aria-label', `${index + 1}. ${item.text.slice(0, 180)}`);
      mark.addEventListener('click', () => jump(item));
      const show = () => {
        if (!panel.hidden) return;
        const top = mark.getBoundingClientRect().top - host.getBoundingClientRect().top;
        host.style.setProperty('--turn-preview-y', `${top}px`);
        preview.textContent = `${index + 1}. ${item.text.slice(0, 240)}`;
        preview.hidden = false;
      };
      const hide = () => { preview.hidden = true; };
      mark.addEventListener('pointerenter', show);
      mark.addEventListener('pointerleave', hide);
      mark.addEventListener('focus', show);
      mark.addEventListener('blur', hide);
    }
    markers.scrollTop = scrollTop;
    markers.children[focusIndex]?.focus({ preventScroll: true });
    paintActive(active);
  }

  function renderRows() {
    const query = search.value.trim().toLocaleLowerCase();
    rows.replaceChildren();
    for (const [index, item] of prompts.entries()) {
      if (!item.text.toLocaleLowerCase().includes(query)) continue;
      const row = create('button', 'row', rows);
      row.setAttribute('aria-current', String(active === item.key));
      create('span', '', row).textContent = String(index + 1);
      create('span', '', row).textContent = item.text.slice(0, 350);
      row.addEventListener('click', () => jump(item));
    }
    if (!rows.childElementCount) create('p', 'empty', rows).textContent = emptyLabel;
  }

  function paintActive(key) {
    active = key;
    for (const [index, mark] of [...markers.children].entries()) {
      const current = prompts[index].key === key;
      if (mark.getAttribute('aria-current') !== String(current)) {
        mark.setAttribute('aria-current', String(current));
        // Keep the active turn visible without scrolling the underlying conversation.
        if (current && markers.matches(':not(:hover)') && !markers.contains(root.activeElement)) {
          const top = index * 21;
          if (top < markers.scrollTop) markers.scrollTop = top;
          if (top + 21 > markers.scrollTop + markers.clientHeight) {
            markers.scrollTop = top + 21 - markers.clientHeight;
          }
        }
      }
    }
  }

  function viewport() {
    if (!scroller || scroller === document.scrollingElement) {
      return { top: 0, left: 0, right: innerWidth, bottom: innerHeight };
    }
    const rect = scroller.getBoundingClientRect();
    return {
      top: Math.max(0, rect.top), left: Math.max(0, rect.left),
      right: Math.min(innerWidth, rect.right), bottom: Math.min(innerHeight, rect.bottom)
    };
  }

  function position() {
    frame = undefined;
    if (host.hidden) return;
    const { top, bottom, left, right } = viewport();
    host.style.top = `${(top + bottom) / 2}px`;
    host.style.left = `${right - 9}px`;
    host.style.setProperty('--turn-width', `${right - left}px`);
    host.style.setProperty('--turn-height', `${bottom - top}px`);
    host.toggleAttribute('data-narrow', right - left < 500);
    const line = top + Math.min(96, (bottom - top) / 4);
    let key = prompts[0]?.key;
    if (selected && index.has(selected)) key = selected;
    else {
      const scrollLine = scroller.scrollTop + line -
        (scroller === document.scrollingElement ? 0 : scroller.getBoundingClientRect().top);
      for (const item of prompts) {
        if (item.offset > scrollLine) break;
        key = item.key;
      }
    }
    if (active !== key) {
      paintActive(key);
      if (!panel.hidden) {
        for (const row of rows.querySelectorAll('.row')) {
          const index = Number(row.firstElementChild.textContent) - 1;
          row.setAttribute('aria-current', String(prompts[index]?.key === key));
        }
      }
    }
  }

  function schedulePosition() {
    if (frame === undefined) frame = requestAnimationFrame(position);
  }

  function update() {
    updateTimer = undefined;
    const previous = prompts;
    const region = findTranscript();
    const id = region.closest('[data-chatgpt-conversation-selection-target]')
      ?.getAttribute('data-chatgpt-conversation-selection-target');
    if (location.pathname !== path) {
      // The initial send can change / to /c/<id> while keeping the same transcript.
      const sameInitialChat = path === '/' && /^\/c\//.test(location.pathname) &&
        region === transcript && (id == null || conversationId == null || id === conversationId);
      if (!sameInitialChat) resetConversation();
      path = location.pathname;
      conversationId = undefined;
    }
    if (conversationId && id && conversationId !== id) resetConversation();
    conversationId = id ?? conversationId;
    transcript = region;
    const mounted = /^\/codex(?:\/|$)/.test(path) ? [] : collectPrompts(transcript);
    if (mounted.length) setScroller(findScroller(mounted[0].anchor));
    const next = updateIndex(mounted);
    const changed = next.length !== previous.length || next.some((item, i) =>
      item.key !== previous[i].key || item.text !== previous[i].text);
    prompts = next;

    const theme = document.documentElement.dataset.theme ?? document.body.dataset.theme;
    const dark = theme === 'dark' || (theme !== 'light' && (
      document.documentElement.classList.contains('dark') || document.body.classList.contains('dark') ||
      (!document.documentElement.classList.contains('light') &&
       !document.body.classList.contains('light') && darkMode.matches)
    ));
    host.dataset.theme = dark ? 'dark' : 'light';
    host.hidden = prompts.length < 2 || !scroller?.isConnected;
    if (host.hidden) setPanel(false);
    if (changed) {
      toggle.textContent = String(prompts.length);
      toggle.title = `${title} · ${prompts.length}`;
      renderMarkers();
      if (!panel.hidden) renderRows();
    }
    const target = pendingJump && index.get(pendingJump.key);
    if (target?.anchor?.isConnected) land(target);
    schedulePosition();
  }

  function scheduleUpdate() {
    if (updateTimer === undefined) updateTimer = setTimeout(update, 100);
  }

  toggle.addEventListener('click', () => setPanel(panel.hidden, true));
  search.addEventListener('input', renderRows);
  panel.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target === search) {
      event.preventDefault();
      rows.querySelector('button')?.click();
    }
    if (event.key === 'ArrowDown' && event.target === search) {
      event.preventDefault();
      rows.querySelector('button')?.focus();
    }
  });
  root.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || panel.hidden) return;
    event.stopPropagation();
    setPanel(false, true);
  });
  older.addEventListener('click', () => {
    if (!scroller) return;
    cancelJump();
    selected = undefined;
    const target = scroller === document.scrollingElement ? window : scroller;
    target.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    setPanel(false, true);
  });

  document.addEventListener('pointerdown', event => {
    if (!panel.hidden && !event.composedPath().includes(host)) setPanel(false);
  }, true);
  // A manual scroll should update the current-turn indicator after a jump.
  for (const name of ['wheel', 'touchstart', 'pointerdown', 'keydown']) {
    document.addEventListener(name, event => {
      if (!event.composedPath().includes(host) && (selected !== undefined || pendingJump)) {
        cancelJump();
        selected = undefined;
        schedulePosition();
      }
    }, { capture: true, passive: true });
  }
  document.addEventListener('scroll', schedulePosition, { capture: true, passive: true });
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('popstate', scheduleUpdate);
  window.navigation?.addEventListener('currententrychange', scheduleUpdate);
  darkMode.addEventListener('change', scheduleUpdate);
  document.body.append(host);
  new MutationObserver(records => {
    if (records.some(record => record.target !== host)) scheduleUpdate();
  }).observe(document.documentElement, {
    childList: true, subtree: true, characterData: true, attributes: true,
    attributeFilter: ['class', 'hidden', 'inert', 'aria-hidden', 'data-theme',
      'data-turn', 'data-message-author-role', 'data-content-search-unit-key',
      'data-chatgpt-search-unit-key', 'data-user-message-bubble', 'data-turn-key',
      'data-chatgpt-search-message-ids', 'data-chatgpt-conversation-selection-target']
  });
  update();
})();
