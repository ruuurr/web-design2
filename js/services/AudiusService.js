export class AudiusService {
  constructor(apiKey) {
    this.sdk = window.audiusSdk({ apiKey });
    this._currentController = null;
  }

  async _withAbort(sdkCall) {
    if (this._currentController) {
      this._currentController.abort();
    }
    this._currentController = new AbortController();
    const { signal } = this._currentController;

    try {
      const result = await sdkCall({ signal });
      return result;
    } catch (error) {
      if (error.name === 'AbortError') {
        return null;
      }
      throw error;
    } finally {
      this._currentController = null;
    }
  }

  async getTrendingTracks() {
    const result = await this._withAbort(({ signal }) =>
      this.sdk.tracks.getTrendingTracks({}, { signal })
    );
    return result?.data || [];
  }

  cancel() {
    if (this._currentController) {
      this._currentController.abort();
      this._currentController = null;
    }
  }
}