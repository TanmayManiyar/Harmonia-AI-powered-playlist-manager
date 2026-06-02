export const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

export const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');

export const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const isSongInput = (value) => {
  return Boolean(
    value &&
    typeof value === 'object' &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.artist)
  );
};

export const normalizeSong = (song, fallbackGenre = '') => ({
  id: normalizeString(song.id),
  title: normalizeString(song.title),
  artist: normalizeString(song.artist),
  genre: normalizeString(song.genre) || fallbackGenre,
  language: normalizeString(song.language) || 'English',
  duration: Number.isFinite(Number(song.duration)) ? Number(song.duration) : 0,
  isCustom: Boolean(song.isCustom),
  youtubeId: normalizeString(song.youtubeId),
});

export const parseSongList = (songs, fallbackGenre = '') => {
  if (songs === undefined) return [];
  if (!Array.isArray(songs)) return null;
  if (!songs.every(isSongInput)) return null;
  return songs.map((song) => normalizeSong(song, fallbackGenre));
};
