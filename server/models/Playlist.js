import mongoose from 'mongoose';

const songSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  artist: { type: String, required: true },
  genre: { type: String, default: '' },
  language: { type: String, default: 'English' },
  duration: { type: Number, default: 0 },
  isCustom: { type: Boolean, default: false },
  youtubeId: { type: String, default: '' },
});

const playlistSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  genre: { type: String, required: true },
  songs: [songSchema],
  isFavorite: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Playlist', playlistSchema);
