import '@testing-library/jest-dom'
import { vi } from 'vitest'

type MockSong = {
  id: string
  title: string
  artist: string
  genre: string
  isCustom: boolean
  language?: string
  duration?: number
  youtubeId?: string
}

type MockPlaylist = {
  _id: string
  id?: string
  name: string
  genre: string
  songs: MockSong[]
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

let playlists: MockPlaylist[] = []
let idCounter = 0

const now = () => new Date().toISOString()

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const createMockPlaylist = (genre: string, name?: string, songs: MockSong[] = []): MockPlaylist => {
  idCounter += 1
  const id = `playlist-${idCounter}`
  const createdAt = now()
  const genreCount = playlists.filter((playlist) => playlist.genre.toLowerCase() === genre.toLowerCase()).length

  return {
    _id: id,
    name: name || `${genre} Playlist ${genreCount + 1}`,
    genre,
    songs,
    isFavorite: false,
    createdAt,
    updatedAt: createdAt,
  }
}

export const mockApiState = {
  reset() {
    playlists = []
    idCounter = 0
  },
}

vi.mock('../services/api', () => ({
  api: {
    __reset: mockApiState.reset,
    async getPlaylists() {
      return clone(playlists)
    },
    async createPlaylist(genre: string, name?: string, songs?: MockSong[]) {
      const playlist = createMockPlaylist(genre, name, songs || [])
      playlists.push(playlist)
      return clone(playlist)
    },
    async updatePlaylist(id: string, data: { name?: string; isFavorite?: boolean; songs?: MockSong[] }) {
      const playlist = playlists.find((item) => item._id === id || item.id === id)
      if (!playlist) throw new Error('Playlist not found')

      Object.assign(playlist, data, { updatedAt: now() })
      return clone(playlist)
    },
    async deletePlaylist(id: string) {
      const before = playlists.length
      playlists = playlists.filter((item) => item._id !== id && item.id !== id)
      if (playlists.length === before) throw new Error('Playlist not found')
      return { message: 'Playlist deleted' }
    },
    async addSongToPlaylist(playlistId: string, song: MockSong) {
      const playlist = playlists.find((item) => item._id === playlistId || item.id === playlistId)
      if (!playlist) throw new Error('Playlist not found')
      if (playlist.songs.some((item) => item.id === song.id)) throw new Error('Song already in playlist')

      playlist.songs.push(song)
      playlist.updatedAt = now()
      return clone(playlist)
    },
    async removeSongFromPlaylist(playlistId: string, songId: string) {
      const playlist = playlists.find((item) => item._id === playlistId || item.id === playlistId)
      if (!playlist) throw new Error('Playlist not found')

      playlist.songs = playlist.songs.filter((song) => song.id !== songId)
      playlist.updatedAt = now()
      return clone(playlist)
    },
    getYouTubeStatus() {
      return new Promise(() => {})
    },
    startYouTubeOAuth: vi.fn(),
    async syncPlaylistToYouTube() {
      return {
        success: true,
        youtubePlaylistId: 'yt-playlist',
        youtubePlaylistUrl: 'https://www.youtube.com/playlist?list=yt-playlist',
        addedCount: 0,
        skippedCount: 0,
        totalSongs: 0,
      }
    },
    async disconnectYouTube() {
      return { message: 'Disconnected from YouTube' }
    },
    async chatWithAI(prompt: string, playlistName?: string, genre = 'AI Mix') {
      const playlist = createMockPlaylist(genre, playlistName, [])
      playlists.push(playlist)
      return clone(playlist)
    },
    async login() {
      return { token: 'test-token', user: { id: 'user-1', name: 'Test User', email: 'test@example.com' } }
    },
    async register() {
      return { token: 'test-token', user: { id: 'user-1', name: 'Test User', email: 'test@example.com' } }
    },
    async getMe() {
      return { user: { id: 'user-1', name: 'Test User', email: 'test@example.com' } }
    },
    async deleteAccount() {
      return { message: 'Account deleted', deletedPlaylists: playlists.length }
    },
    async searchByGenre() {
      return []
    },
    async searchSongs() {
      return []
    },
  },
}))
