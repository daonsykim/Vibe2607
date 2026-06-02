/**
 * TodoGlow - Core Application Script
 * Vanilla JS state management with Tailwind CSS utility classes and local storage.
 */

// --- Constants & Config ---
const STORAGE_KEY = 'todoglow_todos';
const CIRCUMFERENCE = 364.42; // 2 * Math.PI * 58 (radius in svg)

// Category Translations, Emojis, and Tailwind pastel styles
const CATEGORIES = {
  work: { label: '업무', emoji: '💼', class: 'bg-purple-50 text-purple-600 border border-purple-100' },
  personal: { label: '개인', emoji: '🏠', class: 'bg-sky-50 text-sky-600 border border-sky-100' },
  study: { label: '학습', emoji: '📚', class: 'bg-indigo-50 text-indigo-600 border border-indigo-100' },
  health: { label: '건강', emoji: '🏃', class: 'bg-pink-50 text-pink-600 border border-pink-100' },
  other: { label: '기타', emoji: '🏷️', class: 'bg-slate-50 text-slate-500 border border-slate-100' }
};

// Priority Translations, Emojis, and Tailwind pastel styles
const PRIORITIES = {
  high: { label: '높음', emoji: '🚨', class: 'bg-rose-50 text-rose-600 border border-rose-100' },
  medium: { label: '보통', emoji: '⚡', class: 'bg-amber-50 text-amber-600 border border-amber-100' },
  low: { label: '낮음', emoji: '🌱', class: 'bg-emerald-50 text-emerald-600 border border-emerald-100' }
};

// --- Application State ---
let todos = [];
let activeTab = 'all'; // 'all', 'active', 'completed'
let searchQuery = '';
let selectedCategory = 'all';
let selectedPriority = 'all';

// --- DOM Elements ---
const currentDateText = document.getElementById('current-date-text');
const todoList = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const addSelfBtn = document.getElementById('add-task-btn');

// Stats Elements
const progressCircle = document.querySelector('.progress-ring__circle');
const progressPercentLabel = document.getElementById('progress-percentage-label');
const remainingCountMessage = document.getElementById('remaining-count-message');
const motivationalQuote = document.getElementById('motivational-quote');
const statActiveCount = document.getElementById('stat-active-count');
const statCompletedCount = document.getElementById('stat-completed-count');

// Category Stats
const statWork = document.getElementById('cat-stat-work');
const statPersonal = document.getElementById('cat-stat-personal');
const statStudy = document.getElementById('cat-stat-study');
const statHealth = document.getElementById('cat-stat-health');

// Filters
const searchInput = document.getElementById('search-input');
const searchClearBtn = document.getElementById('search-clear-btn');
const categoryFilter = document.getElementById('category-filter');
const priorityFilter = document.getElementById('priority-filter');
const tabAll = document.getElementById('filter-all');
const tabActive = document.getElementById('filter-active');
const tabCompleted = document.getElementById('filter-completed');
const tabIndicator = document.querySelector('.tab-indicator');

// Modal Elements
const taskModal = document.getElementById('task-modal');
const modalHeading = document.getElementById('modal-heading');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalSubmitBtn = document.getElementById('modal-submit-btn');
const taskForm = document.getElementById('task-form');
const editTaskIdInput = document.getElementById('edit-task-id');
const taskTitleInput = document.getElementById('task-title-input');
const taskCategorySelect = document.getElementById('task-category-select');
const taskPrioritySelect = document.getElementById('task-priority-select');

// Toast Container
const toastContainer = document.getElementById('toast-container');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  updateCurrentDate();
  loadTodos();
  updateStats();
  renderTodos();
  setupEventListeners();
  updateTabIndicator(tabAll); // Set initial tab indicator position
}

// --- Date Helper ---
function updateCurrentDate() {
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  const formatter = new Intl.DateTimeFormat('ko-KR', options);
  currentDateText.textContent = formatter.format(new Date());
}

// --- Storage Handler ---
function loadTodos() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    todos = JSON.parse(stored);
  } else {
    // Inject high-quality initial seed data for wow factor
    todos = [
      {
        id: 'seed-1',
        title: 'TodoGlow 할 일 관리자 살펴보기',
        category: 'work',
        priority: 'high',
        completed: false,
        createdAt: Date.now() - 3600000
      },
      {
        id: 'seed-2',
        title: '신선한 야채와 과일 장보기',
        category: 'personal',
        priority: 'medium',
        completed: true,
        createdAt: Date.now() - 7200000
      },
      {
        id: 'seed-3',
        title: '매일 30분 유산소 운동하기',
        category: 'health',
        priority: 'low',
        completed: false,
        createdAt: Date.now() - 10800000
      }
    ];
    saveTodos();
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// --- Circular Progress & Dashboard Stats ---
function updateStats() {
  const total = todos.length;
  const completed = todos.filter(t => t.completed).length;
  const active = total - completed;
  
  // Update numerical stats
  statActiveCount.textContent = active;
  statCompletedCount.textContent = completed;

  // Calculate percentage
  let percentage = 0;
  if (total > 0) {
    percentage = Math.round((completed / total) * 100);
  }

  // Update SVG Circle Progress Ring
  progressCircle.style.strokeDasharray = CIRCUMFERENCE;
  const offset = CIRCUMFERENCE - (percentage / 100) * CIRCUMFERENCE;
  progressCircle.style.strokeDashoffset = offset;
  
  // Count animation for label
  animateCounter(progressPercentLabel, parseInt(progressPercentLabel.textContent) || 0, percentage, '%');

  // Dynamic Quote & Message
  let message = '';
  let quote = '';
  
  if (total === 0) {
    message = '추가된 할 일이 없습니다';
    quote = '우측 하단 버튼(+)을 클릭해 오늘을 계획해 보세요!';
  } else if (active === 0) {
    message = '오늘의 할 일을 모두 완료했습니다!';
    quote = '완벽한 성취! 정말 알차고 고생 많으셨던 하루였네요. 🎉';
  } else {
    message = `완료해야 할 일이 ${active}개 남았습니다.`;
    
    // Choose motivational message by percentage
    if (percentage === 0) {
      quote = '목표를 향해 한 걸음씩 힘차게 시작해볼까요? 💪';
    } else if (percentage < 40) {
      quote = '훌륭합니다! 천천히 나아가며 속도를 더해보세요.';
    } else if (percentage < 80) {
      quote = '절반 가량 완료했네요! 조금만 더 힘을 내볼까요? 👍';
    } else {
      quote = '완료가 눈앞에 보입니다! 마지막까지 집중력을 발휘하세요!';
    }
  }

  remainingCountMessage.textContent = message;
  motivationalQuote.textContent = quote;

  // Update Category Statistics
  updateCategoryStats();
}

function updateCategoryStats() {
  const counts = { work: 0, personal: 0, study: 0, health: 0 };
  todos.forEach(todo => {
    if (todo.category in counts) {
      counts[todo.category]++;
    }
  });

  statWork.textContent = counts.work;
  statPersonal.textContent = counts.personal;
  statStudy.textContent = counts.study;
  statHealth.textContent = counts.health;
}

// Numerical count animation for premium feeling
function animateCounter(element, start, end, suffix = '') {
  if (start === end) {
    element.textContent = `${end}${suffix}`;
    return;
  }
  
  let current = start;
  const duration = 500; // ms
  const stepTime = Math.abs(Math.floor(duration / (end - start || 1)));
  const step = end > start ? 1 : -1;
  
  const timer = setInterval(() => {
    current += step;
    element.textContent = `${current}${suffix}`;
    if (current === end) {
      clearInterval(timer);
    }
  }, Math.max(stepTime, 8)); // lock to min 8ms to avoid browser throttle
}

// --- Todo Render Engine ---
function renderTodos() {
  // Filter todo list
  const filtered = todos.filter(todo => {
    // 1. Tab Completion filter
    if (activeTab === 'active' && todo.completed) return false;
    if (activeTab === 'completed' && !todo.completed) return false;

    // 2. Search query filter
    if (searchQuery && !todo.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    // 3. Category Filter
    if (selectedCategory !== 'all' && todo.category !== selectedCategory) return false;

    // 4. Priority Filter
    if (selectedPriority !== 'all' && todo.priority !== selectedPriority) return false;

    return true;
  });

  // Sort: Incomplete tasks first, then by priority (High > Medium > Low), then by newest
  const priorityWeight = { high: 3, medium: 2, low: 1 };
  filtered.sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1; // incomplete first
    }
    const weightDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (weightDiff !== 0) return weightDiff;
    return b.createdAt - a.createdAt; // newest first
  });

  // Render nodes
  todoList.innerHTML = '';
  
  if (filtered.length === 0) {
    emptyState.style.display = 'flex';
    todoList.style.display = 'none';
  } else {
    emptyState.style.display = 'none';
    todoList.style.display = 'flex';

    filtered.forEach(todo => {
      const li = createTodoNode(todo);
      todoList.appendChild(li);
    });
  }
}

function createTodoNode(todo) {
  const li = document.createElement('li');
  // Apply beautiful pastel designs via Tailwind classes
  li.className = todo.completed 
    ? 'bg-slate-50/50 border border-slate-100 rounded-2xl p-4 md:p-5 flex items-center justify-between gap-4 opacity-70 transition-all duration-300'
    : 'bg-white border border-slate-100 rounded-2xl p-4 md:p-5 flex items-center justify-between gap-4 shadow-sm hover:shadow-md hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300';
  li.dataset.id = todo.id;

  const category = CATEGORIES[todo.category] || CATEGORIES.other;
  const priority = PRIORITIES[todo.priority] || PRIORITIES.medium;

  li.innerHTML = `
    <div class="flex items-center gap-4 flex-1 min-w-0">
      <div class="todo-checkbox-wrapper flex-shrink-0">
        <input type="checkbox" id="check-${todo.id}" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
        <label for="check-${todo.id}" class="todo-checkmark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </label>
      </div>
      
      <div class="flex flex-col gap-1.5 min-w-0">
        <span class="${todo.completed ? 'text-sm font-semibold text-slate-400 line-through select-none' : 'text-sm font-semibold text-slate-700'} break-words">${escapeHtml(todo.title)}</span>
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-md ${category.class}">
            ${category.emoji} ${category.label}
          </span>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-md ${priority.class}">
            ${priority.emoji} ${priority.label}
          </span>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-1 flex-shrink-0">
      <button class="action-btn btn-edit w-9 h-9 flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all" aria-label="수정">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button class="action-btn btn-delete w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" aria-label="삭제">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          <line x1="10" y1="11" x2="10" y2="17"/>
          <line x1="14" y1="11" x2="14" y2="17"/>
        </svg>
      </button>
    </div>
  `;

  // Bind inline events to elements inside card
  const checkbox = li.querySelector('.todo-checkbox');
  checkbox.addEventListener('change', (e) => {
    toggleTodoStatus(todo.id, e.target.checked, e);
  });

  const editBtn = li.querySelector('.btn-edit');
  editBtn.addEventListener('click', () => {
    openEditModal(todo.id);
  });

  const deleteBtn = li.querySelector('.btn-delete');
  deleteBtn.addEventListener('click', () => {
    deleteTodo(todo.id);
  });

  return li;
}

// Security escape HTML helper
function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// --- Todo Operations ---
function toggleTodoStatus(id, isCompleted, event) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  todo.completed = isCompleted;
  saveTodos();
  updateStats();
  
  // Re-render items but keep user interface position stable if possible
  renderTodos();

  if (isCompleted) {
    showToast('할 일을 완료했습니다! 🎉', 'success');
    
    // Confetti effect at trigger location
    if (event) {
      const rect = event.target.getBoundingClientRect();
      const clientX = rect.left + rect.width / 2 + window.scrollX;
      const clientY = rect.top + rect.height / 2 + window.scrollY;
      createConfetti(clientX, clientY);
    }
  } else {
    showToast('할 일을 다시 활성화했습니다.', 'info');
  }
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  updateStats();
  renderTodos();
  showToast('할 일이 삭제되었습니다.', 'danger');
}

// --- Modal Handlers ---
function openAddModal() {
  editTaskIdInput.value = '';
  taskTitleInput.value = '';
  taskCategorySelect.value = 'personal';
  taskPrioritySelect.value = 'medium';
  
  modalHeading.textContent = '새로운 할 일 등록';
  modalSubmitBtn.textContent = '추가하기';
  
  openModal();
}

function openEditModal(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  editTaskIdInput.value = todo.id;
  taskTitleInput.value = todo.title;
  taskCategorySelect.value = todo.category;
  taskPrioritySelect.value = todo.priority;

  modalHeading.textContent = '할 일 정보 수정';
  modalSubmitBtn.textContent = '수정 완료';

  openModal();
}

function openModal() {
  taskModal.classList.add('active');
  taskModal.setAttribute('aria-hidden', 'false');
  setTimeout(() => taskTitleInput.focus(), 100);
}

function closeModal() {
  taskModal.classList.remove('active');
  taskModal.setAttribute('aria-hidden', 'true');
  taskForm.reset();
}

function handleFormSubmit(e) {
  e.preventDefault();
  
  const id = editTaskIdInput.value;
  const title = taskTitleInput.value.trim();
  const category = taskCategorySelect.value;
  const priority = taskPrioritySelect.value;

  if (!title) return;

  if (id) {
    // Edit existing todo
    const todo = todos.find(t => t.id === id);
    if (todo) {
      todo.title = title;
      todo.category = category;
      todo.priority = priority;
      showToast('할 일이 수정되었습니다.', 'success');
    }
  } else {
    // Add new todo
    const newTodo = {
      id: 'task-' + Date.now() + Math.random().toString(36).substr(2, 4),
      title: title,
      category: category,
      priority: priority,
      completed: false,
      createdAt: Date.now()
    };
    todos.push(newTodo);
    showToast('새로운 할 일이 추가되었습니다.', 'success');
  }

  saveTodos();
  updateStats();
  renderTodos();
  closeModal();
}

// --- Dynamic Tab Indicator Animation ---
function updateTabIndicator(activeTabElement) {
  if (!activeTabElement) return;
  const left = activeTabElement.offsetLeft;
  const width = activeTabElement.offsetWidth;
  tabIndicator.style.transform = `translateX(${left - 4}px)`;
  tabIndicator.style.width = `${width}px`;
}

// --- Micro-Animations: Pastel Confetti FX ---
function createConfetti(x, y) {
  const container = document.body;
  const colors = [
    '#a5b4fc', // indigo pastel
    '#c084fc', // purple pastel
    '#93c5fd', // blue pastel
    '#6ee7b7', // mint green pastel
    '#f9a8d4', // pink pastel
    '#fef08a'  // yellow pastel
  ];
  
  const particleCount = 28;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'confetti-particle';
    
    // Choose random color
    const color = colors[Math.floor(Math.random() * colors.length)];
    particle.style.background = color;
    
    // Start position
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    
    // Random direction vectors
    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 80;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance - (10 + Math.random() * 20); // slight gravity bias
    const rot = 360 + Math.random() * 720;
    
    // Apply inline custom properties for css animation
    particle.style.setProperty('--tx', `${tx}px`);
    particle.style.setProperty('--ty', `${ty}px`);
    particle.style.setProperty('--rot', `${rot}deg`);
    
    // Append and trigger
    container.appendChild(particle);
    
    // Clean up
    setTimeout(() => {
      particle.remove();
    }, 800);
  }
}

// --- Toast System ---
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Custom icons based on toast type
  let icon = '';
  switch (type) {
    case 'success':
      icon = `<svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
      break;
    case 'danger':
      icon = `<svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`;
      break;
    case 'warning':
      icon = `<svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
      break;
    default: // info
      icon = `<svg fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
  }

  toast.innerHTML = `${icon}<span>${message}</span>`;
  toastContainer.appendChild(toast);
  
  // Animate Entrance
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Fade out & exit
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// --- Event Listeners Setup ---
function setupEventListeners() {
  // Modal toggle listeners
  addSelfBtn.addEventListener('click', openAddModal);
  modalCloseBtn.addEventListener('click', closeModal);
  modalCancelBtn.addEventListener('click', closeModal);
  
  // Close modal when clicking backdrop overlay
  taskModal.addEventListener('click', (e) => {
    if (e.target === taskModal) {
      closeModal();
    }
  });

  // Form Submit
  taskForm.addEventListener('submit', handleFormSubmit);

  // Tab Filtering Click Events
  tabAll.addEventListener('click', (e) => {
    switchTab('all', e.target);
  });
  
  tabActive.addEventListener('click', (e) => {
    switchTab('active', e.target);
  });
  
  tabCompleted.addEventListener('click', (e) => {
    switchTab('completed', e.target);
  });

  // Redraw tab indicator on resize
  window.addEventListener('resize', () => {
    const activeBtn = document.querySelector(`.tab-btn.active`);
    updateTabIndicator(activeBtn);
  });

  // Search filter
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    if (searchQuery) {
      searchClearBtn.style.display = 'flex';
    } else {
      searchClearBtn.style.display = 'none';
    }
    renderTodos();
  });

  searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    searchClearBtn.style.display = 'none';
    renderTodos();
    searchInput.focus();
  });

  // Dropdown filter selections
  categoryFilter.addEventListener('change', (e) => {
    selectedCategory = e.target.value;
    renderTodos();
  });

  priorityFilter.addEventListener('change', (e) => {
    selectedPriority = e.target.value;
    renderTodos();
  });

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // ESC key closes modal
    if (e.key === 'Escape' && taskModal.classList.contains('active')) {
      closeModal();
    }
    
    // Slash (/) key focuses search (if not inside an input/select)
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'SELECT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      searchInput.focus();
    }
  });
}

function switchTab(tab, element) {
  activeTab = tab;
  
  // Manage CSS classes on tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('aria-selected', 'false');
  });
  
  element.classList.add('active');
  element.setAttribute('aria-selected', 'true');
  
  // Move sliding indicator
  updateTabIndicator(element);
  
  renderTodos();
}
