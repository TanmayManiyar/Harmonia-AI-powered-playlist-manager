export interface Category {
  id: string;
  label: string;
  emoji: string;
  prompt: string;
  genre: string;
}

export interface CategoryGroup {
  title: string;
  items: Category[];
}

const m = (id: string, label: string, emoji: string, genre: string, prompt: string): Category => ({
  id, label, emoji, genre, prompt,
});

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    title: 'moods 🎭',
    items: [
      m('happy', 'Happy', '😄', 'Happy', 'An upbeat, feel-good playlist of joyful, sunny songs that put you in a great mood.'),
      m('chill', 'Chill', '😌', 'Chill', 'A laid-back chill playlist of mellow, relaxing songs for unwinding.'),
      m('sad', 'In My Feels', '😭', 'Sad', 'An emotional sad-hours playlist of heartbreak and melancholy songs.'),
      m('hype', 'Hype', '🔥', 'Hype', 'A high-energy hype playlist of bangers that go absolutely off.'),
      m('romance', 'Lovestruck', '💘', 'Romantic', 'A romantic playlist of swoony love songs for date night.'),
      m('focus', 'Lock In', '🎯', 'Focus', 'A focused, low-distraction playlist of instrumental and lo-fi songs for studying or work.'),
      m('party', 'Party', '🪩', 'Party', 'A party playlist of dancefloor anthems that keep the energy high.'),
      m('sleepy', 'Sleepy', '🌙', 'Ambient', 'A calm, dreamy playlist of soft songs to drift off to sleep.'),
      m('rage', 'Rage', '😤', 'Rock', 'An aggressive, high-octane playlist of rage and hard-hitting songs.'),
      m('nostalgia', 'Nostalgia', '📼', 'Throwback', 'A nostalgic throwback playlist of beloved songs that hit different.'),
    ],
  },
  {
    title: 'genres 🎸',
    items: [
      m('pop', 'Pop', '✨', 'Pop', 'A pop playlist of catchy, chart-topping pop songs.'),
      m('hiphop', 'Hip-Hop', '🎤', 'Hip Hop', 'A hip-hop playlist of essential rap and hip-hop tracks.'),
      m('rnb', 'R&B', '🍫', 'R&B', 'A smooth R&B playlist of soulful contemporary and classic R&B.'),
      m('edm', 'EDM', '🎛️', 'Electronic', 'An EDM playlist of festival-ready electronic dance bangers.'),
      m('rock', 'Rock', '🤘', 'Rock', 'A rock playlist of iconic rock anthems across the decades.'),
      m('indie', 'Indie', '🌻', 'Indie', 'An indie playlist of alternative and indie-pop gems.'),
      m('lofi', 'Lo-Fi', '🎧', 'Lo-Fi', 'A lo-fi playlist of chill beats to relax and study to.'),
      m('kpop', 'K-Pop', '💜', 'K-Pop', 'A K-pop playlist of popular Korean pop hits.'),
      m('jazz', 'Jazz', '🎷', 'Jazz', 'A jazz playlist of timeless jazz standards and modern jazz.'),
      m('metal', 'Metal', '⚡', 'Metal', 'A metal playlist of heavy, hard-hitting metal classics.'),
    ],
  },
  {
    title: 'languages 🌐',
    items: [
      m('english', 'English', '🇬🇧', 'Pop', 'A playlist of popular English-language songs.'),
      m('hindi', 'Hindi', '🇮🇳', 'Bollywood', 'A Hindi-language playlist of popular Bollywood and Hindi hits.'),
      m('spanish', 'Spanish', '🇪🇸', 'Latin', 'A Spanish-language playlist of popular Latin and Spanish songs.'),
      m('korean', 'Korean', '🇰🇷', 'K-Pop', 'A Korean-language playlist of K-pop and Korean hits.'),
      m('punjabi', 'Punjabi', '🪯', 'Punjabi', 'A Punjabi playlist of popular Punjabi and Desi hits.'),
      m('japanese', 'Japanese', '🇯🇵', 'J-Pop', 'A Japanese-language playlist of J-pop and city pop.'),
      m('french', 'French', '🇫🇷', 'Pop', 'A French-language playlist of chanson and French pop.'),
      m('tamil', 'Tamil', '🎬', 'Kollywood', 'A Tamil playlist of popular Tamil film and indie songs.'),
    ],
  },
  {
    title: 'around the world 🗺️',
    items: [
      m('bollywood', 'Bollywood', '🎬', 'Bollywood', 'A Bollywood playlist of iconic Hindi film songs.'),
      m('latin', 'Latin', '💃', 'Latin', 'A Latin playlist of reggaeton and Latin pop heat.'),
      m('afrobeats', 'Afrobeats', '🥁', 'Afrobeats', 'An Afrobeats playlist of the hottest African pop.'),
      m('arabic', 'Arabic', '🪕', 'Arabic', 'An Arabic playlist of popular Arabic pop songs.'),
      m('desi', 'Desi', '🌶️', 'Desi', 'A Desi playlist blending Punjabi, Hindi and South Asian hits.'),
      m('kwave', 'K-Wave', '🌊', 'K-Pop', 'A Korean-wave playlist of K-pop and K-R&B.'),
    ],
  },
  {
    title: 'charts & trending 📈',
    items: [
      m('globaltop', 'Global Top 50', '🌍', 'Global Top', 'The biggest global hit songs charting worldwide right now.'),
      m('viral', 'Viral Hits', '🦠', 'Viral', 'Viral songs blowing up on social media and short-form video right now.'),
      m('trending', 'Trending Now', '📈', 'Trending', 'The trending songs everyone is listening to this week.'),
      m('newdrops', 'New Drops', '🆕', 'New', 'Fresh new releases from the past few weeks.'),
      m('y2k', 'Y2K', '💿', 'Pop', 'A Y2K playlist of late-90s and early-2000s pop and hip-hop.'),
      m('2010s', '2010s Throwback', '🕺', 'Throwback', 'A 2010s throwback playlist of the decade biggest hits.'),
    ],
  },
];
