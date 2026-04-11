# YouTube API Setup Guide

This app uses the YouTube Data API v3 to search for real songs by genre.

## Getting Your YouTube API Key

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create a New Project** (or select existing)
   - Click "Select a project" → "New Project"
   - Name it (e.g., "Playlist Manager")
   - Click "Create"

3. **Enable YouTube Data API v3**
   - Go to "APIs & Services" → "Library"
   - Search for "YouTube Data API v3"
   - Click on it and press "Enable"

4. **Create API Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the generated API key

5. **Configure the App**
   - Create a `.env` file in the project root
   - Add: `VITE_YOUTUBE_API_KEY=your_api_key_here`
   - Replace `your_api_key_here` with your actual API key

## Usage Limits

- **Free Tier**: 10,000 quota units per day
- **Search operation**: 100 units per request
- **Approximately**: 100 searches per day for free

## Fallback Behavior

If the API key is not configured or quota is exceeded, the app will automatically fall back to using a curated static database of popular songs.

## Security Note

Never commit your `.env` file to version control. The `.gitignore` file is already configured to exclude it.
