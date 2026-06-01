/**
 * CodeLearn - Haupt-JavaScript
 * Interaktivität für die gesamte Lernplattform
 */

'use strict';

/* ============================================
   Futuristischer Loader
   ============================================ */
function initLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('hidden');
      document.body.style.overflow = '';
    }, 1500);
  });

  // Fallback: nach 3s immer ausblenden
  setTimeout(() => {
    if (loader) loader.classList.add('hidden');
    document.body.style.overflow = '';
  }, 3000);
}

/* ============================================
   Reading Progress Bar
   ============================================ */
function initProgressBar() {
  const bar = document.getElementById('progress-bar');
  if (!bar) return;

  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = Math.min(progress, 100) + '%';
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
}

/* ============================================
   Sticky Navbar
   ============================================ */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  function handleScroll() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/* ============================================
   Mobile Menu Toggle
   ============================================ */
function initMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('open');
    document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
  });

  // Schließen bei Link-Klick
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Schließen bei Klick außerhalb
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

/* ============================================
   Active Navigation Highlighting
   ============================================ */
function initActiveNav() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

/* ============================================
   Intersection Observer (Scroll Animations)
   ============================================ */
function initScrollAnimations() {
  const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  elements.forEach(el => observer.observe(el));
}

/* ============================================
   Copy Code Button
   ============================================ */
function initCopyButtons() {
  // Automatisch Copy-Buttons zu allen Code-Blöcken hinzufügen
  document.querySelectorAll('.code-block-wrapper').forEach(wrapper => {
    const header = wrapper.querySelector('.code-block-header');
    if (!header) return;

    // Prüfen ob bereits ein Button vorhanden
    if (header.querySelector('.copy-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.innerHTML = '📋 Kopieren';
    btn.setAttribute('aria-label', 'Code kopieren');
    header.appendChild(btn);
  });

  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const wrapper = btn.closest('.code-block-wrapper');
      const pre = wrapper ? wrapper.querySelector('pre') : null;
      if (!pre) return;

      const text = pre.innerText || pre.textContent;

      try {
        await navigator.clipboard.writeText(text);
        btn.innerHTML = '✅ Kopiert!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.innerHTML = '📋 Kopieren';
          btn.classList.remove('copied');
        }, 2000);
      } catch {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        btn.innerHTML = '✅ Kopiert!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.innerHTML = '📋 Kopieren';
          btn.classList.remove('copied');
        }, 2000);
      }
    });
  });
}

/* ============================================
   Scroll-to-top Button
   ============================================ */
function initScrollTop() {
  const btn = document.getElementById('scroll-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ============================================
   Accordion
   ============================================ */
function initAccordions() {
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.accordion-item');
      const isOpen = item.classList.contains('open');

      // Alle schließen (optional: nur eines offen)
      // item.closest('.accordion').querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));

      item.classList.toggle('open', !isOpen);
    });
  });
}

/* ============================================
   Tabs
   ============================================ */
function initTabs() {
  document.querySelectorAll('.tabs-container').forEach(container => {
    const buttons = container.querySelectorAll('.tab-btn');
    const contents = container.querySelectorAll('.tab-content');

    buttons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        if (contents[index]) contents[index].classList.add('active');
      });
    });

    // Ersten Tab aktivieren
    if (buttons[0]) buttons[0].classList.add('active');
    if (contents[0]) contents[0].classList.add('active');
  });
}

/* ============================================
   Animierte Zahlen (Counter)
   ============================================ */
function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-target') || el.textContent, 10);
  if (isNaN(target)) return;

  const duration = 2000;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = Math.round(eased * target);
    el.textContent = current.toLocaleString('de-DE') + (el.getAttribute('data-suffix') || '');
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

function initCounters() {
  const counters = document.querySelectorAll('.counter');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => observer.observe(counter));
}

/* ============================================
   Sidebar Active Link (für Content-Seiten)
   ============================================ */
function initSidebarHighlight() {
  const sections = document.querySelectorAll('.content-section[id]');
  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  if (!sections.length || !sidebarLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        sidebarLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });

  sections.forEach(section => observer.observe(section));
}

/* ============================================
   Tag/HTML-Tags Suchfunktion
   ============================================ */
function initTagSearch() {
  const searchInput = document.getElementById('tag-search');
  if (!searchInput) return;

  const items = document.querySelectorAll('.tag-item, .searchable');

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();
    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(query) ? '' : 'none';
    });
  });
}

/* ============================================
   Quiz Funktionalität
   ============================================ */
const quizData = [
  {
    question: "Welches HTML-Tag wird für die größte Überschrift verwendet?",
    options: ["<h6>", "<h1>", "<header>", "<title>"],
    correct: 1,
    explanation: "<h1> ist die größte Überschrift. Es gibt h1 bis h6, wobei h1 am wichtigsten ist."
  },
  {
    question: "Welches Attribut macht einen Link in einem neuen Tab öffnen?",
    options: ['rel="noopener"', 'href="#new"', 'target="_blank"', 'open="true"'],
    correct: 2,
    explanation: 'target="_blank" öffnet den Link in einem neuen Browser-Tab.'
  },
  {
    question: "Was bedeutet CSS?",
    options: ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style System", "Coded Style Syntax"],
    correct: 1,
    explanation: "CSS steht für Cascading Style Sheets – es beschreibt das Aussehen von HTML-Elementen."
  },
  {
    question: "Welche CSS-Eigenschaft ändert die Textfarbe?",
    options: ["text-color", "font-color", "color", "foreground"],
    correct: 2,
    explanation: "Die CSS-Eigenschaft 'color' setzt die Textfarbe eines Elements."
  },
  {
    question: "Welches HTML-Tag wird für ungeordnete Listen verwendet?",
    options: ["<ol>", "<li>", "<list>", "<ul>"],
    correct: 3,
    explanation: "<ul> steht für 'unordered list'. <ol> ist für geordnete (nummerierte) Listen."
  },
  {
    question: "Wie schreibt man einen CSS-Kommentar?",
    options: ["// Kommentar", "<!-- Kommentar -->", "/* Kommentar */", "# Kommentar"],
    correct: 2,
    explanation: "CSS-Kommentare werden mit /* ... */ geschrieben. HTML-Kommentare nutzen <!-- -->."
  },
  {
    question: "Welche CSS-Eigenschaft macht ein Element unsichtbar, behält aber den Platz?",
    options: ["display: none", "opacity: 0", "visibility: hidden", "hidden: true"],
    correct: 2,
    explanation: "visibility: hidden versteckt das Element, behält aber seinen Platz. display: none entfernt es komplett."
  },
  {
    question: "Was ist der korrekte HTML-Tag für einen Hyperlink?",
    options: ["<link>", "<a>", "<href>", "<url>"],
    correct: 1,
    explanation: "<a> (Anchor) ist der HTML-Tag für Hyperlinks. Das href-Attribut gibt das Ziel an."
  },
  {
    question: "Welche CSS-Einheit ist relativ zur Schriftgröße des Elternelements?",
    options: ["px", "rem", "em", "vh"],
    correct: 2,
    explanation: "em ist relativ zur Schriftgröße des Elternelements. rem ist relativ zur Root-Schriftgröße."
  },
  {
    question: "Welches HTML-Attribut gibt einem Bild einen alternativen Text?",
    options: ["title", "src", "alt", "description"],
    correct: 2,
    explanation: "Das alt-Attribut gibt einen alternativen Text für Bilder an – wichtig für Barrierefreiheit."
  },
  {
    question: "Welche CSS-Eigenschaft wird für Flexbox verwendet?",
    options: ["display: grid", "display: flex", "layout: flex", "flex: true"],
    correct: 1,
    explanation: "display: flex aktiviert Flexbox auf einem Container-Element."
  },
  {
    question: "Was macht das HTML-Tag <br>?",
    options: ["Erstellt einen Button", "Fügt einen Zeilenumbruch ein", "Macht Text fett", "Erstellt eine Trennlinie"],
    correct: 1,
    explanation: "<br> fügt einen Zeilenumbruch (line break) in den Text ein."
  },
  {
    question: "Welche CSS-Eigenschaft setzt den Außenabstand eines Elements?",
    options: ["padding", "spacing", "margin", "border"],
    correct: 2,
    explanation: "margin setzt den Außenabstand. padding setzt den Innenabstand zwischen Inhalt und Border."
  },
  {
    question: "Welches HTML-Tag definiert den Hauptinhalt einer Seite?",
    options: ["<content>", "<body>", "<main>", "<section>"],
    correct: 2,
    explanation: "<main> kennzeichnet den Hauptinhalt der Seite. Es sollte nur einmal pro Seite verwendet werden."
  },
  {
    question: "Wie wählt man in CSS alle Elemente mit der Klasse 'box' aus?",
    options: ["#box", ".box", "box", "*box"],
    correct: 1,
    explanation: ".box wählt alle Elemente mit class='box' aus. # ist für IDs, kein Präfix für Tag-Namen."
  }
];

let currentQuestion = 0;
let score = 0;
let answered = false;
let userAnswers = [];

function initQuiz() {
  const quizContainer = document.getElementById('quiz-container');
  if (!quizContainer) return;

  renderQuestion();
}

function renderQuestion() {
  const container = document.getElementById('quiz-container');
  if (!container) return;

  if (currentQuestion >= quizData.length) {
    showResults();
    return;
  }

  const q = quizData[currentQuestion];
  const progress = ((currentQuestion) / quizData.length) * 100;

  container.innerHTML = `
    <div class="quiz-progress-bar">
      <div class="quiz-progress-fill" style="width: ${progress}%"></div>
    </div>
    <div class="quiz-question-card reveal">
      <div class="quiz-question-number">Frage ${currentQuestion + 1} von ${quizData.length}</div>
      <div class="quiz-question-text">${q.question}</div>
      <div class="quiz-options">
        ${q.options.map((opt, i) => `
          <div class="quiz-option" data-index="${i}" role="button" tabindex="0" aria-label="Antwort ${String.fromCharCode(65+i)}: ${opt}">
            <span class="quiz-option-letter">${String.fromCharCode(65+i)}</span>
            <span>${opt}</span>
          </div>
        `).join('')}
      </div>
      <div class="quiz-feedback" id="quiz-feedback"></div>
    </div>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem;">
      <span style="font-size:0.85rem; color:var(--text-muted);">Punkte: ${score}/${currentQuestion}</span>
      <button class="btn btn-primary btn-sm" id="next-btn" style="display:none;" onclick="nextQuestion()">
        ${currentQuestion + 1 < quizData.length ? 'Nächste Frage →' : 'Ergebnis anzeigen 🏆'}
      </button>
    </div>
  `;

  answered = false;

  container.querySelectorAll('.quiz-option').forEach(option => {
    option.addEventListener('click', () => selectAnswer(parseInt(option.dataset.index)));
    option.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') selectAnswer(parseInt(option.dataset.index));
    });
  });

  // Scroll-Animation
  setTimeout(() => container.querySelector('.reveal')?.classList.add('revealed'), 50);
}

function selectAnswer(index) {
  if (answered) return;
  answered = true;

  const q = quizData[currentQuestion];
  const options = document.querySelectorAll('.quiz-option');
  const feedback = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('next-btn');

  userAnswers.push(index);

  options.forEach((opt, i) => {
    if (i === q.correct) opt.classList.add('correct');
    else if (i === index && index !== q.correct) opt.classList.add('wrong');
  });

  if (index === q.correct) {
    score++;
    feedback.className = 'quiz-feedback correct-feedback show';
    feedback.innerHTML = `✅ <strong>Richtig!</strong> ${q.explanation}`;
  } else {
    feedback.className = 'quiz-feedback wrong-feedback show';
    feedback.innerHTML = `❌ <strong>Falsch.</strong> ${q.explanation}`;
  }

  if (nextBtn) nextBtn.style.display = 'inline-flex';
}

function nextQuestion() {
  currentQuestion++;
  renderQuestion();
}

function showResults() {
  const container = document.getElementById('quiz-container');
  if (!container) return;

  const percentage = Math.round((score / quizData.length) * 100);
  let emoji, message;

  if (percentage >= 90) { emoji = '🏆'; message = 'Ausgezeichnet! Du bist ein HTML/CSS-Profi!'; }
  else if (percentage >= 70) { emoji = '🎉'; message = 'Sehr gut! Du hast solide Kenntnisse.'; }
  else if (percentage >= 50) { emoji = '👍'; message = 'Gut gemacht! Noch etwas Übung und du wirst ein Profi.'; }
  else { emoji = '📚'; message = 'Weiter lernen! Schau dir die Grundlagen nochmal an.'; }

  container.innerHTML = `
    <div class="quiz-score-card reveal">
      <div style="font-size:4rem; margin-bottom:1rem;">${emoji}</div>
      <div class="quiz-score-number">${percentage}%</div>
      <div class="quiz-score-label">${score} von ${quizData.length} Fragen richtig</div>
      <p style="color:var(--text-secondary); margin-bottom:2rem;">${message}</p>
      <div style="display:flex; gap:1rem; justify-content:center; flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="restartQuiz()">🔄 Nochmal versuchen</button>
        <a href="html-grundlagen.html" class="btn btn-secondary">📖 Weiter lernen</a>
      </div>
    </div>
  `;

  setTimeout(() => container.querySelector('.reveal')?.classList.add('revealed'), 50);
}

function restartQuiz() {
  currentQuestion = 0;
  score = 0;
  answered = false;
  userAnswers = [];
  renderQuestion();
}

// Global verfügbar machen
window.nextQuestion = nextQuestion;
window.restartQuiz = restartQuiz;

/* ============================================
   Smooth Scroll für Anker-Links
   ============================================ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const offset = 90; // Navbar-Höhe
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ============================================
   Tooltip Initialisierung
   ============================================ */
function initTooltips() {
  // Tooltips werden rein per CSS gehandhabt (data-tooltip Attribut)
  // Hier nur für dynamisch hinzugefügte Elemente
}

/* ============================================
   Prism.js Code Highlighting nachladen
   ============================================ */
function initPrism() {
  if (typeof Prism !== 'undefined') {
    Prism.highlightAll();
  }
}

/* ============================================
   Kontaktformular
   ============================================ */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    const originalText = btn.innerHTML;

    btn.innerHTML = '⏳ Wird gesendet...';
    btn.disabled = true;

    // Simulierte Verarbeitung
    setTimeout(() => {
      btn.innerHTML = '✅ Nachricht gesendet!';
      btn.style.background = 'linear-gradient(135deg, var(--accent-green), var(--accent-cyan))';
      form.reset();

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        btn.style.background = '';
      }, 3000);
    }, 1500);
  });
}

/* ============================================
   Initialisierung aller Features
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initProgressBar();
  initNavbar();
  initMobileMenu();
  initActiveNav();
  initScrollAnimations();
  initCopyButtons();
  initScrollTop();
  initAccordions();
  initTabs();
  initCounters();
  initSidebarHighlight();
  initTagSearch();
  initQuiz();
  initSmoothScroll();
  initTooltips();
  initContactForm();
  initPrism();

  // Body overflow zurücksetzen (falls Loader es gesetzt hat)
  document.body.style.overflow = '';
});

// Prism nach vollständigem Laden nochmal aufrufen
window.addEventListener('load', () => {
  initPrism();
  initCopyButtons(); // Nochmal für dynamisch geladene Inhalte
});
