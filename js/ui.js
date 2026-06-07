import { tasksInstance } from './tasks.js';
import { pomodoro } from './pomodoro.js';
import { chartManager } from './charts.js';
import { cursor } from './cursor.js';
import { analytics } from './analytics.js';
import { Storage } from './storage.js';

export class UIManager {
  constructor() {
    this.currentView = 'dashboard';
    this.initNavigation();
    this.initModal();
    this.initViews();
    this.initPomodoroUI();
    this.initSettings();
    this.initGlobalSearch();
    
    // Subscribe to task updates
    tasksInstance.subscribe((tasks) => {
      this.renderDashboard(tasks);
      this.renderTaskBoard(tasks);
      this.updateStats(tasks);
      cursor.updateClickables();
      
      // Update charts
      chartManager.updateTasksChart(tasksInstance.getStats());
      chartManager.updateCategoriesChart(tasks);
    });
    
    // Initial render
    const allTasks = tasksInstance.getAllTasks();
    this.renderDashboard(allTasks);
    this.renderTaskBoard(allTasks);
    this.updateStats(allTasks);
    
    // Init streak
    document.getElementById('streak-counter').textContent = `${analytics.getStreak()} Day Streak`;
    
    // Init charts on next frame
    requestAnimationFrame(() => {
      this.initCharts();
    });
  }

  initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Update active class
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        
        // Show view
        const target = item.getAttribute('data-target');
        this.switchView(target);
      });
    });
  }

  switchView(viewId) {
    this.currentView = viewId;
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${viewId}`).classList.add('active');
  }

  initModal() {
    const modal = document.getElementById('task-modal');
    const btnNew = document.getElementById('btn-new-task');
    const btnClose = document.getElementById('btn-close-modal');
    const btnCancel = document.getElementById('btn-cancel-task');
    const form = document.getElementById('task-form');
    
    const openModal = () => {
      form.reset();
      document.getElementById('task-id').value = '';
      document.getElementById('modal-title').textContent = 'Create Task';
      modal.classList.add('active');
    };
    
    const closeModal = () => modal.classList.remove('active');
    
    btnNew.addEventListener('click', openModal);
    btnClose.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const id = document.getElementById('task-id').value;
      const data = {
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-desc').value,
        priority: document.getElementById('task-priority').value,
        category: document.getElementById('task-category').value,
        dueDate: document.getElementById('task-due').value
      };
      
      if (id) {
        tasksInstance.updateTask(id, data);
      } else {
        tasksInstance.addTask(data);
      }
      
      closeModal();
    });
    
    // Global keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        openModal();
      } else if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
  }

  initGlobalSearch() {
    const searchInput = document.getElementById('global-search');
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      if (this.currentView !== 'tasks') {
        document.querySelector('.nav-item[data-target="tasks"]').click();
      }
      
      const filtered = tasksInstance.filterTasks(query);
      this.renderTaskBoard(filtered);
    });
    
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        searchInput.focus();
      }
    });
  }

  initViews() {
    // Sortable JS setup for Task Board
    const containers = document.querySelectorAll('.drag-container');
    
    containers.forEach(container => {
      new Sortable(container, {
        group: 'shared',
        animation: 150,
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        onEnd: (evt) => {
          const itemEl = evt.item;
          const newStatus = evt.to.getAttribute('data-status');
          const taskId = itemEl.getAttribute('data-id');
          
          if (evt.from !== evt.to) {
            tasksInstance.changeStatus(taskId, newStatus);
            if (newStatus === 'completed') {
              if (window.confetti) confetti();
              analytics.recordTaskCompletion();
              document.getElementById('streak-counter').textContent = `${analytics.getStreak()} Day Streak`;
            }
          }
        }
      });
    });
    
    // Filters setup
    const filters = ['status', 'priority'].map(id => document.getElementById(`filter-${id}`));
    filters.forEach(f => {
      f.addEventListener('change', () => this.applyFilters());
    });
  }

  applyFilters() {
    const query = document.getElementById('global-search').value;
    const status = document.getElementById('filter-status').value;
    const priority = document.getElementById('filter-priority').value;
    
    let filtered = tasksInstance.filterTasks(query, status, priority);
    
    // Handle sorting
    const sort = document.getElementById('sort-tasks').value;
    filtered.sort((a, b) => {
      if (sort === 'date-desc') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === 'date-asc') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === 'priority') {
        const pMap = { critical: 4, high: 3, medium: 2, low: 1 };
        return pMap[b.priority] - pMap[a.priority];
      }
      return 0;
    });
    
    this.renderTaskBoard(filtered);
  }

  initPomodoroUI() {
    const miniDisplay = document.getElementById('mini-timer-display');
    const mainDisplay = document.getElementById('main-timer-display');
    const miniToggle = document.getElementById('btn-mini-timer-toggle');
    const mainToggle = document.getElementById('btn-timer-main-toggle');
    const ringProgress = document.querySelector('.timer-ring-progress');
    const modes = document.querySelectorAll('.mode-btn');
    const sessionCount = document.getElementById('session-count');
    
    const updateDisplays = (timeLeft, totalDuration) => {
      const timeStr = pomodoro.formatTime(timeLeft);
      miniDisplay.textContent = timeStr;
      mainDisplay.textContent = timeStr;
      
      // Update ring
      if (ringProgress) {
        const offset = 283 - (timeLeft / totalDuration) * 283;
        ringProgress.style.strokeDashoffset = offset;
      }
    };
    
    pomodoro.onTick = updateDisplays;
    
    pomodoro.onModeChange = (mode) => {
      modes.forEach(m => m.classList.remove('active'));
      document.querySelector(`.mode-btn[data-mode="${mode}"]`).classList.add('active');
      mainToggle.textContent = 'Start';
      miniToggle.textContent = 'Start';
    };
    
    pomodoro.onComplete = (mode, count) => {
      mainToggle.textContent = 'Start';
      miniToggle.textContent = 'Start';
      sessionCount.textContent = count;
    };
    
    const handleToggle = () => {
      const isRunning = pomodoro.toggle();
      const text = isRunning ? 'Pause' : 'Resume';
      mainToggle.textContent = text;
      miniToggle.textContent = text;
    };
    
    miniToggle.addEventListener('click', handleToggle);
    mainToggle.addEventListener('click', handleToggle);
    
    document.getElementById('btn-timer-reset').addEventListener('click', () => {
      pomodoro.reset();
      mainToggle.textContent = 'Start';
      miniToggle.textContent = 'Start';
    });
    
    document.getElementById('btn-timer-skip').addEventListener('click', () => {
      pomodoro.skip();
    });
    
    modes.forEach(btn => {
      btn.addEventListener('click', () => pomodoro.setMode(btn.dataset.mode));
    });
    
    // Spacebar shortcut
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && this.currentView === 'pomodoro' && e.target === document.body) {
        e.preventDefault();
        handleToggle();
      }
    });
    
    // Initial display
    updateDisplays(pomodoro.timeLeft, pomodoro.totalDuration);
    sessionCount.textContent = pomodoro.sessionCount;
  }

  initSettings() {
    document.getElementById('btn-theme-toggle').addEventListener('click', () => {
      const body = document.body;
      if (body.dataset.theme === 'light') {
        body.dataset.theme = 'dark';
      } else {
        body.dataset.theme = 'light';
      }
      Storage.set(Storage.KEYS.SETTINGS, { theme: body.dataset.theme });
    });
    
    document.getElementById('btn-export-data').addEventListener('click', () => {
      Storage.exportData();
    });
    
    document.getElementById('input-import-data').addEventListener('change', async (e) => {
      if (e.target.files.length) {
        try {
          await Storage.importData(e.target.files[0]);
          alert('Data imported successfully!');
          window.location.reload();
        } catch (err) {
          alert('Failed to import data.');
        }
      }
    });
    
    document.getElementById('btn-reset-data').addEventListener('click', () => {
      if (confirm('Are you sure you want to delete all your tasks and analytics? This cannot be undone.')) {
        Storage.clearAll();
        window.location.reload();
      }
    });
  }

  initCharts() {
    const focusCtx = document.getElementById('chart-focus');
    const tasksCtx = document.getElementById('chart-tasks');
    const categoriesCtx = document.getElementById('chart-categories');
    
    if (focusCtx) chartManager.initFocusChart(focusCtx, analytics.getFocusHours());
    if (tasksCtx) chartManager.initTasksChart(tasksCtx, tasksInstance.getStats());
    if (categoriesCtx) chartManager.initCategoriesChart(categoriesCtx, tasksInstance.getAllTasks());
  }

  updateStats(tasks) {
    const stats = tasksInstance.getStats();
    document.getElementById('stat-today-tasks').textContent = stats.today;
    document.getElementById('stat-completed').textContent = stats.completed;
    document.getElementById('stat-productivity').textContent = `${stats.productivity}%`;
    
    // Focus time stat
    const focusHours = analytics.getFocusHours().reduce((a, b) => a + b, 0);
    const h = Math.floor(focusHours);
    const m = Math.round((focusHours - h) * 60);
    document.getElementById('stat-focus-time').textContent = `${h}h ${m}m`;
  }

  createTaskHTML(task) {
    const isCompleted = task.status === 'completed';
    return `
      <div class="task-item ${isCompleted ? 'completed' : ''}" data-id="${task.id}">
        <div class="task-header">
          <input type="checkbox" class="task-checkbox" ${isCompleted ? 'checked' : ''} data-id="${task.id}">
          <span class="task-title">${task.title}</span>
          <div class="task-actions">
            <button class="btn btn-icon btn-edit" data-id="${task.id}"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-icon btn-delete" data-id="${task.id}"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
        <div class="task-badges">
          <span class="badge badge-priority-${task.priority}">${task.priority}</span>
          <span class="badge badge-cat-${task.category}">${task.category}</span>
          ${task.dueDate ? `<span class="task-due"><i class="fa-regular fa-calendar"></i> ${task.dueDate}</span>` : ''}
        </div>
      </div>
    `;
  }

  bindTaskEvents(container) {
    const checkboxes = container.querySelectorAll('.task-checkbox');
    const deletes = container.querySelectorAll('.btn-delete');
    const edits = container.querySelectorAll('.btn-edit');
    
    checkboxes.forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-id');
        const newStatus = tasksInstance.toggleCompletion(id);
        if (newStatus === 'completed') {
          if (window.confetti) confetti();
          analytics.recordTaskCompletion();
          document.getElementById('streak-counter').textContent = `${analytics.getStreak()} Day Streak`;
        }
      });
    });
    
    deletes.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        tasksInstance.deleteTask(id);
      });
    });
    
    edits.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const task = tasksInstance.getAllTasks().find(t => t.id === id);
        if (task) {
          document.getElementById('task-id').value = task.id;
          document.getElementById('task-title').value = task.title;
          document.getElementById('task-desc').value = task.description;
          document.getElementById('task-priority').value = task.priority;
          document.getElementById('task-category').value = task.category;
          document.getElementById('task-due').value = task.dueDate || '';
          
          document.getElementById('modal-title').textContent = 'Edit Task';
          document.getElementById('task-modal').classList.add('active');
        }
      });
    });
  }

  renderDashboard(tasks) {
    const list = document.getElementById('dashboard-task-list');
    const recent = tasksInstance.getRecentTasks(5);
    
    if (recent.length === 0) {
      list.innerHTML = `
        <div style="text-align: center; padding: 40px 0; color: var(--text-secondary);">
          <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234ADE80' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'/></svg>" style="width: 64px; opacity: 0.5; margin-bottom: 16px;">
          <p>No tasks yet.<br>Create your first task and start building momentum.</p>
        </div>
      `;
    } else {
      list.innerHTML = recent.map(t => this.createTaskHTML(t)).join('');
      this.bindTaskEvents(list);
    }
  }

  renderTaskBoard(tasksToRender) {
    const statuses = ['pending', 'in-progress', 'completed'];
    
    statuses.forEach(status => {
      const container = document.getElementById(`list-${status}`);
      if (!container) return;
      
      const filtered = tasksToRender.filter(t => t.status === status);
      container.innerHTML = filtered.map(t => this.createTaskHTML(t)).join('');
      this.bindTaskEvents(container);
    });
  }
}
