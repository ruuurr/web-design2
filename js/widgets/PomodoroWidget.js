import { UIComponent } from '../core/UIComponent.js';

export class PomodoroWidget extends UIComponent {
  constructor(config) {
    super(config);
    this.storageKey = `pomodoro-${this.id}`;
    this.workDuration = 25 * 60;     // 25 минут
    this.breakDuration = 5 * 60;     // 5 минут
    this.mode = 'work';              // 'work' | 'break'
    this.remaining = this.workDuration;
    this.running = false;
    this._intervalId = null;

    this._restore();
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = `widget widget--pomodoro ${this.className}`;
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
        <div class="pomodoro__mode" data-mode></div>
        <div class="pomodoro__time" data-time></div>
        <div class="pomodoro__controls">
          <button class="widget__btn widget__btn--start">Старт</button>
          <button class="widget__btn widget__btn--reset">Сброс</button>
        </div>
      </div>
    `;

    const closeBtn = this.element.querySelector('.widget__btn--close');
    const minimizeBtn = this.element.querySelector('.widget__btn--minimize');
    const startBtn = this.element.querySelector('.widget__btn--start');
    const resetBtn = this.element.querySelector('.widget__btn--reset');

    this._addListener(closeBtn, 'click', () => this.destroy());
    this._addListener(minimizeBtn, 'click', () => this._toggleMinimize());
    this._addListener(startBtn, 'click', () => this._toggleTimer());
    this._addListener(resetBtn, 'click', () => this._reset());

    this._updateDisplay();
    return this.element;
  }

  _toggleTimer() {
    if (this.running) {
      this._pause();
    } else {
      this._start();
    }
  }

  _start() {
    if (this.running) return;
    this.running = true;
    this._updateButton();

    this._intervalId = setInterval(() => {
      this.remaining -= 1;

      if (this.remaining <= 0) {
        this._switchMode();
      }

      this._updateDisplay();
    }, 1000);
  }

  _pause() {
    this.running = false;
    clearInterval(this._intervalId);
    this._intervalId = null;
    this._updateButton();
    this._save();
  }

  _reset() {
    clearInterval(this._intervalId);
    this._intervalId = null;
    this.running = false;
    this.mode = 'work';
    this.remaining = this.workDuration;
    this._updateDisplay();
    this._updateButton();
    this._save();
  }

  _switchMode() {
    clearInterval(this._intervalId);
    this._intervalId = null;
    this.running = false;

    if (this.mode === 'work') {
      this.mode = 'break';
      this.remaining = this.breakDuration;
    } else {
      this.mode = 'work';
      this.remaining = this.workDuration;
    }

    this._updateDisplay();
    this._updateButton();
    this._save();

    // Уведомление о завершении
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(
        this.mode === 'break' ? 'Работа завершена' : 'Отдых завершён',
        { body: this.mode === 'break' ? 'Время отдохнуть 5 минут' : 'Возвращаемся к работе' }
      );
    }
  }

  _updateDisplay() {
    const timeEl = this.element.querySelector('[data-time]');
    const modeEl = this.element.querySelector('[data-mode]');
    if (!timeEl || !modeEl) return;

    const minutes = Math.floor(this.remaining / 60);
    const seconds = this.remaining % 60;
    timeEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    modeEl.textContent = this.mode === 'work' ? 'Работа' : 'Отдых';
    this.element.classList.toggle('widget--pomodoro-break', this.mode === 'break');
  }

  _updateButton() {
    const btn = this.element.querySelector('.widget__btn--start');
    if (btn) btn.textContent = this.running ? 'Пауза' : 'Старт';
  }

  _save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        mode: this.mode,
        remaining: this.remaining
      }));
    } catch (e) {
      console.warn('Не удалось сохранить таймер:', e);
    }
  }

  _restore() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data && typeof data.remaining === 'number') {
        this.remaining = data.remaining;
        this.mode = data.mode === 'break' ? 'break' : 'work';
      }
    } catch (e) {
      console.warn('Повреждённое состояние таймера:', e);
    }
  }

  destroy() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
    super.destroy();
  }
}