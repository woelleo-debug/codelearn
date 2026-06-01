(() => {
  'use strict';

  const DATA_URL = 'quiz-data.json';
  const STATS_KEY = 'codelearn_quiz_stats';
  const FALLBACK_QUESTIONS = [
    {
      id: 'fallback-1',
      category: 'HTML Grundlagen',
      difficulty: 'leicht',
      question: 'Welches Element ist das Wurzelelement einer HTML-Seite?',
      options: ['<head>', '<html>', '<body>', '<root>'],
      correct: 1,
      points: 10,
      explanation: 'Das <html>-Element umschließt head und body.'
    },
    {
      id: 'fallback-2',
      category: 'CSS Grundlagen',
      difficulty: 'leicht',
      question: 'Welche CSS-Eigenschaft ändert die Textfarbe?',
      options: ['text-color', 'font-color', 'color', 'paint'],
      correct: 2,
      points: 10,
      explanation: 'Die Eigenschaft color steuert die Textfarbe.'
    },
    {
      id: 'fallback-3',
      category: 'CSS Flexbox',
      difficulty: 'mittel',
      question: 'Welcher Wert aktiviert Flexbox?',
      options: ['display: grid', 'display: flex', 'layout: flex', 'flex: true'],
      correct: 1,
      points: 15,
      explanation: 'display: flex aktiviert das Flexbox-Layout für den Container.'
    }
  ];

  const state = {
    questions: [],
    pool: [],
    index: 0,
    selected: [],
    score: 0,
    correct: 0,
    mode: 'normal',
    category: 'all',
    difficulty: 'all',
    answered: false,
    timer: null,
    timeLeft: 0,
    autoNext: false,
    startedAt: 0
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  document.addEventListener('DOMContentLoaded', async () => {
    const page = document.body.dataset.quizPage;
    if (!page) return;

    state.questions = await loadQuestions();
    if (page === 'menu') initMenu();
    if (page === 'play') initPlay();
  });

  async function loadQuestions() {
    try {
      const response = await fetch(DATA_URL, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return normalizeQuestions(data.questions || []);
    } catch (error) {
      console.warn('Quiz-Daten konnten nicht geladen werden, Fallback wird genutzt.', error);
      return normalizeQuestions(FALLBACK_QUESTIONS);
    }
  }

  function normalizeQuestions(questions) {
    return questions
      .filter((q) => q && q.question && Array.isArray(q.options) && Number.isInteger(q.correct))
      .filter((q) => q.correct >= 0 && q.correct < q.options.length)
      .map((q, index) => ({
        id: q.id || index + 1,
        category: decodeText(q.category || 'Allgemein'),
        difficulty: decodeText(q.difficulty || 'leicht'),
        question: decodeText(q.question),
        options: q.options.map(decodeText),
        correct: q.correct,
        points: Number(q.points) || difficultyPoints(q.difficulty),
        explanation: decodeText(q.explanation || 'Merke dir die richtige Antwort und versuche es bei der nächsten Frage erneut.')
      }));
  }

  function decodeText(value) {
    const text = String(value);
    try {
      return decodeURIComponent(escape(text));
    } catch {
      return text;
    }
  }

  function initMenu() {
    fillSelect('#quiz-category', unique(state.questions.map((q) => q.category)), 'Alle Kategorien');
    updateMenuStats();
    $('#quiz-start-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const params = new URLSearchParams({
        mode: $('#quiz-mode').value,
        category: $('#quiz-category').value,
        difficulty: $('#quiz-difficulty').value,
        count: $('#quiz-count').value
      });
      window.location.href = `quiz-play.html?${params.toString()}`;
    });
  }

  function fillSelect(selector, values, firstLabel) {
    const select = $(selector);
    if (!select) return;
    select.innerHTML = `<option value="all">${firstLabel}</option>` + values
      .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
      .join('');
  }

  function updateMenuStats() {
    const stats = readStats();
    $('#quiz-total-xp').textContent = stats.xp;
    $('#quiz-best-score').textContent = `${stats.bestPercent}%`;
    $('#quiz-total-runs').textContent = stats.runs;
    $('#quiz-question-count').textContent = state.questions.length;
  }

  function initPlay() {
    const params = new URLSearchParams(window.location.search);
    state.mode = params.get('mode') || 'normal';
    state.category = params.get('category') || 'all';
    state.difficulty = params.get('difficulty') || 'all';
    state.count = Math.max(1, Math.min(100, parseInt(params.get('count')) || 15));
    state.autoNext = state.mode === 'time';
    state.pool = buildQuestionPool();
    state.selected = new Array(state.pool.length).fill(null);
    state.startedAt = Date.now();

    if (!state.pool.length) {
      state.pool = state.questions.slice(0, 5);
      state.selected = new Array(state.pool.length).fill(null);
    }

    $('#quiz-prev')?.addEventListener('click', previousQuestion);
    $('#quiz-next')?.addEventListener('click', nextQuestion);
    $('#quiz-finish')?.addEventListener('click', finishQuiz);
    $('#quiz-restart')?.addEventListener('click', restartQuiz);
    $('#quiz-new')?.addEventListener('click', () => { window.location.href = 'quiz.html'; });

    $('#quiz-mode-label').textContent = modeLabel(state.mode);
    $('#quiz-filter-label').textContent = filterLabel();
    renderQuestion();
  }

  function buildQuestionPool() {
    let pool = state.questions.slice();
    if (state.category !== 'all') pool = pool.filter((q) => q.category === state.category);
    if (state.difficulty !== 'all') pool = pool.filter((q) => q.difficulty === state.difficulty);

    pool = shuffle(pool);
    if (state.mode === 'hardcore') pool = pool.filter((q) => q.difficulty === 'schwer');
    return pool.slice(0, state.count);
  }

  function renderQuestion() {
    stopTimer();
    const question = state.pool[state.index];
    state.answered = state.selected[state.index] !== null;

    $('#quiz-question-number').textContent = `Frage ${state.index + 1} von ${state.pool.length}`;
    $('#quiz-question-text').textContent = question.question;
    $('#quiz-score').textContent = state.score;
    $('#quiz-correct').textContent = `${state.correct}/${state.pool.length}`;
    $('#quiz-progress-text').textContent = `${Math.round(((state.index) / state.pool.length) * 100)}%`;
    $('#quiz-progress-fill').style.width = `${((state.index) / state.pool.length) * 100}%`;
    $('#quiz-difficulty').textContent = question.difficulty;
    $('#quiz-category').textContent = question.category;
    $('#quiz-explanation').classList.toggle('show', state.answered);
    $('#quiz-explanation').textContent = state.answered ? question.explanation : '';

    const selected = state.selected[state.index];
    $('#quiz-options').innerHTML = question.options.map((option, index) => {
      const classes = ['quiz-option'];
      if (state.answered) {
        classes.push('locked');
        if (index === question.correct) classes.push('correct');
        if (index === selected && index !== question.correct) classes.push('incorrect');
      }
      return `
        <button class="${classes.join(' ')}" type="button" data-index="${index}">
          <span class="quiz-option-letter">${String.fromCharCode(65 + index)}</span>
          <span>${escapeHtml(option)}</span>
        </button>`;
    }).join('');

    $$('#quiz-options .quiz-option').forEach((button) => {
      button.addEventListener('click', () => selectAnswer(Number(button.dataset.index)));
    });

    updateButtons();
    if (state.mode === 'time' && !state.answered) startTimer(30);
  }

  function updateButtons() {
    const prev = $('#quiz-prev');
    const next = $('#quiz-next');
    const finish = $('#quiz-finish');
    if (!prev || !next || !finish) return;

    prev.style.display = state.index > 0 ? 'inline-flex' : 'none';
    next.style.display = state.answered && state.index < state.pool.length - 1 ? 'inline-flex' : 'none';
    finish.style.display = state.answered && state.index === state.pool.length - 1 ? 'inline-flex' : 'none';
  }

  function selectAnswer(index) {
    if (state.answered) return;
    stopTimer();

    const question = state.pool[state.index];
    const isCorrect = index === question.correct;
    state.selected[state.index] = index;
    state.answered = true;

    if (isCorrect) {
      state.correct += 1;
      state.score += question.points + timerBonus();
    }

    renderQuestion();
    $('#quiz-progress-fill').style.width = `${((state.index + 1) / state.pool.length) * 100}%`;
    $('#quiz-progress-text').textContent = `${Math.round(((state.index + 1) / state.pool.length) * 100)}%`;

    if (state.autoNext && state.index < state.pool.length - 1) {
      window.setTimeout(nextQuestion, 950);
    }
  }

  function startTimer(seconds) {
    state.timeLeft = seconds;
    $('#quiz-timer-wrap').style.display = 'inline-flex';
    updateTimer();
    state.timer = window.setInterval(() => {
      state.timeLeft -= 1;
      updateTimer();
      if (state.timeLeft <= 0) {
        stopTimer();
        selectAnswer(-1);
      }
    }, 1000);
  }

  function stopTimer() {
    if (state.timer) window.clearInterval(state.timer);
    state.timer = null;
  }

  function updateTimer() {
    const timer = $('#quiz-timer');
    timer.textContent = `${Math.max(0, state.timeLeft)}s`;
    timer.classList.toggle('timer-danger', state.timeLeft <= 5);
  }

  function timerBonus() {
    if (state.mode !== 'time') return 0;
    return Math.max(0, Math.round(state.timeLeft / 3));
  }

  function previousQuestion() {
    if (state.index <= 0) return;
    state.index -= 1;
    renderQuestion();
  }

  function nextQuestion() {
    if (state.index >= state.pool.length - 1) return;
    state.index += 1;
    renderQuestion();
  }

  function finishQuiz() {
    stopTimer();
    const percent = Math.round((state.correct / state.pool.length) * 100);
    const xp = Math.max(5, Math.round(state.score / 2 + percent / 4));
    const stats = readStats();
    const oldLevel = Math.floor(stats.xp / 500) + 1;

    stats.runs += 1;
    stats.totalScore += state.score;
    stats.xp += xp;
    stats.bestPercent = Math.max(stats.bestPercent, percent);
    stats.lastRun = new Date().toISOString();
    const newLevel = Math.floor(stats.xp / 500) + 1;
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));

    $('#quiz-play-area').style.display = 'none';
    $('#quiz-results').style.display = 'block';
    $('#result-score').textContent = `${percent}%`;
    $('#result-message').textContent = resultMessage(percent);
    $('#result-correct').textContent = `${state.correct}/${state.pool.length}`;
    $('#result-points').textContent = state.score;
    $('#result-xp').textContent = `+${xp}`;
    $('#result-level').textContent = newLevel > oldLevel ? `Level ${newLevel}` : `Level ${newLevel}`;
  }

  function restartQuiz() {
    state.index = 0;
    state.score = 0;
    state.correct = 0;
    state.selected = new Array(state.pool.length).fill(null);
    $('#quiz-play-area').style.display = 'block';
    $('#quiz-results').style.display = 'none';
    renderQuestion();
  }

  function readStats() {
    try {
      return Object.assign({ xp: 0, runs: 0, totalScore: 0, bestPercent: 0 }, JSON.parse(localStorage.getItem(STATS_KEY)) || {});
    } catch {
      return { xp: 0, runs: 0, totalScore: 0, bestPercent: 0 };
    }
  }

  function difficultyPoints(difficulty) {
    return difficulty === 'schwer' ? 30 : difficulty === 'mittel' ? 20 : 10;
  }

  function resultMessage(percent) {
    if (percent >= 90) return 'Starkes Ergebnis. Du beherrschst die Themen sehr sicher.';
    if (percent >= 75) return 'Sehr gut. Ein paar Details nachschärfen und du bist richtig stabil.';
    if (percent >= 55) return 'Solide Basis. Wiederhole die markierten Themen und starte direkt nochmal.';
    return 'Guter Start. Geh die Grundlagen noch einmal durch und sammle beim nächsten Lauf mehr XP.';
  }

  function modeLabel(mode) {
    return {
      normal: 'Normal',
      time: 'Zeitmodus',
      hardcore: 'Hardcore',
      daily: 'Daily',
      exam: 'Prüfung'
    }[mode] || 'Normal';
  }

  function filterLabel() {
    const parts = [];
    if (state.category !== 'all') parts.push(state.category);
    if (state.difficulty !== 'all') parts.push(state.difficulty);
    return parts.length ? parts.join(' · ') : 'Alle Themen';
  }

  function unique(values) {
    return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'de'));
  }

  function shuffle(items) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
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
