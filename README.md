# Grainola — AI-Powered Meeting Intelligence

Full-stack web application that records meetings, transcribes them with AI, generates summaries, and organises everything into a searchable workspace.

Built for the **AAST Web Engineering** course project (Spring 2026).

> 👤 **Solo author:** Paula Akram Samir — Student ID `221017681`

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (React 18) · TypeScript · Tailwind CSS · shadcn/ui · TanStack Query · Zustand |
| Backend | Node.js · Express · TypeScript · Mongoose · Zod · JWT |
| Database | MongoDB Atlas |
| AI | Groq Whisper (transcription) + Llama 3 (summarization) |
| Integrations | Google Calendar OAuth2 |

## Features

- 🎙️ Browser-based audio recording with live waveform
- 🔊 Multiple recordings per meeting (plan-based: 1 / 5 / unlimited)
- ▶︎ Playback any recording at any time, switch between recordings
- 📝 Automatic AI transcription (Groq Whisper)
- ✨ AI summaries, action items, key topics (Groq Llama 3)
- 🗂️ Folder organisation with drag-and-drop reorder
- 🔍 Full-text search across transcripts and titles
- 📅 Google Calendar import (upcoming events shown on dashboard)
- 💳 Subscription tiers — Free · Basic ($9.99) · Premium ($29.99)
- 🔐 JWT auth with refresh-token rotation
- 🖱️ Rename / delete meetings, delete individual recordings, move between folders inline

## Getting started

### Prerequisites
- Node.js 20+
- MongoDB Atlas connection string
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Backend
```bash
cd backend
# Fill in .env (MONGODB_URI, GROQ_API_KEY, JWT secrets)
npm install
npm run dev            # http://localhost:4000
```

### Frontend
```bash
cd frontend
npm install
npm run dev            # http://localhost:3000
```

## Project structure

```
backend/
  src/
    config/         # env, multer, db
    controllers/    # HTTP layer
    middleware/     # auth, rate-limit, plan limits, error handler
    models/         # Mongoose schemas (User, Meeting, Folder, RefreshToken)
    routes/         # Express routers
    services/       # business logic (auth, meeting, upload, calendar, transcription, summarisation, subscription)
    utils/          # helpers (logger, apiResponse)

frontend/
  src/
    app/
      (auth)/       # /login, /register
      (dashboard)/  # /dashboard, /meetings/:id, /folders, /calendar, /search, /pricing, /settings
    components/     # layout, meetings, transcript, folders, ui
    hooks/          # React Query hooks
    lib/            # api client, mediaUrl, utils
    store/          # Zustand stores (auth, ui)
```

## API overview

All endpoints under `/api/v1`. Protected routes require `Authorization: Bearer <token>`.

| Group | Routes |
|---|---|
| Auth | `POST /auth/register` `POST /auth/login` `POST /auth/refresh` `POST /auth/logout` `GET /auth/me` |
| Meetings | `GET /meetings` `POST /meetings` `GET /meetings/:id` `PUT /meetings/:id` `DELETE /meetings/:id` `PATCH /meetings/:id/move` |
| Recordings | `POST /recordings/upload` `DELETE /recordings/:id` |
| Folders | `GET /folders` `POST /folders` `PUT /folders/:id` `DELETE /folders/:id` `PUT /folders/reorder` |
| Subscription | `GET /subscription/plans` `GET /subscription/my-plan` `POST /subscription/subscribe` `POST /subscription/change-plan` |
| Calendar | `GET /calendar/oauth/connect` `GET /calendar/oauth/callback` `GET /calendar/events` `POST /calendar/import` `DELETE /calendar/disconnect` |
| Search | `GET /search?q=...` |

## License

Educational project — AAST Web Engineering, Spring 2026.
