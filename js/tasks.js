import { Storage } from './storage.js';

export class TaskManager {
  constructor() {
    this.tasks = Storage.getTasks();
    this.subscribers = [];
  }

  // Subscribe to changes
  subscribe(callback) {
    this.subscribers.push(callback);
  }

  // Notify subscribers
  notify() {
    Storage.saveTasks(this.tasks);
    this.subscribers.forEach(cb => cb(this.tasks));
  }

  // Add a new task
  addTask(taskData) {
    const newTask = {
      id: Date.now().toString(),
      title: taskData.title,
      description: taskData.description || '',
      priority: taskData.priority || 'medium',
      category: taskData.category || 'work',
      dueDate: taskData.dueDate || null,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    this.tasks.push(newTask);
    this.notify();
    return newTask;
  }

  // Update existing task
  updateTask(id, updates) {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      this.tasks[index] = { ...this.tasks[index], ...updates };
      this.notify();
      return true;
    }
    return false;
  }

  // Delete task
  deleteTask(id) {
    const initialLength = this.tasks.length;
    this.tasks = this.tasks.filter(t => t.id !== id);
    if (this.tasks.length !== initialLength) {
      this.notify();
      return true;
    }
    return false;
  }

  // Toggle completion
  toggleCompletion(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.status = task.status === 'completed' ? 'pending' : 'completed';
      this.notify();
      return task.status;
    }
    return null;
  }

  // Change status (for drag and drop)
  changeStatus(id, newStatus) {
    return this.updateTask(id, { status: newStatus });
  }

  // Reorder tasks (drag and drop within same column)
  reorderTasks(status, oldIndex, newIndex) {
    const statusTasks = this.getTasksByStatus(status);
    if (oldIndex === newIndex || oldIndex >= statusTasks.length || newIndex >= statusTasks.length) return;

    const taskToMove = statusTasks[oldIndex];
    
    // Create new array to safely reorder
    const updatedTasks = [...this.tasks];
    
    // Find absolute indices
    const absOldIndex = updatedTasks.findIndex(t => t.id === taskToMove.id);
    const absNewIndex = updatedTasks.findIndex(t => t.id === statusTasks[newIndex].id);
    
    // Remove and insert
    const [removed] = updatedTasks.splice(absOldIndex, 1);
    
    // Insert at new position
    // Note: this is a bit tricky since removing changes indices, but sortable usually handles the DOM part.
    // For simplicity, we just save the status change right now, exact ordering needs an order field for robustness.
    
    // Let's implement a simple order field update if needed, but for now just updating DOM is usually enough if we just re-save based on DOM order.
    // Actually, a better approach for reorder from SortableJS is to pass the whole new ID list for that status.
  }
  
  updateOrderFromDOM(status, taskIds) {
    // taskIds is an array of IDs in the new order for the given status
    // We update the status of these tasks, and also reorder our main tasks array to match
    
    // 1. Separate tasks of this status and other statuses
    const otherTasks = this.tasks.filter(t => !taskIds.includes(t.id));
    
    // 2. Map IDs back to task objects, updating their status
    const reorderedTasks = taskIds.map(id => {
      const task = this.tasks.find(t => t.id === id);
      if (task) {
        task.status = status;
        return task;
      }
      return null;
    }).filter(Boolean);
    
    // 3. Combine
    this.tasks = [...otherTasks, ...reorderedTasks];
    this.notify();
  }

  // Getters
  getAllTasks() {
    return [...this.tasks];
  }

  getTasksByStatus(status) {
    return this.tasks.filter(t => t.status === status);
  }

  getRecentTasks(limit = 5) {
    return [...this.tasks]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  // Filter & Search
  filterTasks(query = '', status = 'all', priority = 'all') {
    return this.tasks.filter(task => {
      const matchQuery = query === '' || 
        task.title.toLowerCase().includes(query.toLowerCase()) || 
        task.description.toLowerCase().includes(query.toLowerCase());
      const matchStatus = status === 'all' || task.status === status;
      const matchPriority = priority === 'all' || task.priority === priority;
      
      return matchQuery && matchStatus && matchPriority;
    });
  }
  
  getStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = this.tasks.filter(t => t.createdAt.startsWith(today) || (t.dueDate && t.dueDate.startsWith(today)));
    const completed = this.tasks.filter(t => t.status === 'completed');
    
    return {
      total: this.tasks.length,
      today: todayTasks.length,
      completed: completed.length,
      productivity: this.tasks.length ? Math.round((completed.length / this.tasks.length) * 100) : 0
    };
  }
}

// Singleton instance
export const tasksInstance = new TaskManager();
