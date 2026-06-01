(() => {
  'use strict';

  const STORAGE_KEY = 'codelearn_project_editor';
  const TEMPLATES = {
    starter: {
      name: 'Neon Starter',
      html: `<main class="hero">
  <p class="eyebrow">Live Projekt</p>
  <h1>Baue deine Idee</h1>
  <button id="action">Klick mich</button>
</main>`,
      css: `body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  font-family: system-ui, sans-serif;
  background: #08111f;
  color: white;
}

.hero {
  text-align: center;
  padding: 3rem;
  border: 1px solid #22d3ee;
  border-radius: 18px;
  box-shadow: 0 0 40px rgba(34, 211, 238, 0.25);
}

.eyebrow { color: #67e8f9; text-transform: uppercase; }
button { padding: .8rem 1.2rem; border: 0; border-radius: 10px; }`,
      js: `const button = document.querySelector('#action');
button.addEventListener('click', () => {
  console.log('Dein Projekt läuft!');
  button.textContent = 'Gestartet';
});`
    },
    card: {
      name: 'Product Card',
      html: `<article class="card">
  <div class="badge">Neu</div>
  <h1>CSS Mastery</h1>
  <p>Eine klare Karte mit Hover-Effekt und CTA.</p>
  <button>Ausprobieren</button>
</article>`,
      css: `body {
  min-height: 100vh;
  display: grid;
  place-items: center;
  margin: 0;
  background: linear-gradient(135deg, #111827, #0f766e);
  font-family: Inter, system-ui, sans-serif;
}
.card {
  width: min(360px, 90vw);
  background: white;
  color: #111827;
  padding: 2rem;
  border-radius: 18px;
  box-shadow: 0 25px 80px rgba(0,0,0,.35);
}
.badge { color: #0f766e; font-weight: 800; }
button { background: #0f766e; color: white; border: 0; padding: .8rem 1rem; border-radius: 10px; }`,
      js: `document.querySelector('button').addEventListener('click', () => {
  console.log('Schönes UI!');
  document.querySelector('.badge').textContent = 'Aktiv';
});`
    }
  };

  const state = {
    active: 'html',
    code: { html: '', css: '', js: '' },
    dirty: false,
    runTimer: null
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  document.addEventListener('DOMContentLoaded', () => {
    if (!$('#project-ide')) return;
    initEditor();
  });

  function initEditor() {
    loadSavedProject() || loadTemplate('starter');
    bindEvents();
    renderEditor();
    runProject();
  }

  function bindEvents() {
    $$('.ide-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        state.active = tab.dataset.lang;
        renderEditor();
      });
    });

    $('#code-input').addEventListener('input', (event) => {
      state.code[state.active] = event.target.value;
      state.dirty = true;
      renderCodeMeta();
      scheduleRun();
      saveProject(true);
    });

    $('#code-input').addEventListener('keydown', handleEditorKeys);
    $('#code-input').addEventListener('scroll', syncScroll);
    $('#run-code').addEventListener('click', runProject);
    $('#save-code').addEventListener('click', () => saveProject(false));
    $('#download-code').addEventListener('click', downloadProject);
    $('#copy-code').addEventListener('click', copyActiveCode);
    $('#reset-code').addEventListener('click', resetProject);
    $('#format-code').addEventListener('click', formatActiveCode);
    $('#fullscreen-code').addEventListener('click', () => $('#project-ide').classList.toggle('fullscreen'));
    $('#clear-console').addEventListener('click', () => setConsole('Console geleert.', 'log'));
    $('#template-select').addEventListener('change', (event) => loadTemplate(event.target.value));
    window.addEventListener('message', handlePreviewMessage);
  }

  function renderEditor() {
    $$('.ide-tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.lang === state.active));
    const input = $('#code-input');
    input.value = state.code[state.active];
    input.setAttribute('aria-label', `${state.active.toUpperCase()} Editor`);
    renderHighlight();
    renderCodeMeta();
  }

  function renderCodeMeta() {
    const code = state.code[state.active];
    const lines = Math.max(1, code.split('\n').length);
    $('#line-numbers').innerHTML = Array.from({ length: lines }, (_, index) => index + 1).join('<br>');
    $('#editor-status').textContent = `${state.active.toUpperCase()} · ${lines} Zeilen · ${code.length} Zeichen`;
    renderHighlight();
  }

  function renderHighlight() {
    $('#highlight-layer').innerHTML = highlight(state.code[state.active], state.active);
    syncScroll();
  }

  function syncScroll() {
    const input = $('#code-input');
    $('#highlight-layer').scrollTop = input.scrollTop;
    $('#highlight-layer').scrollLeft = input.scrollLeft;
    $('#line-numbers').scrollTop = input.scrollTop;
  }

  function handleEditorKeys(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      saveProject(false);
    }
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      runProject();
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      const input = event.target;
      const start = input.selectionStart;
      input.value = `${input.value.slice(0, start)}  ${input.value.slice(input.selectionEnd)}`;
      input.selectionStart = input.selectionEnd = start + 2;
      input.dispatchEvent(new Event('input'));
    }
  }

  function scheduleRun() {
    window.clearTimeout(state.runTimer);
    state.runTimer = window.setTimeout(runProject, 350);
  }

  function runProject() {
    setConsole('Preview wird aktualisiert...', 'log');
    const frame = $('#preview-frame');
    const source = buildDocument();
    frame.srcdoc = source;
    $('#preview-status').textContent = `Ausgeführt um ${new Date().toLocaleTimeString('de-DE')}`;
  }

  function buildDocument() {
    const bridge = `
      <script>
        ['log','warn','error'].forEach(function(type) {
          var original = console[type];
          console[type] = function() {
            parent.postMessage({ source: 'codelearn-preview', type: type, message: Array.from(arguments).map(String).join(' ') }, '*');
            original.apply(console, arguments);
          };
        });
        window.addEventListener('error', function(event) {
          parent.postMessage({ source: 'codelearn-preview', type: 'error', message: event.message + ' · Zeile ' + event.lineno }, '*');
        });
      <\/script>`;

    return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>${state.code.css}</style>
</head>
<body>
${state.code.html}
${bridge}
<script>
try {
${state.code.js}
} catch (error) {
  console.error(error.message);
}
<\/script>
</body>
</html>`;
  }

  function handlePreviewMessage(event) {
    if (!event.data || event.data.source !== 'codelearn-preview') return;
    appendConsole(event.data.message, event.data.type);
  }

  function appendConsole(message, type = 'log') {
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    line.textContent = `[${type}] ${message}`;
    $('#console-output').appendChild(line);
    $('#console-output').scrollTop = $('#console-output').scrollHeight;
  }

  function setConsole(message, type) {
    $('#console-output').innerHTML = '';
    appendConsole(message, type);
  }

  function saveProject(isAuto) {
    const payload = {
      name: $('#project-name').value || 'CodeLearn Projekt',
      code: state.code,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    $('#save-status').textContent = isAuto ? 'Auto Save aktiv' : 'Gespeichert';
    state.dirty = false;
  }

  function loadSavedProject() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || !saved.code) return false;
      state.code = Object.assign({ html: '', css: '', js: '' }, saved.code);
      $('#project-name').value = saved.name || 'CodeLearn Projekt';
      $('#save-status').textContent = 'Projekt geladen';
      return true;
    } catch {
      return false;
    }
  }

  function loadTemplate(key) {
    const template = TEMPLATES[key] || TEMPLATES.starter;
    state.code = { html: template.html, css: template.css, js: template.js };
    $('#project-name').value = template.name;
    renderEditor();
    runProject();
    saveProject(true);
  }

  function resetProject() {
    loadTemplate('starter');
    setConsole('Projekt zurückgesetzt.', 'log');
  }

  async function copyActiveCode() {
    await navigator.clipboard.writeText(state.code[state.active]);
    $('#save-status').textContent = `${state.active.toUpperCase()} kopiert`;
  }

  function downloadProject() {
    const name = ($('#project-name').value || 'codelearn-projekt').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const blob = new Blob([buildDocument()], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${name || 'codelearn-projekt'}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function formatActiveCode() {
    const lang = state.active;
    state.code[lang] = simpleFormat(state.code[lang], lang);
    renderEditor();
    scheduleRun();
    saveProject(true);
  }

  function simpleFormat(code, lang) {
    if (lang === 'css') return code.replace(/\s*{\s*/g, ' {\n  ').replace(/;\s*/g, ';\n  ').replace(/\s*}\s*/g, '\n}\n\n').trim();
    if (lang === 'js') return code.replace(/;\s*/g, ';\n').replace(/\{\s*/g, '{\n  ').replace(/\s*\}\s*/g, '\n}\n').trim();
    return code.replace(/></g, '>\n<').trim();
  }

  function highlight(code, lang) {
    let html = escapeHtml(code);
    if (lang === 'html') {
      html = html
        .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="tok-comment">$1</span>')
        .replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="tok-tag">$2</span>')
        .replace(/\s([\w:-]+)=/g, ' <span class="tok-attr">$1</span>=')
        .replace(/(&quot;.*?&quot;|&#039;.*?&#039;)/g, '<span class="tok-string">$1</span>');
    } else if (lang === 'css') {
      html = html
        .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="tok-comment">$1</span>')
        .replace(/([\w-]+)(?=\s*:)/g, '<span class="tok-prop">$1</span>')
        .replace(/(:\s*)([^;{}]+)/g, '$1<span class="tok-string">$2</span>');
    } else {
      html = html
        .replace(/(\/\/.*)/g, '<span class="tok-comment">$1</span>')
        .replace(/\b(const|let|var|function|return|if|else|try|catch|new|class|await|async)\b/g, '<span class="tok-keyword">$1</span>')
        .replace(/(&quot;.*?&quot;|&#039;.*?&#039;|`.*?`)/g, '<span class="tok-string">$1</span>');
    }
    return `${html}\n`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char]));
  }
})();
