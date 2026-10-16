import { UIComponent } from '../core/UIComponent.js';

export class AlbumCoversWidget extends UIComponent {
  constructor(config, service) {
    super(config);
    this.service = service;
    this.albums = [];
    this._lastQuery = '';
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = `widget widget--albums ${this.className}`;
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
          <input type="text" class="widget__input" placeholder="Исполнитель..." />
          <button class="widget__btn widget__btn--search">Показать</button>
        </div>
        <div class="widget__state widget__state--loading" hidden>Загрузка...</div>
        <div class="widget__state widget__state--error" hidden>
          <span class="widget__error-text"></span>
          <button class="widget__btn widget__btn--retry">Повторить</button>
        </div>
        <div class="widget__state widget__state--empty" hidden>Альбомы не найдены</div>
        <div class="album-grid" hidden></div>
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
      const albums = await this.service.searchAlbums(query);
      if (albums === null) return;
      this.albums = albums;

      if (albums.length === 0) {
        this._setState('empty');
        return;
      }

      this._renderGrid();
      this._setState('success');
    } catch (error) {
      this._setState('error', `Ошибка: ${error.message}`);
    }
  }

  _renderGrid() {
    const grid = this.element.querySelector('.album-grid');
    grid.innerHTML = '';
    grid.hidden = false;

    this.albums.forEach(album => {
      const card = document.createElement('a');
      card.className = 'album-card';
      if (album.collectionViewUrl) {
        card.href = album.collectionViewUrl;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
      }

      // Обложка альбома
      const coverWrap = document.createElement('div');
      coverWrap.className = 'album-card__cover-wrap';

      if (album.artworkUrl100) {
        const img = document.createElement('img');
        img.className = 'album-card__cover';
        img.src = album.artworkUrl100.replace('100x100', '300x300');
        img.alt = album.collectionName || 'Обложка альбома';
        img.loading = 'lazy';
        coverWrap.appendChild(img);
      } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'album-card__cover album-card__cover--empty';
        placeholder.textContent = '♪';
        coverWrap.appendChild(placeholder);
      }

      // Название
      const title = document.createElement('div');
      title.className = 'album-card__title';
      title.textContent = album.collectionName || 'Без названия';

      // Исполнитель
      const artist = document.createElement('div');
      artist.className = 'album-card__artist';
      artist.textContent = album.artistName || '';

      // Год
      if (album.releaseDate) {
        const year = document.createElement('div');
        year.className = 'album-card__year';
        year.textContent = new Date(album.releaseDate).getFullYear();
        card.appendChild(coverWrap);
        card.appendChild(title);
        card.appendChild(artist);
        card.appendChild(year);
      } else {
        card.appendChild(coverWrap);
        card.appendChild(title);
        card.appendChild(artist);
      }

      grid.appendChild(card);
    });
  }

  _setState(state, message = '') {
    ['loading', 'error', 'empty'].forEach(s => {
      const el = this.element.querySelector(`.widget__state--${s}`);
      if (el) el.hidden = s !== state;
    });
    const grid = this.element.querySelector('.album-grid');
    if (grid) grid.hidden = state !== 'success';

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