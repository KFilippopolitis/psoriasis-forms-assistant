const STORAGE_KEY = 'psoriasis-pdf-quiz.answers.v1';
const IS_STATIC = document.documentElement.dataset.static === 'true';

let forms = [];
let questions = [];
let visibleQuestions = [];
let answers = {};
let currentIndex = 0;

const elements = {
  sidebar: document.querySelector('#sidebar'),
  menuButton: document.querySelector('#menu-button'),
  menuOverlay: document.querySelector('#menu-overlay'),
  draftStatus: document.querySelector('#draft-status'),
  formNav: document.querySelector('#form-nav'),
  mobileFormTitle: document.querySelector('#mobile-form-title'),
  mobileProgressLabel: document.querySelector('#mobile-progress-label'),
  formTitle: document.querySelector('#form-title'),
  formDescription: document.querySelector('#form-description'),
  questionLabel: document.querySelector('#question-label'),
  questionPrompt: document.querySelector('#question-prompt'),
  progressLabel: document.querySelector('#progress-label'),
  progressFill: document.querySelector('#progress-fill'),
  controlHost: document.querySelector('#control-host'),
  answerHint: document.querySelector('#answer-hint'),
  questionForm: document.querySelector('#question-form'),
  errorMessage: document.querySelector('#error-message'),
  backButton: document.querySelector('#back-button'),
  clearButton: document.querySelector('#clear-button'),
  clearButtonMobile: document.querySelector('#clear-button-mobile'),
  nextButton: document.querySelector('#next-button'),
  generateButton: document.querySelector('#generate-button'),
  resultPanel: document.querySelector('#result-panel'),
  resultLinks: document.querySelector('#result-links'),
};

const PEST_JOINT_HOTSPOTS = {
  neck: { x: 51.5, y: 20 },
  left_shoulder: { x: 36.5, y: 23 },
  right_shoulder: { x: 66, y: 23 },
  upper_back: { x: 51.5, y: 32},
  waist: { x: 51.5, y: 44 },
  lower_back: { x: 39.4, y: 46.4 },
  left_elbow: { x: 28, y: 33 },
  right_elbow: { x: 75, y: 33 },
  left_wrist: { x: 23, y: 48.5 },
  right_wrist: { x: 80, y: 48.5 },
  left_hand: { x: 23, y: 52.7 },
  right_hand: { x: 80, y: 52.8 },
  left_hip: { x: 47, y: 55.2 },
  right_hip: { x: 56, y: 55.2 },
  left_thumb: { x: 28, y: 55 },
  right_thumb: { x: 75, y: 55 },
  left_knee: { x: 45.0, y: 69.1 },
  right_knee: { x: 57, y: 69.1 },
  left_ankle: { x: 45, y: 85 },
  right_ankle: { x: 57, y: 85 },
  left_foot: { x: 40, y: 89.9 },
  right_foot: { x: 62, y: 89.9 },
};

function loadDraft() {
  try {
    answers = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    answers = {};
  }
}

function pruneDraft() {
  const validQuestionIds = new Set(questions.map((question) => question.id));
  let changed = false;
  answers = Object.fromEntries(Object.entries(answers).filter(([id]) => {
    const keep = validQuestionIds.has(id);
    if (!keep) changed = true;
    return keep;
  }));
  if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
}

function saveDraft() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  elements.draftStatus.textContent = `Αποθηκεύτηκε προσχέδιο ${new Date().toLocaleTimeString('el-GR')}`;
}

function isVisible(question) {
  if (!question.showIf) return true;
  return String(answers[question.showIf.id] ?? '') === String(question.showIf.value);
}

function rebuildVisibleQuestions() {
  visibleQuestions = questions.filter(isVisible);
  if (currentIndex >= visibleQuestions.length) {
    currentIndex = Math.max(0, visibleQuestions.length - 1);
  }
}

function answerValue(question) {
  return answers[question.id];
}

function isAnswered(question) {
  const value = answerValue(question);
  if (question.type === 'multi') return !question.required || (Array.isArray(value) && value.length > 0);
  return !question.required || (value !== undefined && value !== null && String(value).trim() !== '');
}

function formProgress(formId) {
  const list = questions.filter((question) => question.formId === formId && isVisible(question) && question.required);
  const answered = list.filter(isAnswered).length;
  const percent = list.length ? Math.round((answered / list.length) * 100) : 0;
  return { answered, total: list.length, percent };
}

function allVisibleQuestionsAnswered() {
  return visibleQuestions.length > 0 && visibleQuestions.every(isAnswered);
}

function closeMenu() {
  elements.sidebar.classList.remove('is-open');
  elements.menuOverlay.hidden = true;
  elements.menuButton.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
}

function openMenu() {
  elements.sidebar.classList.add('is-open');
  elements.menuOverlay.hidden = false;
  elements.menuButton.setAttribute('aria-expanded', 'true');
  document.body.classList.add('menu-open');
}

function toggleMenu() {
  if (elements.sidebar.classList.contains('is-open')) closeMenu();
  else openMenu();
}

function updateGenerateState() {
  const complete = allVisibleQuestionsAnswered();
  elements.generateButton.disabled = !complete;
  elements.generateButton.title = complete ? '' : 'Ολοκληρώστε όλες τις ερωτήσεις πριν τη δημιουργία PDF.';
}

function renderNav() {
  elements.formNav.innerHTML = '';
  for (const form of forms) {
    const progress = formProgress(form.id);
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'nav-item';
    item.setAttribute('role', 'listitem');

    const active = visibleQuestions[currentIndex]?.formId === form.id;
    if (active) item.classList.add('active');
    if (progress.total > 0 && progress.answered === progress.total) item.classList.add('complete');

    item.innerHTML = `
      <div class="nav-item__row">
        <span>${form.title}</span>
        <span>${progress.answered}/${progress.total}</span>
      </div>
      <div class="nav-item__track" aria-hidden="true">
        <div class="nav-item__fill" style="width: ${progress.percent}%"></div>
      </div>
    `;
    item.addEventListener('click', () => {
      const target = visibleQuestions.findIndex((question) => question.formId === form.id);
      if (target >= 0) {
        currentIndex = target;
        closeMenu();
        render();
      }
    });
    elements.formNav.append(item);
  }
}

function clearControl() {
  elements.controlHost.innerHTML = '';
  elements.errorMessage.textContent = '';
}

function setAnswer(question, value) {
  answers[question.id] = value;
  for (const dependent of questions.filter((item) => item.showIf?.id === question.id)) {
    if (!isVisible(dependent)) delete answers[dependent.id];
  }
  saveDraft();
  rebuildVisibleQuestions();
  renderNav();
  updateGenerateState();
}

function advanceAfterAnswer(question, value) {
  setAnswer(question, value);
  if (!validateCurrent()) {
    render();
    return;
  }
  if (currentIndex < visibleQuestions.length - 1) {
    currentIndex += 1;
  }
  render();
}

function bindDoubleClickAdvance(label, input, question, value) {
  label.addEventListener('dblclick', (event) => {
    event.preventDefault();
    input.checked = true;
    advanceAfterAnswer(question, value);
  });
}

function renderChoice(question) {
  const wrap = document.createElement('div');
  wrap.className = question.type === 'scale' ? 'scale-list' : 'choice-list';
  const value = answerValue(question);

  for (const option of question.options) {
    const label = document.createElement('label');
    label.className = question.type === 'scale' ? '' : 'choice-option';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = question.id;
    input.value = option.value;
    input.checked = String(value ?? '') === String(option.value);
    input.addEventListener('change', () => setAnswer(question, option.value));
    bindDoubleClickAdvance(label, input, question, option.value);
    label.append(input, document.createTextNode(option.label));
    wrap.append(label);
  }

  elements.controlHost.append(wrap);
}

function renderMulti(question) {
  const wrap = document.createElement('div');
  wrap.className = 'multi-list';
  const values = new Set(Array.isArray(answerValue(question)) ? answerValue(question).map(String) : []);

  for (const option of question.options) {
    const label = document.createElement('label');
    label.className = 'multi-option';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = option.value;
    input.checked = values.has(String(option.value));
    input.addEventListener('change', () => {
      const next = new Set(Array.isArray(answerValue(question)) ? answerValue(question).map(String) : []);
      if (input.checked) next.add(String(option.value));
      else next.delete(String(option.value));
      setAnswer(question, [...next]);
    });
    label.append(input, document.createTextNode(option.label));
    wrap.append(label);
  }

  elements.controlHost.append(wrap);
}


function renderPestBodyMap(question) {
  const values = new Set(Array.isArray(answerValue(question)) ? answerValue(question).map(String) : []);
  const wrap = document.createElement('div');
  wrap.className = 'pest-body-map';

  const stage = document.createElement('div');
  stage.className = 'pest-body-map__stage';
  const image = document.createElement('img');
  image.src = IS_STATIC ? './assets/pest-body-map.png' : '/assets/pest-body-map.png';
  image.alt = '';
  stage.append(image);

  for (const option of question.options) {
    const hotspot = PEST_JOINT_HOTSPOTS[option.value];
    if (!hotspot) continue;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pest-body-map__point';
    button.style.left = hotspot.x + '%';
    button.style.top = hotspot.y + '%';
    button.title = option.label;
    button.setAttribute('aria-label', option.label);
    button.setAttribute('aria-pressed', values.has(String(option.value)) ? 'true' : 'false');
    if (values.has(String(option.value))) button.classList.add('selected');
    button.addEventListener('click', () => {
      const next = new Set(Array.isArray(answerValue(question)) ? answerValue(question).map(String) : []);
      if (next.has(String(option.value))) next.delete(String(option.value));
      else next.add(String(option.value));
      setAnswer(question, [...next]);
      render();
    });
    stage.append(button);
  }

  const summary = document.createElement('p');
  summary.className = 'pest-body-map__summary';
  summary.textContent = values.size ? `${values.size} επιλεγμένες` : 'Κάντε κλικ στις αρθρώσεις στο διάγραμμα.';

  wrap.append(stage, summary);
  elements.controlHost.append(wrap);
}

function renderField(question) {
  const input = document.createElement('input');
  input.className = 'field-input';
  input.type = question.inputType || question.type || 'text';
  input.value = answerValue(question) ?? '';
  if (question.min !== undefined) input.min = question.min;
  if (question.max !== undefined) input.max = question.max;
  input.addEventListener('input', () => setAnswer(question, input.value));
  elements.controlHost.append(input);

  if (question.min !== undefined || question.max !== undefined) {
    const hint = document.createElement('p');
    hint.className = 'hint';
    hint.textContent = `Επιτρεπτό εύρος: ${question.min ?? '-∞'} έως ${question.max ?? '∞'}`;
    elements.controlHost.append(hint);
  }

  input.focus();
}

function validateCurrent() {
  const question = visibleQuestions[currentIndex];
  if (!question) return true;
  if (!isAnswered(question)) {
    elements.errorMessage.textContent = 'Απαντήστε στην ερώτηση για να συνεχίσετε.';
    return false;
  }
  const value = answerValue(question);
  if ((question.type === 'number' || question.inputType === 'number') && value !== '' && value !== undefined) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      elements.errorMessage.textContent = 'Εισάγετε αριθμό.';
      return false;
    }
    if (question.min !== undefined && numeric < question.min) {
      elements.errorMessage.textContent = `Η τιμή πρέπει να είναι τουλάχιστον ${question.min}.`;
      return false;
    }
    if (question.max !== undefined && numeric > question.max) {
      elements.errorMessage.textContent = `Η τιμή πρέπει να είναι το πολύ ${question.max}.`;
      return false;
    }
  }
  elements.errorMessage.textContent = '';
  return true;
}

function render() {
  rebuildVisibleQuestions();
  renderNav();
  clearControl();

  const question = visibleQuestions[currentIndex];
  if (!question) return;

  const progress = ((currentIndex + 1) / visibleQuestions.length) * 100;
  const form = forms.find((item) => item.id === question.formId);
  elements.formTitle.textContent = form?.title ?? question.formId;
  const description = form?.description ?? '';
  elements.formDescription.textContent = description;
  elements.formDescription.hidden = !description;
  elements.questionLabel.textContent = question.label;
  const prompt = question.prompt ?? '';
  elements.questionPrompt.textContent = prompt;
  elements.questionPrompt.hidden = !prompt;
  elements.answerHint.hidden = question.type !== 'choice' && question.type !== 'scale';
  elements.progressLabel.textContent = `${currentIndex + 1} από ${visibleQuestions.length}`;
  elements.mobileFormTitle.textContent = form?.title ?? question.formId;
  elements.mobileProgressLabel.textContent = `${currentIndex + 1} από ${visibleQuestions.length}`;
  elements.progressFill.style.width = `${progress}%`;
  elements.backButton.disabled = currentIndex === 0;
  elements.nextButton.hidden = currentIndex === visibleQuestions.length - 1;
  elements.nextButton.textContent = 'Επόμενο';
  updateGenerateState();

  if (question.type === 'choice' || question.type === 'scale') renderChoice(question);
  else if (question.id === 'pest_joints') renderPestBodyMap(question);
  else if (question.type === 'multi') renderMulti(question);
  else renderField(question);
}


async function generate() {
  if (!validateCurrent()) return;
  const missing = visibleQuestions.find((question) => !isAnswered(question));
  if (missing) {
    currentIndex = visibleQuestions.indexOf(missing);
    render();
    elements.errorMessage.textContent = 'Αυτή η υποχρεωτική ερώτηση χρειάζεται απάντηση.';
    return;
  }

  elements.generateButton.disabled = true;
  elements.generateButton.textContent = 'Δημιουργία...';
  elements.resultPanel.hidden = true;

  try {
    let files;
    if (IS_STATIC) {
      const response = await fetch('./samples.json');
      const payload = await response.json();
      if (!response.ok) throw new Error('Τα δείγματα επίδειξης δεν είναι διαθέσιμα.');
      files = payload.files;
    } else {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'PDF generation failed.');
      files = payload.files;
    }

    elements.resultLinks.innerHTML = '';
    if (IS_STATIC) {
      const note = document.createElement('p');
      note.className = 'demo-note';
      note.textContent = 'Λειτουργία επίδειξης: εμφανίζονται προσυμπληρωμένα δείγματα PDF. Εκτελέστε τοπικά για δημιουργία από τις δικές σας απαντήσεις.';
      elements.resultLinks.append(note);
    }
    for (const file of files) {
      const link = document.createElement('a');
      link.href = file.url;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.textContent = `${file.title} (${file.fileName})`;
      elements.resultLinks.append(link);
    }
    elements.resultPanel.hidden = false;
  } catch (error) {
    elements.errorMessage.textContent = error.message;
  } finally {
    elements.generateButton.disabled = false;
    elements.generateButton.textContent = 'Δημιουργία PDF';
  }
}

elements.backButton.addEventListener('click', () => {
  currentIndex = Math.max(0, currentIndex - 1);
  render();
});

elements.nextButton.addEventListener('click', () => {
  if (!validateCurrent()) return;
  currentIndex = Math.min(visibleQuestions.length - 1, currentIndex + 1);
  render();
});

elements.generateButton.addEventListener('click', generate);

elements.menuButton.addEventListener('click', toggleMenu);
elements.menuOverlay.addEventListener('click', closeMenu);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

elements.questionForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!elements.nextButton.hidden) elements.nextButton.click();
});

function clearDraft() {
  answers = {};
  localStorage.removeItem(STORAGE_KEY);
  elements.draftStatus.textContent = 'Το προσχέδιο διαγράφηκε';
  currentIndex = 0;
  closeMenu();
  render();
}

elements.clearButton.addEventListener('click', clearDraft);
elements.clearButtonMobile.addEventListener('click', clearDraft);

async function init() {
  const response = await fetch(IS_STATIC ? './forms.json' : '/api/forms');
  const payload = await response.json();
  forms = payload.forms;
  questions = forms.flatMap((form) => form.questions);
  loadDraft();
  pruneDraft();
  elements.draftStatus.textContent = Object.keys(answers).length ? 'Φορτώθηκε προσχέδιο' : 'Δεν υπάρχει αποθηκευμένο προσχέδιο';
  render();
}

init().catch((error) => {
  elements.draftStatus.textContent = 'Αποτυχία φόρτωσης εφαρμογής';
  elements.errorMessage.textContent = error.message;
});
