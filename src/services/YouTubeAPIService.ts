import { Song } from '../models';

/**
 * YouTube Data API v3 Service
 * Searches for music videos and extracts song information
 */
export class YouTubeAPIService {
  private apiKey: string;
  private readonly BASE_URL = 'https://www.googleapis.com/youtube/v3';

  constructor(apiKey?: string) {
    // Get API key from environment variable or parameter
    // @ts-ignore - Vite env variables
    this.apiKey = apiKey || import.meta.env?.VITE_YOUTUBE_API_KEY || '';
  }

  /**
   * Search for songs by genre using YouTube Data API
   * @param genre - Music genre to search for
   * @param maxResults - Maximum number of results (default: 10)
   * @returns Array of songs found
   */
  async searchSongsByGenre(genre: string, maxResults: number = 10): Promise<Song[]> {
    if (!this.apiKey) {
      console.warn('YouTube API key not configured. Using fallback data.');
      return [];
    }

    try {
      const query = `${genre} music popular songs`;
      const url = `${this.BASE_URL}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=${maxResults}&key=${this.apiKey}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 403) {
          console.error('YouTube API quota exceeded or invalid API key');
        }
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      
      return this.parseYouTubeResults(data.items || [], genre);
    } catch (error) {
      console.error('Failed to fetch from YouTube API:', error);
      return [];
    }
  }

  /**
   * Parse YouTube API results into Song objects
   */
  private parseYouTubeResults(items: any[], genre: string): Song[] {
    return items.map((item, index) => {
      const snippet = item.snippet;
      const title = snippet.title;
      
      // Try to extract artist and song title from video title
      // Common formats: "Artist - Song", "Song by Artist", "Artist: Song"
      const { songTitle, artist } = this.extractSongInfo(title);

      return {
        id: `yt-${item.id.videoId}-${Date.now()}-${index}`,
        title: songTitle,
        artist: artist,
        genre: this.capitalizeGenre(genre),
        language: 'English',
        isCustom: false,
        duration: 0, // Duration not available in search results
        youtubeId: item.id.videoId,
      };
    });
  }

  /**
   * Extract song title and artist from YouTube video title
   */
  private extractSongInfo(videoTitle: string): { songTitle: string; artist: string } {
    // Remove common suffixes
    let cleaned = videoTitle
      .replace(/\(Official.*?\)/gi, '')
      .replace(/\[Official.*?\]/gi, '')
      .replace(/\(Lyric.*?\)/gi, '')
      .replace(/\[Lyric.*?\]/gi, '')
      .replace(/\(Audio\)/gi, '')
      .replace(/\[Audio\]/gi, '')
      .replace(/\(Music Video\)/gi, '')
      .replace(/\[Music Video\]/gi, '')
      .trim();

    // Try to split by common separators
    if (cleaned.includes(' - ')) {
      const parts = cleaned.split(' - ');
      return {
        artist: parts[0]?.trim() || 'Unknown Artist',
        songTitle: parts[1]?.trim() || cleaned,
      };
    } else if (cleaned.includes(' by ')) {
      const parts = cleaned.split(' by ');
      return {
        songTitle: parts[0]?.trim() || cleaned,
        artist: parts[1]?.trim() || 'Unknown Artist',
      };
    } else if (cleaned.includes(': ')) {
      const parts = cleaned.split(': ');
      return {
        artist: parts[0]?.trim() || 'Unknown Artist',
        songTitle: parts[1]?.trim() || cleaned,
      };
    }

    // If no separator found, use the whole title as song title
    return {
      songTitle: cleaned,
      artist: 'Various Artists',
    };
  }

  /**
   * Capitalize genre name properly
   */
  private capitalizeGenre(genre: string): string {
    return genre
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}
