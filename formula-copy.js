(() => {
  const formulaSelector = '.katex, mjx-container, .MathJax, .MathJax_SVG';
  const scopeSelector = 'main, [role="main"], [data-message-author-role], article[data-turn]';
  const excluded = 'a, button, pre, code, [role="button"], [contenteditable]:not([contenteditable="false"])';
  const chinese = /^zh\b/i.test(document.documentElement.lang || navigator.language);
  const labels = chinese
    ? { copy: '点击复制 LaTeX', copied: '已复制', failed: '复制失败' }
    : { copy: 'Click to copy LaTeX', copied: 'Copied', failed: 'Copy failed' };

  const feedback = document.createElement('div');
  feedback.id = 'ctr-formula-feedback';
  feedback.setAttribute('aria-hidden', 'true');
  const announcement = document.createElement('div');
  announcement.id = 'ctr-formula-announcement';
  announcement.setAttribute('role', 'status');
  document.body.append(feedback, announcement);

  let activeFormula;
  let feedbackTimer;
  let copyRequest = 0;
  let lastAnnouncement = '';

  function getFormula(target) {
    if (!(target instanceof Element) || target.closest(excluded)) return null;
    const formula = target.closest(formulaSelector);
    return formula?.closest(scopeSelector) ? formula : null;
  }

  function getLatex(formula) {
    const annotation = formula.querySelector('annotation[encoding="application/x-tex"], .katex-mathml annotation');
    const next = formula.nextElementSibling;
    return annotation?.textContent.trim() ||
      formula.getAttribute('data-latex')?.trim() ||
      formula.getAttribute('data-tex')?.trim() ||
      (next?.matches('script[type^="math/tex"]') ? next.textContent.trim() : '');
  }

  function hideFeedback() {
    clearTimeout(feedbackTimer);
    feedback.removeAttribute('data-visible');
    announcement.textContent = '';
  }

  function clearInteraction() {
    copyRequest++;
    activeFormula?.removeAttribute('data-ctr-formula-copy');
    activeFormula = undefined;
    hideFeedback();
  }

  function showFeedback(formula, message) {
    if (activeFormula !== formula) {
      activeFormula?.removeAttribute('data-ctr-formula-copy');
      activeFormula = formula;
      formula.setAttribute('data-ctr-formula-copy', '');
    }
    clearTimeout(feedbackTimer);
    feedback.textContent = message;

    const display = formula.parentElement?.closest('.katex-display');
    const rect = (display ?? formula).getBoundingClientRect();
    const width = feedback.offsetWidth;
    const height = feedback.offsetHeight;
    const left = rect.left + (rect.width - width) / 2;
    feedback.style.left = `${Math.max(8, Math.min(left, innerWidth - width - 8))}px`;
    feedback.style.top = `${rect.top >= height + 16 ? rect.top - height - 8 : rect.bottom + 8}px`;
    feedback.setAttribute('data-visible', '');
  }

  document.addEventListener('pointerover', event => {
    if (event.pointerType === 'touch') return;
    const formula = getFormula(event.target);
    if (formula && formula !== activeFormula && getLatex(formula)) {
      showFeedback(formula, labels.copy);
    }
  });

  document.addEventListener('pointerout', event => {
    if (activeFormula?.contains(event.target) &&
        (!(event.relatedTarget instanceof Node) || !activeFormula.contains(event.relatedTarget))) {
      clearInteraction();
    }
  });

  document.addEventListener('click', async event => {
    if (!event.isTrusted || event.defaultPrevented || event.altKey || event.ctrlKey ||
        event.metaKey || event.shiftKey || window.getSelection()?.isCollapsed === false) return;
    const formula = getFormula(event.target);
    const latex = formula && getLatex(formula);
    if (!latex) return;

    const request = ++copyRequest;
    let message;
    try {
      await navigator.clipboard.writeText(latex);
      message = labels.copied;
    } catch {
      message = labels.failed;
    }
    if (request === copyRequest && formula.isConnected &&
        (!activeFormula || activeFormula === formula)) {
      showFeedback(formula, message);
      const spokenMessage = message === lastAnnouncement ? message + '\u00a0' : message;
      lastAnnouncement = spokenMessage;
      announcement.textContent = spokenMessage;
      feedbackTimer = setTimeout(event.pointerType === 'touch' ? clearInteraction : hideFeedback, 900);
    }
  });

  document.addEventListener('scroll', clearInteraction, { capture: true, passive: true });
  window.addEventListener('resize', clearInteraction);
  window.navigation?.addEventListener('currententrychange', clearInteraction);
})();
