const labels = {
  en: ['Transparent navigation rail', 'Could not load settings.', 'Could not save the change.'],
  zh: ['透明导航条背景', '无法读取设置。', '无法保存设置。']
};
const language = /^zh\b/i.test(chrome.i18n.getUILanguage()) ? 'zh' : 'en';
const [label, readError, saveError] = labels[language];
document.documentElement.lang = language;
document.getElementById('label').textContent = label;

const checkbox = document.getElementById('transparent-rail');
const status = document.getElementById('status');

chrome.storage.local.get(defaultSettings).then(({ transparentRail }) => {
  checkbox.checked = transparentRail;
  checkbox.disabled = false;
}).catch(() => {
  status.textContent = readError;
  status.hidden = false;
});

checkbox.addEventListener('change', async () => {
  const checked = checkbox.checked;
  checkbox.disabled = true;
  status.hidden = true;
  try {
    await chrome.storage.local.set({ transparentRail: checked });
  } catch {
    checkbox.checked = !checked;
    status.textContent = saveError;
    status.hidden = false;
  } finally {
    checkbox.disabled = false;
  }
});
