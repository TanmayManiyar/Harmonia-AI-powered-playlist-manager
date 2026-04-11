const API_BASE = 'http://localhost:5000/api';

/**
 * API client for communicating with the Express backend
 */
class ApiClient {
  private getToken(): string | null {
    try {
      const stored = localStorage.getItem('playlist-manager:auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.token || null;
      }
    } catch {}
    return null;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ token: string; user: { id: string; name: string; email: string } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
  }

  async register(email: string, password: string, name?: string) {
    return this.request<{ token: string; user: { id: string; name: string; email: string } }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ email, password, name }) }
    );
  }

  async getMe() {
    return this.request<{ user: { id: string; name: string; email: string } }>('/auth/me');
  }

  // Playlists
  async getPlaylists() {
    return this.request<any[]>('/playlists');
  }

  async createPlaylist(genre: string, name?: string, songs?: any[]) {
    return this.request<any>('/playlists', {
      method: 'POST',
      body: JSON.stringify({ genre, name, songs }),
    });
  }

  async updatePlaylist(id: string, data: { name?: string; isFavorite?: boolean; songs?: any[] }) {
    return this.request<any>(`/playlists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePlaylist(id: string) {
    return this.request<any>(`/playlists/${id}`, { method: 'DELETE' });
  }

  async addSongToPlaylist(playlistId: string, song: any) {
    return this.request<any>(`/playlists/${playlistId}/songs`, {
      method: 'POST',
      body: JSON.stringify(song),
    });
  }

  async removeSongFromPlaylist(playlistId: string, songId: string) {
    return this.request<any>(`/playlists/${playlistId}/songs/${songId}`, {
      method: 'DELETE',
    });
  }

  // YouTube
  async searchByGenre(genre: string, maxResults = 10, language?: string) {
    const params = new URLSearchParams({ maxResults: maxResults.toString() });
    if (language) params.set('language', language);
    return this.request<any[]>(`/youtube/genre/${encodeURIComponent(genre)}?${params.toString()}`);
  }

  async searchSongs(query: string, genre?: string) {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (genre) params.set('genre', genre);
    return this.request<any[]>(`/youtube/search?${params.toString()}`);
  }
  // YouTube Sync
  async getYouTubeStatus() {
    return this.request<{ connected: boolean }>('/youtube-sync/status');
  }

  startYouTubeOAuth() {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');
    // Redirect the browser to the OAuth start endpoint
    window.location.href = `${API_BASE}/youtube-sync/oauth/start?token=${encodeURIComponent(token)}`;
  }

  async syncPlaylistToYouTube(playlistId: string) {
    return this.request<{
      success: boolean;
      youtubePlaylistId: string;
      youtubePlaylistUrl: string;
      addedCount: number;
      skippedCount: number;
      totalSongs: number;
    }>(`/youtube-sync/sync/${playlistId}`, { method: 'POST' });
  }

  async disconnectYouTube() {
    return this.request<{ message: string }>('/youtube-sync/disconnect', { method: 'DELETE' });
  }

  // Gemini AI Chat
  async chatWithAI(prompt: string, playlistName?: string, genre?: string) {
    return this.request<any>('/gemini/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt, playlistName, genre }),
    });
  }
}

export const api = new ApiClient();
