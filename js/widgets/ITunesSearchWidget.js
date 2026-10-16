import { UIComponent } from '../core/UIComponent.js';

export class ITunesSearchWidget extends UIComponent {
  constructor(config, service) {
    super(config);
    this.service = service;
    this.tracks = [];
    this._lastQuery = '';
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = `widget widget--track-search ${this.className}`;
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
          <input type="text" class="widget__input" placeholder="Название трека..." />
          <button class="widget__btn widget__btn--search">Найти</button>
        </div>
        <div class="widget__state widget__state--loading" hidden>Загрузка...</div>
        <div class="widget__state widget__state--error" hidden>
          <span class="widget__error-text"></span>
          <button class="widget__btn widget__btn--retry">Повторить</button>
        </div>
        <div class="widget__state widget__state--empty" hidden>Ничего не найдено</div>
        <ul class="track-list" hidden></ul>
      </div>
    `;

    const input = this.element.querySelector('.widget__input');
    const searchBtn = this.element.querySelector('.widget__btn--search');
    const closeBtn = this.element.querySelector('.widget__btn--close');
    const minimizeBtn = this.element.querySelector('.widget__btn--minimize');
    const retryBtn = this.element.querySelector('.widget__btn--retry');

    this._addListener(closeBtn, 'click', () => this.destroy());
    this._addListener(minimizeBtn, 'click', () => this._toggleMinimize());
    this._addListener(searchBtn, 'click', () => this._search(input.value));
    this._addListener(input, 'keypress', (e) => {
      if (e.key === 'Enter') this._search(input.value);
    });
    this._addListener(retryBtn, 'click', () => {
      if (this._lastQuery) this._search(this._lastQuery);
    });

    return this.element;
  }

  async _search(query) {
    if (!query.trim()) return;
    this._lastQuery = query;
    this._setState('loading');

    try {
      const tracks = await this.service.searchTracks(query);
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
    const list = this.element.querySelector('.track-list');
    list.innerHTML = '';
    list.hidden = false;

    this.tracks.forEach(track => {
      const li = document.createElement('li');
      li.className = 'track-item';

      if (track.artworkUrl100) {
        const cover = document.createElement('img');
        cover.className = 'track-item__cover';
        cover.src = track.artworkUrl100;
        cover.alt = '';
        cover.loading = 'lazy';
        li.appendChild(cover);
      }

      const info = document.createElement('div');
      info.className = 'track-item__info';

      const title = document.createElement('div');
      title.className = 'track-item__title';
      title.textContent = track.trackName || 'Без названия';

      const artist = document.createElement('div');
      artist.className = 'track-item__artist';
      artist.textContent = track.artistName || 'Неизвестный исполнитель';

      const meta = document.createElement('div');
      meta.className = 'track-item__meta';
      const year = track.releaseDate ? new Date(track.releaseDate).getFullYear() : '';
      meta.textContent = [track.collectionName, year].filter(Boolean).join(' · ');

      info.appendChild(title);
      info.appendChild(artist);
      info.appendChild(meta);
      li.appendChild(info);

      list.appendChild(li);
    });
  }

  _setState(state, message = '') {
    ['loading', 'error', 'empty'].forEach(s => {
      const el = this.element.querySelector(`.widget__state--${s}`);
      if (el) el.hidden = s !== state;
    });
    const list = this.element.querySelector('.track-list');
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