export class UIComponent {
  constructor({ title, id, className = '' }) {
    if (new.target === UIComponent) {
      throw new Error('UIComponent is abstract and cannot be instantiated directly.');
    }
    this.title = title;
    this.id = id;
    this.className = className;
    this.element = null;
    this._listeners = [];
    this._minimized = false;
  }

  render() {
    throw new Error('Method "render()" must be implemented in a subclass.');
  }

  destroy() {
    this._listeners.forEach(({ target, type, handler }) => {
      target.removeEventListener(type, handler);
    });
    this._listeners = [];
    this.element?.remove();
    this.element = null;
  }

  _addListener(target, type, handler) {
    target.addEventListener(type, handler);
    this._listeners.push({ target, type, handler });
  }

  _setState(state, message = '') {
    const states = ['loading', 'error', 'empty'];
    states.forEach(s => {
      const el = this.element.querySelector(`.widget__state--${s}`);
      if (el) el.hidden = s !== state;
    });
  }

  // Общая кнопка "свернуть" для всех виджетов
  _toggleMinimize() {
    this._minimized = !this._minimized;
    this.element.classList.toggle('widget--minimized', this._minimized);
    const btn = this.element.querySelector('.widget__btn--minimize');
    if (btn) {
      btn.textContent = this._minimized ? '+' : '—';
      btn.setAttribute('aria-label', this._minimized ? 'Развернуть' : 'Свернуть');
    }
  }
}