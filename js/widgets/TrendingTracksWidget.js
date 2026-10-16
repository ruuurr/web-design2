import { UIComponent } from '../core/UIComponent.js';

export class TrendingTracksWidget extends UIComponent {
  constructor(config, service) {
    super(config);
    this.service = service;
    this.tracks = [];
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = `widget widget--trending ${this.className}`;
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
        <div class="widget__state widget__state--loading" hidden>Загрузка...</div>
        <div class="widget__state widget__state--error" hidden>
          <span class="widget__error-text"></span>
          <button class="widget__btn widget__btn--retry">Повторить</button>
        </div>
        <div class="widget__state widget__state--empty" hidden>Нет данных</div>
        <ul class="trending-list" hidden></ul>
        <button class="widget__btn widget__btn--refresh">Обновить</button>
      </div>
    `;

    const closeBtn = this.element.querySelector('.widget__btn--close');
    const minimizeBtn = this.element.querySelector('.widget__btn--minimize');
    const refreshBtn = this.element.querySelector('.widget__btn--refresh');
    const retryBtn = this.element.querySelector('.widget__btn--retry');

    this._addListener(closeBtn, 'click', () => this.destroy());
    this._addListener(minimizeBtn, 'click', () => this._toggleMinimize());
    this._addListener(refreshBtn, 'click', () => this._loadTrending());
    this._addListener(retryBtn, 'click', () => this._loadTrending());

    this._loadTrending();
    return this.element;
  }

  async _loadTrending() {
    this._setState('loading');

    try {
      const tracks = await this.service.getTrendingTracks();
      if (tracks === null) return;
      this.tracks = tracks;

      if (tracks.length === 0) {
        this._setState('empty');
        return;
      }

      this._renderList();
      this._setState('success');
    } catch (error) {
      this._setState('error', `Ошибка: ${error.message}`);
    }
  }

  _renderList() {
    const list = this.element.querySelector('.trending-list');
    list.innerHTML = '';
    list.hidden = false;

    this.tracks.slice(0, 10).forEach((track, index) => {
      const li = document.createElement('li');
      li.className = 'trending-item';

      const rank = document.createElement('span');
      rank.className = 'trending-item__rank';
      rank.textContent = `${index + 1}.`;

      const title = document.createElement('span');
      title.className = 'trending-item__title';
      title.textContent = track.title || 'Без названия';

      const plays = document.createElement('span');
      plays.className = 'trending-item__plays';
      plays.textContent = `${track.playCount || 0} plays`;

      li.appendChild(rank);
      li.appendChild(title);
      li.appendChild(plays);
      list.appendChild(li);
    });
  }

  _setState(state, message = '') {
    ['loading', 'error', 'empty'].forEach(s => {
      const el = this.element.querySelector(`.widget__state--${s}`);
      if (el) el.hidden = s !== state;
    });
    const list = this.element.querySelector('.trending-list');
    if (list) list.hidden = state !== 'success';

    if (state === 'error') {
      const errEl = this.element.querySelector('.widget__error-text');
      if (errEl) errEl.textContent = message;
    }
  }

  destroy() {
    this.service.cancel();
    super.destroy();
  }
}