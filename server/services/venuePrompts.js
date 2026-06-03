// Curated, hand-tuned prompts per venue. Each entry drives Gemini toward a
// specific energy/tempo/lyrical profile so a one-tap playlist feels right.

export const VENUES = {
  cafe: {
    label: 'Cafe',
    prompt:
      'A relaxed cafe playlist: mellow indie, acoustic, soft pop and light jazz. Mid-low tempo, warm and unobtrusive, good for conversation and laptops. Mostly easy-listening with tasteful vocals.',
  },
  'coffee-shop': {
    label: 'Coffee Shop',
    prompt:
      'A cozy coffee shop playlist: lo-fi, acoustic singer-songwriter, soft indie folk and gentle neo-soul. Calm, warm, low-key background music.',
  },
  restaurant: {
    label: 'Restaurant',
    prompt:
      'A tasteful restaurant dinner playlist: smooth jazz, bossa nova, soulful lounge and refined acoustic. Sophisticated, low-volume, elegant background ambience.',
  },
  bar: {
    label: 'Bar & Pub',
    prompt:
      'A lively bar and pub playlist: feel-good rock, indie anthems, classic crowd-pleasers and upbeat soul. Energetic but singable, great for a buzzing evening crowd.',
  },
  gym: {
    label: 'Gym',
    prompt:
      'A high-energy gym workout playlist: driving EDM, hype hip-hop, big electronic drops and motivational bangers. Fast tempo (120-140 BPM feel), powerful and relentless.',
  },
  hotel: {
    label: 'Hotel Lobby',
    prompt:
      'A polished hotel lobby playlist: chic downtempo, deep house, sophisticated lounge and elegant electronica. Smooth, modern, welcoming and understated.',
  },
  office: {
    label: 'Office',
    prompt:
      'A focused office playlist: instrumental lo-fi, ambient electronic, mellow indie and light acoustic. Non-distracting, steady, good for concentration.',
  },
  spa: {
    label: 'Spa',
    prompt:
      'A serene spa playlist: ambient, instrumental, soft piano, nature-inspired and meditative soundscapes. Slow, calming, zero aggressive vocals — pure relaxation.',
  },
  salon: {
    label: 'Beauty Salon',
    prompt:
      'A stylish beauty salon playlist: breezy pop, chic house, feel-good R&B and modern indie. Fresh, fashionable and upbeat without being overwhelming.',
  },
  store: {
    label: 'Retail Store',
    prompt:
      'An upbeat retail store playlist: contemporary pop, fun indie, light dance and feel-good hits. Bright, current and energizing to keep shoppers moving.',
  },
  casino: {
    label: 'Casino',
    prompt:
      'A glamorous casino playlist: slick lounge, classic swing, energetic funk and luxe pop. Exciting, upscale and high-roller cool.',
  },
  healthcare: {
    label: 'Healthcare',
    prompt:
      'A soothing healthcare waiting-room playlist: gentle acoustic, soft piano, calm instrumental and light classical. Reassuring, quiet and stress-reducing.',
  },
  events: {
    label: 'Events',
    prompt:
      'A celebratory events playlist: crowd-pleasing party hits, dance-pop, funk and timeless anthems across decades. Upbeat and inclusive for a mixed crowd.',
  },
  fashion: {
    label: 'Fashion',
    prompt:
      'A runway-ready fashion playlist: edgy electronic, confident hip-hop, dark pop and stylish house. Bold, modern and trend-forward with attitude.',
  },
  supermarket: {
    label: 'Supermarket',
    prompt:
      'A pleasant supermarket playlist: familiar soft pop, easy listening and gentle classics across eras. Friendly, mellow and broadly likeable background music.',
  },
  other: {
    label: 'Anything',
    prompt:
      'A versatile, broadly appealing playlist of well-loved songs across popular genres. Balanced energy, great variety and high relevance for a general audience.',
  },
};

/** Ordered list for the UI grid. */
export const VENUE_LIST = Object.entries(VENUES).map(([id, v]) => ({ id, label: v.label }));
