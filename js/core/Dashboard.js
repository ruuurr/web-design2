export class Dashboard {
  constructor(containerSelector, storageKey = 'dashboard-state') {
    this.container = document.querySelector(containerSelector);
    this.widgets = [];
    this.storageKey = storageKey;
    if (!this.container) {
      throw new Error(`Container "${containerSelector}" not found.`);
    }
  }

  /**
   * Добавить виджет, созданный пользователем (по кнопке).
   * Сохраняет состояние в localStorage.
   */
  addWidget(widget) {
    const element = widget.render();
    this.container.appendChild(element);
    this.widgets.push(widget);
    this._save();
    return widget;
  }

  /**
   * Внутренний метод: восстановить виджет из localStorage.
   * НЕ сохраняет состояние повторно, чтобы избежать зацикливания.
   */
  _restoreWidget(widget) {
    const element = widget.render();
    this.container.appendChild(element);
    this.widgets.push(widget);
  }

  removeWidget(widgetId) {
    const index = this.widgets.findIndex(w => w.id === widgetId);
    if (index === -1) return false;

    const widget = this.widgets[index];
    widget.destroy();
    this.widgets.splice(index, 1);
    this._save();
    return true;
  }

  getWidget(widgetId) {
    return this.widgets.find(w => w.id === widgetId);
  }

  destroyAll() {
    [...this.widgets].forEach(w => w.destroy());
    this.widgets = [];
    this._save();
  }

  _save() {
    try {
      const state = this.widgets.map(w => ({
        type: w.constructor.name,
        id: w.id,
        title: w.title
      }));
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (e) {
      console.warn('Не удалось сохранить состояние дашборда:', e);
    }
  }

  loadState() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      // Дополнительная защита от дубликатов по id
      const seen = new Set();
      return parsed.filter(item => {
        if (!item || typeof item.id !== 'string') return false;
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    } catch (e) {
      console.warn('Повреждённое состояние, сбрасываю:', e);
      return [];
    }
  }
}