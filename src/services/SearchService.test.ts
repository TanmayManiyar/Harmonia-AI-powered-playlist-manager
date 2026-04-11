import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchService } from './SearchService';
import { usePlaylistStore } from '../store';

// Mock the store
vi.mock('../store', () => ({
  usePlaylistStore: {
    getState: vi.fn(),
  },
}));

describe('SearchService', () => {
  let searchService: SearchService;

  beforeEach(() => {
    searchService = new SearchService();
    // Clear cache before each test
    searchService.clearCache();
    
    // Mock default language preference
    vi.mocked(usePlaylistStore.getState).mockReturnValue({
      languagePreference: '',
    } as any);
  });

  describe('searchSongs', () => {
    it('should return empty array for empty query', async () => {
      const result = await searchService.searchSongs('');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual([]);
      }
    });

    it('should return empty array for whitespace-only query', async () => {
      const result = await searchService.searchSongs('   ');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual([]);
      }
    });

    it('should search by song title', async () => {
      const result = await searchService.searchSongs('Bohemian');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.length).toBeGreaterThan(0);
        expect(result.value[0]?.title).toBe('Bohemian Rhapsody');
      }
    });

    it('should search by artist name', async () => {
      const result = await searchService.searchSongs('Queen');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.length).toBeGreaterThan(0);
        expect(result.value[0]?.artist).toBe('Queen');
      }
    });

    it('should be case-insensitive', async () => {
      const result = await searchService.searchSongs('QUEEN');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.length).toBeGreaterThan(0);
        expect(result.value[0]?.artist).toBe('Queen');
      }
    });

    it('should handle special characters', async () => {
      const result = await searchService.searchSongs('Für Elise');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.length).toBeGreaterThan(0);
        expect(result.value[0]?.title).toBe('Für Elise');
      }
    });

    it('should sanitize dangerous characters', async () => {
      const result = await searchService.searchSongs('Queen<>{}[]');
      
      expect(result.success).toBe(true);
      // Should still search for "Queen" after sanitization
      if (result.success) {
        expect(result.value.length).toBeGreaterThan(0);
        expect(result.value[0]?.artist).toBe('Queen');
      }
    });

    it('should filter by genre when specified', async () => {
      const result = await searchService.searchSongs('', { genre: 'Rock' });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.length).toBeGreaterThan(0);
        result.value.forEach((song) => {
          expect(song.genre).toBe('Rock');
        });
      }
    });

    it('should filter by language when specified in filters', async () => {
      const result = await searchService.searchSongs('', { language: 'Instrumental' });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.length).toBeGreaterThan(0);
        result.value.forEach((song) => {
          expect(song.language).toBe('Instrumental');
        });
      }
    });

    it('should apply language preference from store', async () => {
      vi.mocked(usePlaylistStore.getState).mockReturnValue({
        languagePreference: 'English',
      } as any);

      const result = await searchService.searchSongs('Michael');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.length).toBeGreaterThan(0);
        result.value.forEach((song) => {
          expect(song.language).toBe('English');
        });
      }
    });

    it('should prioritize filter language over store preference', async () => {
      vi.mocked(usePlaylistStore.getState).mockReturnValue({
        languagePreference: 'English',
      } as any);

      const result = await searchService.searchSongs('', { language: 'Instrumental' });
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.length).toBeGreaterThan(0);
        result.value.forEach((song) => {
          expect(song.language).toBe('Instrumental');
        });
      }
    });

    it('should cache search results', async () => {
      const result1 = await searchService.searchSongs('Queen');
      const result2 = await searchService.searchSongs('Queen');
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      
      if (result1.success && result2.success) {
        expect(result1.value).toEqual(result2.value);
      }
    });
  });

  describe('searchByGenre', () => {
    it('should return empty array for empty genre', async () => {
      const result = await searchService.searchByGenre('');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual([]);
      }
    });

    it('should return songs matching the genre', async () => {
      const result = await searchService.searchByGenre('Rock');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.length).toBeGreaterThan(0);
        result.value.forEach((song) => {
          expect(song.genre).toBe('Rock');
        });
      }
    });

    it('should be case-insensitive', async () => {
      const result = await searchService.searchByGenre('rock');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.length).toBeGreaterThan(0);
        result.value.forEach((song) => {
          expect(song.genre).toBe('Rock');
        });
      }
    });

    it('should apply language preference from store', async () => {
      vi.mocked(usePlaylistStore.getState).mockReturnValue({
        languagePreference: 'English',
      } as any);

      const result = await searchService.searchByGenre('Rock');
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.length).toBeGreaterThan(0);
        result.value.forEach((song) => {
          expect(song.genre).toBe('Rock');
          expect(song.language).toBe('English');
        });
      }
    });

    it('should cache results by genre', async () => {
      const result1 = await searchService.searchByGenre('Jazz');
      const result2 = await searchService.searchByGenre('Jazz');
      
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      
      if (result1.success && result2.success) {
        expect(result1.value).toEqual(result2.value);
      }
    });
  });

  describe('clearCache', () => {
    it('should clear the search cache', async () => {
      // Perform a search to populate cache
      await searchService.searchSongs('Queen');
      
      // Clear cache
      searchService.clearCache();
      
      // Perform same search again - should not use cache
      const result = await searchService.searchSongs('Queen');
      
      expect(result.success).toBe(true);
    });
  });
});
