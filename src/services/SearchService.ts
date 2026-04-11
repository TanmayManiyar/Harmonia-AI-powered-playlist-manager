import { Song, SearchFilters } from '../models';
import { usePlaylistStore } from '../store';
import { YouTubeAPIService } from './YouTubeAPIService';

/**
 * Result type for search operations
 */
export type SearchResult<T> = { success: true; value: T } | { success: false; error: string };

/**
 * SearchService - Handles song search functionality with caching
 * Uses YouTube Data API for real song data
 */
export class SearchService {
  private searchCache: Map<string, Song[]> = new Map();
  private readonly CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
  private cacheTimestamps: Map<string, number> = new Map();
  private youtubeAPI: YouTubeAPIService;

  constructor(youtubeApiKey?: string) {
    this.youtubeAPI = new YouTubeAPIService(youtubeApiKey);
  }

  /**
   * Mock song database for demonstration
   * In a real application, this would be an API call
   */
  private mockSongDatabase: Song[] = [
    {
      id: 'song-1',
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      genre: 'Rock',
      language: 'English',
      duration: 354,
      isCustom: false,
    },
    {
      id: 'song-2',
      title: 'Stairway to Heaven',
      artist: 'Led Zeppelin',
      genre: 'Rock',
      language: 'English',
      duration: 482,
      isCustom: false,
    },
    {
      id: 'song-3',
      title: 'Take Five',
      artist: 'Dave Brubeck',
      genre: 'Jazz',
      language: 'Instrumental',
      duration: 324,
      isCustom: false,
    },
    {
      id: 'song-4',
      title: 'So What',
      artist: 'Miles Davis',
      genre: 'Jazz',
      language: 'Instrumental',
      duration: 562,
      isCustom: false,
    },
    {
      id: 'song-5',
      title: 'Billie Jean',
      artist: 'Michael Jackson',
      genre: 'Pop',
      language: 'English',
      duration: 294,
      isCustom: false,
    },
    {
      id: 'song-6',
      title: 'Thriller',
      artist: 'Michael Jackson',
      genre: 'Pop',
      language: 'English',
      duration: 357,
      isCustom: false,
    },
    {
      id: 'song-7',
      title: 'Symphony No. 5',
      artist: 'Beethoven',
      genre: 'Classical',
      language: 'Instrumental',
      duration: 420,
      isCustom: false,
    },
    {
      id: 'song-8',
      title: 'Für Elise',
      artist: 'Beethoven',
      genre: 'Classical',
      language: 'Instrumental',
      duration: 180,
      isCustom: false,
    },
  ];

  /**
   * Search for songs with query and optional filters
   * Applies language preference filter automatically
   * Results are cached for performance
   * @param query - Search query string
   * @param filters - Optional filters for genre and language
   * @returns SearchResult with matching songs or error
   */
  async searchSongs(query: string, filters?: SearchFilters): Promise<SearchResult<Song[]>> {
    try {
      // Handle empty query without filters
      const trimmedQuery = query.trim();
      if (!trimmedQuery && !filters?.genre && !filters?.language) {
        return { success: true, value: [] };
      }

      // Sanitize query to handle special characters
      const sanitizedQuery = trimmedQuery ? this.sanitizeQuery(trimmedQuery) : '';

      // Generate cache key
      const cacheKey = this.generateCacheKey(sanitizedQuery, filters);

      // Check cache
      const cachedResult = this.getCachedResult(cacheKey);
      if (cachedResult) {
        return { success: true, value: cachedResult };
      }

      // Simulate API call delay
      await this.simulateNetworkDelay();

      // Get language preference from store
      const store = usePlaylistStore.getState();
      const languagePreference = store.languagePreference;

      // Search in mock database
      let results = this.mockSongDatabase.filter((song) => {
        // If query is provided, match against title or artist
        if (sanitizedQuery) {
          const matchesQuery =
            song.title.toLowerCase().includes(sanitizedQuery.toLowerCase()) ||
            song.artist.toLowerCase().includes(sanitizedQuery.toLowerCase());
          return matchesQuery;
        }
        // If no query, include all songs (will be filtered by genre/language)
        return true;
      });

      // Apply genre filter if specified
      if (filters?.genre) {
        results = results.filter(
          (song) => song.genre.toLowerCase() === filters.genre!.toLowerCase()
        );
      }

      // Apply language filter if specified in filters
      if (filters?.language) {
        results = results.filter(
          (song) => song.language?.toLowerCase() === filters.language!.toLowerCase()
        );
      }
      // Otherwise apply language preference from store if set
      else if (languagePreference && languagePreference.trim()) {
        results = results.filter(
          (song) => song.language?.toLowerCase() === languagePreference.toLowerCase()
        );
      }

      // Cache the results
      this.cacheResult(cacheKey, results);

      return { success: true, value: results };
    } catch (error) {
      // Handle search service unavailability
      return {
        success: false,
        error: 'Search service is currently unavailable. Please try again later.',
      };
    }
  }

  /**
   * Search songs by genre using YouTube API
   * Falls back to static data if API is not configured
   * Excludes songs already present in playlists of the same genre
   * @param genre - Genre to filter by
   * @returns SearchResult with songs matching the genre
   */
  async searchByGenre(genre: string): Promise<SearchResult<Song[]>> {
    try {
      // Validate genre
      const trimmedGenre = genre.trim();
      if (!trimmedGenre) {
        return { success: true, value: [] };
      }

      // Check cache
      const cacheKey = `genre:${trimmedGenre.toLowerCase()}`;
      const cachedResult = this.getCachedResult(cacheKey);
      if (cachedResult) {
        // Filter out songs already in playlists of this genre
        const filteredResults = this.filterExistingSongs(cachedResult, trimmedGenre);
        return { success: true, value: filteredResults };
      }

      // Get language preference from store
      const store = usePlaylistStore.getState();
      const languagePreference = store.languagePreference;

      let results: Song[] = [];

      // Try YouTube API first if configured
      if (this.youtubeAPI.isConfigured()) {
        results = await this.youtubeAPI.searchSongsByGenre(trimmedGenre, 10);
      }

      // Fallback to static data if YouTube API fails or returns no results
      if (results.length === 0) {
        results = this.generatePopularSongsForGenre(trimmedGenre);
      }

      // Apply language preference filter if set
      if (languagePreference && languagePreference.trim()) {
        results = results.filter(
          (song) => song.language?.toLowerCase() === languagePreference.toLowerCase()
        );
      }

      // Cache the results
      this.cacheResult(cacheKey, results);

      // Filter out songs already in playlists of this genre
      const filteredResults = this.filterExistingSongs(results, trimmedGenre);

      return { success: true, value: filteredResults };
    } catch (error) {
      // Handle search service unavailability
      return {
        success: false,
        error: 'Search service is currently unavailable. Please try again later.',
      };
    }
  }

  /**
   * Filter out songs that already exist in playlists of the same genre
   * @param songs - Songs to filter
   * @param genre - Genre to check against
   * @returns Filtered songs that don't exist in playlists of this genre
   */
  private filterExistingSongs(songs: Song[], genre: string): Song[] {
    const store = usePlaylistStore.getState();
    
    // Check if getAllPlaylists method exists (for testing compatibility)
    if (typeof store.getAllPlaylists !== 'function') {
      return songs;
    }
    
    const allPlaylists = store.getAllPlaylists();
    
    // Get all playlists of this genre
    const genrePlaylists = allPlaylists.filter(
      (playlist) => playlist.genre.toLowerCase() === genre.toLowerCase()
    );

    // If no playlists of this genre exist, return all songs
    if (genrePlaylists.length === 0) {
      return songs;
    }

    // Collect all song titles and artists from these playlists
    const existingSongs = new Set<string>();
    genrePlaylists.forEach((playlist) => {
      playlist.songs.forEach((song) => {
        // Create a unique key from title and artist (case-insensitive)
        const key = `${song.title.toLowerCase()}|${song.artist.toLowerCase()}`;
        existingSongs.add(key);
      });
    });

    // Filter out songs that already exist
    return songs.filter((song) => {
      const key = `${song.title.toLowerCase()}|${song.artist.toLowerCase()}`;
      return !existingSongs.has(key);
    });
  }

  /**
   * Capitalize genre name properly (e.g., "rock" -> "Rock", "hip hop" -> "Hip Hop")
   */
  private capitalizeGenre(genre: string): string {
    return genre
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Generate popular songs for a specific genre
   * In production, this would use web search or a music API
   */
  private generatePopularSongsForGenre(genre: string): Song[] {
    const songs: Song[] = [];
    const genreLower = genre.toLowerCase();
    
    // Genre-specific song templates
    const songData: Record<string, Array<{title: string, artist: string}>> = {
      rock: [
        { title: 'Bohemian Rhapsody', artist: 'Queen' },
        { title: 'Stairway to Heaven', artist: 'Led Zeppelin' },
        { title: 'Hotel California', artist: 'Eagles' },
        { title: 'Sweet Child O\' Mine', artist: 'Guns N\' Roses' },
        { title: 'Smells Like Teen Spirit', artist: 'Nirvana' },
        { title: 'Back in Black', artist: 'AC/DC' },
        { title: 'Dream On', artist: 'Aerosmith' },
        { title: 'November Rain', artist: 'Guns N\' Roses' },
        { title: 'Paradise City', artist: 'Guns N\' Roses' },
        { title: 'Enter Sandman', artist: 'Metallica' },
      ],
      pop: [
        { title: 'Billie Jean', artist: 'Michael Jackson' },
        { title: 'Thriller', artist: 'Michael Jackson' },
        { title: 'Like a Prayer', artist: 'Madonna' },
        { title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars' },
        { title: 'Shape of You', artist: 'Ed Sheeran' },
        { title: 'Blinding Lights', artist: 'The Weeknd' },
        { title: 'Levitating', artist: 'Dua Lipa' },
        { title: 'Anti-Hero', artist: 'Taylor Swift' },
        { title: 'As It Was', artist: 'Harry Styles' },
        { title: 'Flowers', artist: 'Miley Cyrus' },
      ],
      jazz: [
        { title: 'Take Five', artist: 'Dave Brubeck' },
        { title: 'So What', artist: 'Miles Davis' },
        { title: 'Autumn Leaves', artist: 'Bill Evans' },
        { title: 'My Favorite Things', artist: 'John Coltrane' },
        { title: 'Round Midnight', artist: 'Thelonious Monk' },
        { title: 'Blue in Green', artist: 'Miles Davis' },
        { title: 'Summertime', artist: 'Ella Fitzgerald' },
        { title: 'Fly Me to the Moon', artist: 'Frank Sinatra' },
        { title: 'What a Wonderful World', artist: 'Louis Armstrong' },
        { title: 'Girl from Ipanema', artist: 'Stan Getz' },
      ],
      classical: [
        { title: 'Symphony No. 5', artist: 'Beethoven' },
        { title: 'Für Elise', artist: 'Beethoven' },
        { title: 'Moonlight Sonata', artist: 'Beethoven' },
        { title: 'The Four Seasons', artist: 'Vivaldi' },
        { title: 'Canon in D', artist: 'Pachelbel' },
        { title: 'Clair de Lune', artist: 'Debussy' },
        { title: 'Ride of the Valkyries', artist: 'Wagner' },
        { title: 'Symphony No. 9', artist: 'Beethoven' },
        { title: 'Eine Kleine Nachtmusik', artist: 'Mozart' },
        { title: 'The Blue Danube', artist: 'Strauss' },
      ],
      'hip hop': [
        { title: 'Lose Yourself', artist: 'Eminem' },
        { title: 'HUMBLE.', artist: 'Kendrick Lamar' },
        { title: 'Sicko Mode', artist: 'Travis Scott' },
        { title: 'God\'s Plan', artist: 'Drake' },
        { title: 'Old Town Road', artist: 'Lil Nas X' },
        { title: 'Hotline Bling', artist: 'Drake' },
        { title: 'Stronger', artist: 'Kanye West' },
        { title: 'In Da Club', artist: '50 Cent' },
        { title: 'Empire State of Mind', artist: 'Jay-Z' },
        { title: 'Juicy', artist: 'The Notorious B.I.G.' },
      ],
      electronic: [
        { title: 'Levels', artist: 'Avicii' },
        { title: 'Titanium', artist: 'David Guetta ft. Sia' },
        { title: 'Wake Me Up', artist: 'Avicii' },
        { title: 'Animals', artist: 'Martin Garrix' },
        { title: 'Clarity', artist: 'Zedd' },
        { title: 'Strobe', artist: 'Deadmau5' },
        { title: 'One More Time', artist: 'Daft Punk' },
        { title: 'Sandstorm', artist: 'Darude' },
        { title: 'Scary Monsters and Nice Sprites', artist: 'Skrillex' },
        { title: 'Faded', artist: 'Alan Walker' },
      ],
      country: [
        { title: 'Jolene', artist: 'Dolly Parton' },
        { title: 'Take Me Home, Country Roads', artist: 'John Denver' },
        { title: 'Ring of Fire', artist: 'Johnny Cash' },
        { title: 'Friends in Low Places', artist: 'Garth Brooks' },
        { title: 'Before He Cheats', artist: 'Carrie Underwood' },
        { title: 'Wagon Wheel', artist: 'Darius Rucker' },
        { title: 'Tennessee Whiskey', artist: 'Chris Stapleton' },
        { title: 'Cruise', artist: 'Florida Georgia Line' },
        { title: 'Die a Happy Man', artist: 'Thomas Rhett' },
        { title: 'Body Like a Back Road', artist: 'Sam Hunt' },
      ],
    };

    // Get songs for this genre or use generic templates
    const templates = songData[genreLower] || [
      { title: 'Greatest Hits', artist: 'The Legends' },
      { title: 'Summer Vibes', artist: 'Cool Band' },
      { title: 'Night Drive', artist: 'Midnight Crew' },
      { title: 'Electric Dreams', artist: 'Synth Masters' },
      { title: 'Heartbeat', artist: 'The Rhythm' },
      { title: 'Skyline', artist: 'Urban Sound' },
      { title: 'Memories', artist: 'Echo Chamber' },
      { title: 'Sunrise', artist: 'Morning Glory' },
      { title: 'Thunder', artist: 'Storm Chasers' },
      { title: 'Paradise', artist: 'Island Beats' },
    ];

    templates.forEach((template, index) => {
      songs.push({
        id: `${genreLower}-${index + 1}-${Date.now()}`,
        title: template.title,
        artist: template.artist,
        genre: this.capitalizeGenre(genre),
        language: 'English',
        isCustom: false,
        duration: 180 + Math.floor(Math.random() * 120),
      });
    });

    return songs;
  }

  /**
   * Clear the search cache
   */
  clearCache(): void {
    this.searchCache.clear();
    this.cacheTimestamps.clear();
  }

  /**
   * Sanitize query to handle special characters
   * @param query - Raw query string
   * @returns Sanitized query string
   */
  private sanitizeQuery(query: string): string {
    // Remove potentially problematic characters but keep spaces and common punctuation
    return query.replace(/[<>{}[\]\\]/g, '').trim();
  }

  /**
   * Generate cache key from query and filters
   * @param query - Search query
   * @param filters - Optional filters
   * @returns Cache key string
   */
  private generateCacheKey(query: string, filters?: SearchFilters): string {
    const parts = [query.toLowerCase()];
    if (filters?.genre) {
      parts.push(`genre:${filters.genre.toLowerCase()}`);
    }
    if (filters?.language) {
      parts.push(`lang:${filters.language.toLowerCase()}`);
    }
    return parts.join('|');
  }

  /**
   * Get cached result if available and not expired
   * @param cacheKey - Cache key
   * @returns Cached songs or null if not found/expired
   */
  private getCachedResult(cacheKey: string): Song[] | null {
    const cached = this.searchCache.get(cacheKey);
    const timestamp = this.cacheTimestamps.get(cacheKey);

    if (cached && timestamp) {
      const now = Date.now();
      if (now - timestamp < this.CACHE_EXPIRY_MS) {
        return cached;
      } else {
        // Cache expired, remove it
        this.searchCache.delete(cacheKey);
        this.cacheTimestamps.delete(cacheKey);
      }
    }

    return null;
  }

  /**
   * Cache search results
   * @param cacheKey - Cache key
   * @param results - Search results to cache
   */
  private cacheResult(cacheKey: string, results: Song[]): void {
    this.searchCache.set(cacheKey, results);
    this.cacheTimestamps.set(cacheKey, Date.now());
  }

  /**
   * Simulate network delay for mock API
   * @returns Promise that resolves after a short delay
   */
  private async simulateNetworkDelay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 100));
  }
}
