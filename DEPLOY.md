# Deploying Harmonia

Harmonia ships as a **single service**: the Express server serves both the API
(`/api/*`) and the built React frontend (everything else). One deploy, one
origin, no CORS headaches.

```
[ Browser ] ──► [ Render web service ]  ── /api/* ──► Express
                       │                  else      └─► dist/index.html (SPA)
                       └──► [ MongoDB Atlas ]  +  Gemini / YouTube APIs
```

---

## 1. MongoDB Atlas (your database)

1. Create a free account → **Build a Database** → **M0 (free, 512 MB)**.
2. **Database Access** → add a database user (username + password).
3. **Network Access** → add IP `0.0.0.0/0` (allow from anywhere — Render's
   outbound IPs are dynamic; the DB is still protected by the user/password).
4. **Connect → Drivers** → copy the connection string, e.g.
   `mongodb+srv://USER:PASSWORD@cluster0.xxxx.mongodb.net/playlist-manager`
   (add `/playlist-manager` before the `?` so it uses that database).

> Migrating local data (optional): `mongodump` locally, then `mongorestore --uri "<atlas-uri>"`.

## 2. Environment variables (production)

Set these on the host (Render → **Environment**). **Do not commit secrets.**

| Var | Value |
|---|---|
| `MONGODB_URI` | your Atlas connection string |
| `JWT_SECRET` | long random string — `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `GEMINI_API_KEY` | your Google AI key |
| `GEMINI_MODEL` | `gemini-2.5-flash-lite` (optional) |
| `YOUTUBE_API_KEY` | your YouTube Data API v3 key |
| `CLIENT_URL` | `https://YOUR-APP.onrender.com` |
| `VITE_API_BASE_URL` | `/api`  ← important: relative, since same origin |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | from Google Cloud (for YouTube sync) |
| `GOOGLE_REDIRECT_URI` | `https://YOUR-APP.onrender.com/api/youtube/oauth/callback` |

> `PORT` is provided by the host automatically — don't set it.
> `VITE_API_BASE_URL` is read at **build time**, so it must be present when the
> build runs (Render exposes env vars to the build step).

## 3. Deploy on Render (single host)

1. Push this repo to GitHub.
2. Render → **New → Web Service** → connect the repo.
3. Settings:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run server`
   - **Instance type:** Free is fine to start (note: free instances sleep after
     ~15 min idle and cold-start in ~30 s).
4. Add the environment variables from step 2 → **Create Web Service**.

The server detects `dist/` and serves the frontend automatically.
(Railway / Fly.io work the same way with these two commands.)

## 4. Google Cloud — billing + OAuth

- **Enable billing** on the Google Cloud project behind your keys. Free tiers
  (Gemini ~20–1000/day depending on model, YouTube ~100 searches/day) won't
  survive multiple users. Pay-as-you-go is a few cents at this scale.
- **YouTube sync OAuth:** in Google Cloud → Credentials → your OAuth client →
  **Authorized redirect URIs**, add:
  `https://YOUR-APP.onrender.com/api/youtube/oauth/callback`

## 5. Seed featured playlists (so "Trending rn" isn't empty)

Run once against the production DB (locally, with `MONGODB_URI` pointed at Atlas
and `YOUTUBE_API_KEY` set so songs are playable):

```bash
MONGODB_URI="<atlas-uri>" YOUTUBE_API_KEY="<key>" npm run seed
```

Re-running refreshes the featured set (idempotent).

## 6. Test the production build locally

```bash
npm run build      # produces dist/
npm run server     # Express serves dist/ + /api on http://localhost:5000
```

Open `http://localhost:5000` — you're hitting the exact same setup as prod.

---

### Checklist before going public
- [ ] Atlas cluster + DB user + network access
- [ ] All env vars set on the host (strong `JWT_SECRET`!)
- [ ] `VITE_API_BASE_URL=/api`
- [ ] Google billing enabled
- [ ] OAuth redirect URI updated
- [ ] `npm run seed` run against Atlas
- [ ] Rate limiting is already on (auth/AI/search)
