export class ITunesService {
  constructor() {
    this.baseUrl = 'https://itunes.apple.com/search';
    this._currentController = null;
  }

  async searchTracks(query, limit = 15) {
    return this._request({ term: query, entity: 'song', limit });
  }

  async searchAlbums(query, limit = 12) {
    return this._request({ term: query, entity: 'album', limit });
  }

  async _request(params) {
    if (this._currentController) {
      this._currentController.abort();
    }
    this._currentController = new AbortController();
    const { signal } = this._currentController;

    const url = new URL(this.baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });

    try {
      const response = await fetch(url.toString(), { signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      if (error.name === 'AbortError') return null;
      throw error;
    } finally {
      this._currentController = null;
    }
  }

  cancel() {
    if (this._currentController) {
      this._currentController.abort();
      this._currentController = null;
    }
  }
}