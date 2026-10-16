import { UIComponent } from '../core/UIComponent.js';

export class ToDoWidget extends UIComponent {
  constructor(config) {
    super(config);
    this.storageKey = `todo-${this.id}`;
    this.tasks = this._load();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = `widget widget--todo ${this.className}`;
    this.element.id = this.id;

    this.element.innerHTML = `
      <div class="widget__header">
        <h3 class="widget__title">${this.title}</h3>
        <div class="widget__actions">
          <button class="widget__btn widget__btn--minimize" aria-label="Свернуть">—</button>
          <button class="widget__btn widget__btn--close" aria-label="Закрыть">×</button>
        </div>
      </div>
      <div class="widget__body">
        <div class="widget__input-group">
          <input type="text" class="widget__input" placeholder="Новая задача..." />
          <button class="widget__btn widget__btn--add">Добавить</button>
        </div>
        <ul class="todo-list"></ul>
      </div>
    `;

    const input = this.element.querySelector('.widget__input');
    const addBtn = this.element.querySelector('.widget__btn--add');
    const closeBtn = this.element.querySelector('.widget__btn--close');
    const minimizeBtn = this.element.querySelector('.widget__btn--minimize');

    this._addListener(closeBtn, 'click', () => this.destroy());
    this._addListener(minimizeBtn, 'click', () => this._toggleMinimize());
    this._addListener(addBtn, 'click', () => this._addTask(input.value));
    this._addListener(input, 'keypress', (e) => {
      if (e.key === 'Enter') this._addTask(input.value);
    });

    this._renderTasks();
    return this.element;
  }

  _addTask(text) {
    if (!text.trim()) return;
    this.tasks.push({ id: Date.now(), text: text.trim(), done: false });
    this._save();
    this._renderTasks();

    // Очищаем поле ввода
    const input = this.element.querySelector('.widget__input');
    if (input) {
      input.value = '';
      input.focus();
    }
  }

  _toggleTask(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) task.done = !task.done;
    this._save();
    this._renderTasks();
  }

  _removeTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this._save();
    this._renderTasks();
  }

  _renderTasks() {
    const list = this.element.querySelector('.todo-list');
    list.innerHTML = '';

    this.tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = `todo-item ${task.done ? 'todo-item--done' : ''}`;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.done;
      this._addListener(checkbox, 'change', () => this._toggleTask(task.id));

      const span = document.createElement('span');
      span.textContent = task.text;

      const del = document.createElement('button');
      del.className = 'todo-item__delete';
      del.textContent = '×';
      this._addListener(del, 'click', () => this._removeTask(task.id));

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(del);
      list.appendChild(li);
    });
  }

  _save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
    } catch (e) {
      console.warn('Не удалось сохранить задачи:', e);
    }
  }

  _load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Повреждённые задачи, сбрасываю:', e);
      return [];
    }
  }

  destroy() {
    super.destroy();
  }
}