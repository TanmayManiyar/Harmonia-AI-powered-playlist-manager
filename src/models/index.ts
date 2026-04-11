// Data models and type definitions

/**
 * Represents a song with metadata
 */
export interface Song {
  id: string;                    // Unique identifier
  title: string;                 // Song title
  artist: string;                // Artist name
  genre: string;                 // Song genre
  language?: string;             // Song language (optional)
  duration?: number;             // Duration in seconds (optional)
  isCustom: boolean;            // True if manually added
  youtubeId?: string;           // YouTube video ID for playback
  metadata?: Record<string, any>; // Additional metadata
}

/**
 * Represents a playlist with songs and metadata
 */
export interface Playlist {
  id: string;                    // Unique identifier (UUID)
  name: string;                  // User-editable name
  genre: string;                 // Associated genre
  songs: Song[];                 // Ordered list of songs
  isFavorite: boolean;          // Favorite status
  createdAt: Date;              // Creation timestamp
  updatedAt: Date;              // Last modification timestamp
}

/**
 * Represents the global application state
 */
export interface ApplicationState {
  playlists: Map<string, Playlist>;
  languagePreference: string;
  searchCache: Map<string, Song[]>;
}

/**
 * Represents filters for search operations
 */
export interface SearchFilters {
  genre?: string;
  language?: string;
}
