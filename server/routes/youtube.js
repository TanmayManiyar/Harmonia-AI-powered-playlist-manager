import express from 'express';
import axios from 'axios';
import { cacheGet, cacheSet } from '../services/cache.js';

const router = express.Router();
const YT_TTL = 60 * 60 * 1000; // 1h — caches successful YouTube results only

// Read API key at request time (not module load) because dotenv.config() hasn't run yet during ES module import hoisting
function getApiKey() {
  return process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY || '';
}
const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Vary search queries so same genre gets different results each time
const searchVariations = [
  'top songs', 'best songs', 'popular hits', 'greatest hits',
  'new songs', 'classic songs', 'trending songs', 'famous songs',
  'must listen', 'essential tracks', 'anthems', 'best ever',
];

function getRandomVariation() {
  return searchVariations[Math.floor(Math.random() * searchVariations.length)];
}

/**
 * GET /api/youtube/genre/:genre
 * Returns songs for a genre — uses YT API if key present, otherwise shuffled static data
 */
router.get('/genre/:genre', async (req, res) => {
  const genre = req.params.genre;
  const language = req.query.language || '';
  const maxResults = Math.min(parseInt(req.query.maxResults) || 10, 25);

  // For Hindi language, use bollywood static data regardless of genre
  if (!getApiKey()) {
    if (language.toLowerCase() === 'hindi') {
      return res.json(getStaticSongs('bollywood', maxResults));
    }
    return res.json(getStaticSongs(genre, maxResults));
  }

  // Cache by genre+language (not the random variation) so repeat browses are free
  const genreKey = `yt:genre:${genre.toLowerCase()}|${language.toLowerCase()}|${maxResults}`;
  const genreHit = cacheGet(genreKey);
  if (genreHit) return res.json(genreHit);

  try {
    // Build a language-aware search query
    const variation = getRandomVariation();
    let searchQuery = `${genre} ${variation}`;
    if (language && language.toLowerCase() !== 'english') {
      searchQuery = `${genre} ${language} songs ${variation}`;
    }

    const response = await axios.get(`${YOUTUBE_BASE_URL}/search`, {
      params: {
        part: 'snippet',
        q: searchQuery,
        type: 'video',
        videoCategoryId: '10',
        maxResults: maxResults + 5,
        key: getApiKey(),
      },
    });

    const songs = (response.data.items || []).map((item, index) => {
      const { songTitle, artist } = extractSongInfo(item.snippet.title);
      return {
        id: `yt-${item.id.videoId}-${Date.now()}-${index}`,
        title: songTitle,
        artist,
        genre: capitalizeGenre(genre),
        language: language || 'English',
        isCustom: false,
        duration: 0,
        youtubeId: item.id.videoId,
      };
    });

    const sliced = songs.slice(0, maxResults);
    cacheSet(genreKey, sliced, YT_TTL);
    res.json(sliced);
  } catch (error) {
    console.error('YouTube API error:', error.response?.data || error.message);
    if (language.toLowerCase() === 'hindi') {
      return res.json(getStaticSongs('bollywood', maxResults));
    }
    res.json(getStaticSongs(genre, maxResults));
  }
});

/**
 * GET /api/youtube/search?q=...&genre=...
 * Search songs by text query and optional genre filter
 */
router.get('/search', async (req, res) => {
  const query = (req.query.q || '').toString().trim();
  const genre = (req.query.genre || '').toString().trim();
  const maxResults = Math.min(parseInt(req.query.maxResults) || 10, 25);

  if (!query && !genre) return res.json([]);

  if (!getApiKey()) {
    return res.json(searchStaticSongs(query, genre, maxResults));
  }

  const searchKey = `yt:search:${query.toLowerCase()}|${genre.toLowerCase()}|${maxResults}`;
  const searchHit = cacheGet(searchKey);
  if (searchHit) return res.json(searchHit);

  try {
    const searchQuery = [query, genre, 'music'].filter(Boolean).join(' ');
    const response = await axios.get(`${YOUTUBE_BASE_URL}/search`, {
      params: {
        part: 'snippet',
        q: searchQuery,
        type: 'video',
        videoCategoryId: '10',
        maxResults,
        key: getApiKey(),
      },
    });

    const songs = (response.data.items || []).map((item, index) => {
      const { songTitle, artist } = extractSongInfo(item.snippet.title);
      return {
        id: `yt-${item.id.videoId}-${Date.now()}-${index}`,
        title: songTitle,
        artist,
        genre: capitalizeGenre(genre || ''),
        language: 'English',
        isCustom: false,
        duration: 0,
        youtubeId: item.id.videoId,
      };
    });

    cacheSet(searchKey, songs, YT_TTL);
    res.json(songs);
  } catch (error) {
    console.error('YouTube search error:', error.response?.data || error.message);
    res.json(searchStaticSongs(query, genre, maxResults));
  }
});

/**
 * GET /api/youtube/resolve?title=...&artist=...
 * Resolve ONE song to a YouTube video id (cached). Called lazily when a song
 * without a stored id is played, so playlists cost zero quota until listened to.
 */
router.get('/resolve', async (req, res) => {
  const title = (req.query.title || '').toString().trim();
  const artist = (req.query.artist || '').toString().trim();
  if (!title) return res.json({ youtubeId: '' });

  const key = `yt:resolve:${title.toLowerCase()}|${artist.toLowerCase()}`;
  const hit = cacheGet(key);
  if (hit !== undefined) return res.json({ youtubeId: hit });

  if (!getApiKey()) return res.json({ youtubeId: '' });

  try {
    const r = await axios.get(`${YOUTUBE_BASE_URL}/search`, {
      params: { part: 'snippet', q: `${title} ${artist} audio`, type: 'video', videoCategoryId: '10', maxResults: 1, key: getApiKey() },
    });
    const id = r.data.items?.[0]?.id?.videoId || '';
    if (id) cacheSet(key, id, 24 * 60 * 60 * 1000); // cache hits for a day
    res.json({ youtubeId: id });
  } catch (error) {
    console.error('YouTube resolve error:', error.response?.data?.error?.message || error.message);
    res.json({ youtubeId: '' });
  }
});

// ---- Helpers ----

function extractSongInfo(videoTitle) {
  let cleaned = videoTitle
    .replace(/\(Official.*?\)/gi, '')
    .replace(/\[Official.*?\]/gi, '')
    .replace(/\(Lyric.*?\)/gi, '')
    .replace(/\[Lyric.*?\]/gi, '')
    .replace(/\(Audio\)/gi, '')
    .replace(/\[Audio\]/gi, '')
    .replace(/\(Music Video\)/gi, '')
    .replace(/\[Music Video\]/gi, '')
    .replace(/\(HD\)/gi, '')
    .replace(/\[HD\]/gi, '')
    .replace(/\(Visuali[sz]er\)/gi, '')
    .replace(/\[Visuali[sz]er\]/gi, '')
    .trim();

  if (cleaned.includes(' - ')) {
    const parts = cleaned.split(' - ');
    return { artist: parts[0]?.trim() || 'Unknown Artist', songTitle: parts.slice(1).join(' - ').trim() || cleaned };
  } else if (cleaned.includes(' by ')) {
    const parts = cleaned.split(' by ');
    return { songTitle: parts[0]?.trim() || cleaned, artist: parts[1]?.trim() || 'Unknown Artist' };
  }

  return { songTitle: cleaned, artist: 'Various Artists' };
}

function capitalizeGenre(genre) {
  if (!genre) return '';
  return genre.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

/** Shuffle array in place (Fisher-Yates) */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---- Large static song database ----
const ALL_SONGS = {
  rock: [
    { title: 'Bohemian Rhapsody', artist: 'Queen' },
    { title: 'Stairway to Heaven', artist: 'Led Zeppelin' },
    { title: 'Hotel California', artist: 'Eagles' },
    { title: "Sweet Child O' Mine", artist: "Guns N' Roses" },
    { title: 'Smells Like Teen Spirit', artist: 'Nirvana' },
    { title: 'Back in Black', artist: 'AC/DC' },
    { title: 'Dream On', artist: 'Aerosmith' },
    { title: 'November Rain', artist: "Guns N' Roses" },
    { title: 'Paradise City', artist: "Guns N' Roses" },
    { title: 'Enter Sandman', artist: 'Metallica' },
    { title: 'Comfortably Numb', artist: 'Pink Floyd' },
    { title: 'Whole Lotta Love', artist: 'Led Zeppelin' },
    { title: 'Born to Run', artist: 'Bruce Springsteen' },
    { title: "Livin' on a Prayer", artist: 'Bon Jovi' },
    { title: 'Thunderstruck', artist: 'AC/DC' },
    { title: 'Crazy Train', artist: 'Ozzy Osbourne' },
    { title: 'Paint It Black', artist: 'The Rolling Stones' },
    { title: 'Purple Haze', artist: 'Jimi Hendrix' },
    { title: 'More Than a Feeling', artist: 'Boston' },
    { title: 'Wanted Dead or Alive', artist: 'Bon Jovi' },
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
    { title: 'Rolling in the Deep', artist: 'Adele' },
    { title: 'Shake It Off', artist: 'Taylor Swift' },
    { title: 'Cruel Summer', artist: 'Taylor Swift' },
    { title: 'Bad Guy', artist: 'Billie Eilish' },
    { title: 'Watermelon Sugar', artist: 'Harry Styles' },
    { title: 'Stay', artist: 'The Kid LAROI & Justin Bieber' },
    { title: 'Peaches', artist: 'Justin Bieber' },
    { title: "Don't Start Now", artist: 'Dua Lipa' },
    { title: 'drivers license', artist: 'Olivia Rodrigo' },
    { title: 'good 4 u', artist: 'Olivia Rodrigo' },
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
    { title: 'A Love Supreme', artist: 'John Coltrane' },
    { title: 'Feeling Good', artist: 'Nina Simone' },
    { title: 'Misty', artist: 'Erroll Garner' },
    { title: 'In a Sentimental Mood', artist: 'Duke Ellington' },
    { title: 'All Blues', artist: 'Miles Davis' },
    { title: 'Birdland', artist: 'Weather Report' },
    { title: 'Moanin', artist: 'Art Blakey' },
    { title: 'Spain', artist: 'Chick Corea' },
    { title: 'Cantaloupe Island', artist: 'Herbie Hancock' },
    { title: 'Freddie Freeloader', artist: 'Miles Davis' },
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
    { title: 'Flight of the Bumblebee', artist: 'Rimsky-Korsakov' },
    { title: 'Nocturne Op. 9 No. 2', artist: 'Chopin' },
    { title: 'Bolero', artist: 'Ravel' },
    { title: 'Hungarian Rhapsody No. 2', artist: 'Liszt' },
    { title: '1812 Overture', artist: 'Tchaikovsky' },
    { title: 'Swan Lake', artist: 'Tchaikovsky' },
    { title: 'The Nutcracker', artist: 'Tchaikovsky' },
    { title: 'Requiem - Lacrimosa', artist: 'Mozart' },
    { title: 'Air on the G String', artist: 'Bach' },
    { title: 'Toccata and Fugue', artist: 'Bach' },
  ],
  'hip hop': [
    { title: 'Lose Yourself', artist: 'Eminem' },
    { title: 'HUMBLE.', artist: 'Kendrick Lamar' },
    { title: 'Sicko Mode', artist: 'Travis Scott' },
    { title: "God's Plan", artist: 'Drake' },
    { title: 'Old Town Road', artist: 'Lil Nas X' },
    { title: 'Hotline Bling', artist: 'Drake' },
    { title: 'Stronger', artist: 'Kanye West' },
    { title: 'In Da Club', artist: '50 Cent' },
    { title: 'Empire State of Mind', artist: 'Jay-Z' },
    { title: 'Juicy', artist: 'The Notorious B.I.G.' },
    { title: 'N.Y. State of Mind', artist: 'Nas' },
    { title: 'Alright', artist: 'Kendrick Lamar' },
    { title: 'Runaway', artist: 'Kanye West' },
    { title: 'Still D.R.E.', artist: 'Dr. Dre ft. Snoop Dogg' },
    { title: 'Ms. Jackson', artist: 'OutKast' },
    { title: 'INDUSTRY BABY', artist: 'Lil Nas X' },
    { title: 'DNA.', artist: 'Kendrick Lamar' },
    { title: 'Money Trees', artist: 'Kendrick Lamar' },
    { title: 'Started From the Bottom', artist: 'Drake' },
    { title: 'Power', artist: 'Kanye West' },
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
    { title: 'Get Lucky', artist: 'Daft Punk' },
    { title: 'Midnight City', artist: 'M83' },
    { title: 'Lean On', artist: 'Major Lazer' },
    { title: 'This Is What You Came For', artist: 'Calvin Harris' },
    { title: 'Summer', artist: 'Calvin Harris' },
    { title: 'Alone', artist: 'Marshmello' },
    { title: 'Shelter', artist: 'Porter Robinson & Madeon' },
    { title: 'The Middle', artist: 'Zedd' },
    { title: 'Something Just Like This', artist: 'The Chainsmokers' },
    { title: 'Roses', artist: 'The Chainsmokers' },
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
    { title: 'The Dance', artist: 'Garth Brooks' },
    { title: 'Humble and Kind', artist: 'Tim McGraw' },
    { title: 'Girl Crush', artist: 'Little Big Town' },
    { title: 'Chicken Fried', artist: 'Zac Brown Band' },
    { title: 'Need You Now', artist: 'Lady A' },
    { title: 'Meant to Be', artist: 'Bebe Rexha & FGL' },
    { title: 'She Talks to Angels', artist: 'The Black Crowes' },
    { title: 'Amarillo by Morning', artist: 'George Strait' },
    { title: 'Live Like You Were Dying', artist: 'Tim McGraw' },
    { title: 'Bless the Broken Road', artist: 'Rascal Flatts' },
  ],
  'r&b': [
    { title: 'No Scrubs', artist: 'TLC' },
    { title: "I Will Always Love You", artist: 'Whitney Houston' },
    { title: 'Halo', artist: 'Beyoncé' },
    { title: "Say My Name", artist: "Destiny's Child" },
    { title: 'Crazy in Love', artist: 'Beyoncé' },
    { title: "If I Ain't Got You", artist: 'Alicia Keys' },
    { title: "End of the Road", artist: 'Boyz II Men' },
    { title: 'Superstition', artist: 'Stevie Wonder' },
    { title: "Isn't She Lovely", artist: 'Stevie Wonder' },
    { title: 'Kiss from a Rose', artist: 'Seal' },
  ],
  bollywood: [
    { title: 'Tum Hi Ho', artist: 'Arijit Singh' },
    { title: 'Kal Ho Naa Ho', artist: 'Sonu Nigam' },
    { title: 'Chaiyya Chaiyya', artist: 'Sukhwinder Singh' },
    { title: 'Tere Bina', artist: 'A.R. Rahman' },
    { title: 'Jai Ho', artist: 'A.R. Rahman' },
    { title: 'Dil Se Re', artist: 'A.R. Rahman' },
    { title: 'Kabira', artist: 'Arijit Singh & Tochi Raina' },
    { title: 'Kesariya', artist: 'Arijit Singh' },
    { title: 'Channa Mereya', artist: 'Arijit Singh' },
    { title: 'Ranjha', artist: 'B Praak' },
    { title: 'Tujh Mein Rab Dikhta Hai', artist: 'Roop Kumar Rathod' },
    { title: 'Kun Faya Kun', artist: 'A.R. Rahman & Javed Ali' },
    { title: 'Tera Ban Jaunga', artist: 'Akhil Sachdeva & Tulsi Kumar' },
    { title: 'Raataan Lambiyan', artist: 'Jubin Nautiyal & Asees Kaur' },
    { title: 'Deva Deva', artist: 'Arijit Singh & Jonita Gandhi' },
    { title: 'Apna Bana Le', artist: 'Arijit Singh' },
    { title: 'Maa Tujhe Salaam', artist: 'A.R. Rahman' },
    { title: 'Phir Le Aya Dil', artist: 'Arijit Singh' },
    { title: 'Rang De Basanti', artist: 'A.R. Rahman & Daler Mehndi' },
    { title: 'Ae Dil Hai Mushkil', artist: 'Arijit Singh' },
  ],
  metal: [
    { title: 'Master of Puppets', artist: 'Metallica' },
    { title: 'Hallowed Be Thy Name', artist: 'Iron Maiden' },
    { title: 'Ace of Spades', artist: 'Motörhead' },
    { title: 'Paranoid', artist: 'Black Sabbath' },
    { title: 'One', artist: 'Metallica' },
    { title: 'Raining Blood', artist: 'Slayer' },
    { title: 'War Pigs', artist: 'Black Sabbath' },
    { title: 'Holy Wars', artist: 'Megadeth' },
    { title: 'Chop Suey!', artist: 'System of a Down' },
    { title: 'The Trooper', artist: 'Iron Maiden' },
  ],
  latin: [
    { title: 'Despacito', artist: 'Luis Fonsi ft. Daddy Yankee' },
    { title: 'Bailando', artist: 'Enrique Iglesias' },
    { title: 'Vivir Mi Vida', artist: 'Marc Anthony' },
    { title: 'La Bicicleta', artist: 'Shakira & Carlos Vives' },
    { title: 'Danza Kuduro', artist: 'Don Omar' },
    { title: 'Hips Don\'t Lie', artist: 'Shakira' },
    { title: 'Mi Gente', artist: 'J Balvin' },
    { title: 'Gasolina', artist: 'Daddy Yankee' },
    { title: 'Reggaetón Lento', artist: 'CNCO' },
    { title: 'La Tortura', artist: 'Shakira' },
  ],
};

// Aliases — 'hindi' maps to bollywood songs
ALL_SONGS['hindi'] = ALL_SONGS['bollywood'];

/**
 * Get static songs for a genre — shuffled and sliced so each call returns a different set
 */
function getStaticSongs(genre, count = 10) {
  const genreLower = (genre || '').toLowerCase();
  let pool = ALL_SONGS[genreLower];

  if (!pool) {
    // Combine a random mix from all genres for unknown genres
    const allSongs = Object.values(ALL_SONGS).flat();
    pool = shuffle([...allSongs]).slice(0, 20);
  }

  // Shuffle and take 'count' songs — different each call
  const shuffled = shuffle([...pool]);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return selected.map((t, i) => ({
    id: `static-${genreLower}-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
    title: t.title,
    artist: t.artist,
    genre: capitalizeGenre(genre),
    language: 'English',
    isCustom: false,
    duration: 180 + Math.floor(Math.random() * 120),
  }));
}

/**
 * Search static songs by query text across all genres
 */
function searchStaticSongs(query, genre, count = 10) {
  const q = (query || '').toLowerCase();
  const g = (genre || '').toLowerCase();

  // Collect all songs, optionally filtered by genre
  let pool = [];
  if (g && ALL_SONGS[g]) {
    pool = ALL_SONGS[g].map(s => ({ ...s, genre: capitalizeGenre(g) }));
  } else {
    for (const [genreKey, songs] of Object.entries(ALL_SONGS)) {
      songs.forEach(s => pool.push({ ...s, genre: capitalizeGenre(genreKey) }));
    }
  }

  // Filter by query text (match title or artist)
  if (q) {
    pool = pool.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q)
    );
  }

  // Shuffle results so they're not always in the same order
  shuffle(pool);

  return pool.slice(0, count).map((t, i) => ({
    id: `search-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
    title: t.title,
    artist: t.artist,
    genre: t.genre,
    language: 'English',
    isCustom: false,
    duration: 180 + Math.floor(Math.random() * 120),
  }));
}

export default router;
