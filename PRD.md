# Grainola — Product Requirements Document (PRD)

## 1. Product Overview

**Grainola** is an AI-powered meeting intelligence web application. Users record
(or upload) meeting audio, and the system automatically transcribes it, generates
an AI summary with action items and key topics, and stores everything in a
searchable, folder-organized workspace.

- **Production frontend:** https://grainola1.vercel.app
- **Production backend (API):** https://grainola-api.onrender.com
- **API base path:** `/api/v1`
- **Primary users:** professionals, students, and teams who attend frequent meetings and want automatic notes instead of manual note-taking.

### Problem it solves
Manually taking notes during meetings is distracting and error-prone. Grainola
captures the audio, turns it into an accurate transcript, and produces a concise
AI summary — so the user can stay present and still have a complete, searchable
record afterward.

---

## 2. Tech Stack (for context)

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Zustand |
| Backend | Node.js 20, Express, TypeScript, Mongoose, Zod |
| Database | MongoDB Atlas |
| AI | Groq Whisper (speech-to-text) + Groq Llama 3 (summarization) |
| Auth | JWT access tokens (15 min) + refresh-token rotation (7 days); Google & GitHub OAuth |
| File storage | Local disk on the backend (`/uploads`), served statically |

---

## 3. User Roles

| Role | Description |
|------|-------------|
| **Guest (unauthenticated)** | Can view the landing page, pricing page, and the login/register screens only. All dashboard routes redirect to `/login`. |
| **Authenticated user** | Full access to their own workspace: meetings, folders, recordings, search, calendar, subscription, and settings. All data is strictly scoped to the logged-in user. |

There is no admin role. Every user only ever sees and modifies their own data.

---

## 4. Subscription Plans

The plan controls how many recordings a user may attach to a single meeting,
plus storage and AI-operation quotas. Limits are enforced server-side.

| Plan | Price/mo | Recordings per meeting | Storage | AI ops/month |
|------|----------|------------------------|---------|--------------|
| **Free** | $0 | 1 | 1 GB | 10 |
| **Basic** | $9.99 | 5 | 10 GB | 100 |
| **Premium** | $29.99 | Unlimited | Unlimited | Unlimited |

- New users start on **Free**.
- Exceeding the per-meeting recording limit returns **HTTP 403** with a message like *"Your plan allows N recording(s) per meeting. Upgrade to add more."*
- Changing plans takes effect immediately.

---

## 5. Core Features & User Flows

### 5.1 Authentication

**Register (email/password)**
1. Guest opens `/register`.
2. Enters full name (min 2 chars), email, password (min 8 chars).
3. On submit → account created, default "All Meetings" folder auto-created, user is logged in and redirected to `/dashboard`.
4. Duplicate email returns an error shown in a red banner.

**Login (email/password)**
1. Guest opens `/login`, enters email + password.
2. Valid credentials → redirected to `/dashboard`.
3. Invalid credentials → red error banner "Invalid email or password".
4. After 30 failed attempts in 15 minutes the endpoint is rate-limited.

**OAuth login (Google / GitHub)**
1. Guest clicks "Continue with Google" or "Continue with GitHub" on `/login` or `/register`.
2. Redirected to the provider, authorizes, redirected back through the backend callback.
3. Backend finds-or-creates the user and issues app JWTs.
4. User lands on `/dashboard` authenticated.
5. If GitHub is not configured server-side, the user is returned to `/login` with a visible error banner.

**Session management**
- Access token expires after 15 minutes; the frontend transparently refreshes it via the refresh token — the user is NOT logged out mid-session.
- Logout clears tokens and returns the user to `/login`.
- Visiting any `/dashboard/*` route while unauthenticated redirects to `/login`.

### 5.2 Dashboard

1. Authenticated user lands on `/dashboard`.
2. Sees an "Upcoming from Google Calendar" widget at the top (only if calendar is connected; otherwise it is hidden or shows a connect prompt).
3. Sees a "Recent Meetings" list showing each meeting's title, folder, status, and relative date.
4. Empty state ("No meetings yet") appears when the user has no meetings.

### 5.3 Create a meeting + record audio

1. User clicks "New Meeting" (top bar).
2. A dialog opens with: meeting title (required), meeting date (defaults to now, editable), folder selector.
3. User clicks the mic button to start recording; a live waveform and timer appear.
4. User clicks stop; can preview the recording or discard it.
5. User clicks "Save & Process".
6. Backend creates the meeting (status `PENDING`), stores the audio, and starts async processing.
7. Status transitions: `PENDING` → `PROCESSING` → `COMPLETED` (or `FAILED`).
8. The meeting detail page polls every 5 seconds while `PROCESSING` and stops when done.

### 5.4 Meeting detail page

1. User opens a meeting from the list.
2. Header shows title, date, duration, and a **folder dropdown that moves the meeting** between folders inline.
3. An audio player plays the active recording (play/pause, seek, skip ±10s, volume).
4. A "Recordings" list shows every recording attached to the meeting; clicking one makes it the active player source.
5. "Add Recording" opens the recorder dialog to attach another recording (subject to the plan limit).
6. Each recording has a trash icon → inline "Delete this recording? Cancel / Delete" confirm.
7. Tabs: **Transcript** (full text + timestamped segments) and **AI Summary** (short summary, bullet points, action items, key topics).

### 5.5 Rename / delete a meeting

1. On a meeting card, the "⋯" (three-dots) menu opens a popover.
2. **Rename** → dialog to edit the title.
3. **Delete** → confirmation dialog; deleting removes the meeting and all its recordings, transcript, summary, and highlights permanently.

### 5.6 Folders

1. Sidebar shows all folders with per-folder meeting counts; "All Meetings" is the default folder (cannot be renamed or deleted).
2. "+" creates a new folder (name + color).
3. Folders can be renamed, recolored, deleted (deleting moves its meetings to the default folder), and reordered via drag-and-drop.
4. Clicking a folder filters the dashboard to that folder's meetings.

### 5.7 Search

1. User opens `/search`.
2. Typing at least 2 characters searches across meeting titles and transcript segment text.
3. Results show matching meetings/segments; empty query shows a prompt.

### 5.8 Google Calendar integration

1. User opens `/calendar` (or the dashboard widget).
2. If not connected, clicks "Connect Google Calendar" → OAuth consent → redirected back connected.
3. Upcoming events are listed; user selects events and clicks "Import" to create meetings from them.
4. Import failures show a clear error message; already-imported events are skipped.

### 5.9 Subscription / pricing

1. User opens `/pricing` (or "Upgrade" in the sidebar).
2. Sees the three plan cards with the current plan marked.
3. Selecting a different plan changes the subscription immediately.
4. `/settings` shows the current plan and a link to manage it.

### 5.10 Settings & profile

1. Sidebar footer shows the user's avatar, name, email, and a sign-out button.
2. `/settings` shows profile info, current subscription, Google Calendar integration status, and a sign-out action.

---

## 6. API Endpoints (all prefixed with `/api/v1`)

Protected routes require an `Authorization: Bearer <accessToken>` header.

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | Public | Create account; returns user + tokens |
| POST | `/auth/login` | Public | Log in; returns user + tokens |
| POST | `/auth/refresh` | Public | Exchange refresh token for a new access token (rotates) |
| POST | `/auth/logout` | JWT | Invalidate the refresh token |
| GET | `/auth/me` | JWT | Get the current user profile |
| GET | `/auth/oauth/google` | Public | Begin Google OAuth login |
| GET | `/auth/oauth/github` | Public | Begin GitHub OAuth login |
| GET | `/auth/oauth/github/callback` | Public | GitHub OAuth callback |

### Meetings
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/meetings` | JWT | List meetings (supports `page`, `limit`, `folderId`, `search`, `status`) |
| POST | `/meetings` | JWT | Create a meeting (`title`, optional `folderId`, `meetingDate`) |
| GET | `/meetings/:id` | JWT | Get one meeting with recordings, transcript, summary, highlights |
| PUT | `/meetings/:id` | JWT | Update title/description/folder/date |
| DELETE | `/meetings/:id` | JWT | Delete a meeting and all its nested data |
| PATCH | `/meetings/:id/move` | JWT | Move a meeting to another folder |
| POST | `/meetings/:id/highlights` | JWT | Add a highlight |
| DELETE | `/meetings/:id/highlights/:highlightId` | JWT | Remove a highlight |

### Recordings
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/recordings/upload` | JWT | Upload a recording (base64 audio) to a meeting; enforces plan limit; triggers transcription |
| DELETE | `/recordings/:recordingId` | JWT | Delete a single recording from its meeting |

### Folders
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/folders` | JWT | List folders with meeting counts |
| POST | `/folders` | JWT | Create a folder (`name`, optional `color`) |
| PUT | `/folders/:id` | JWT | Rename/recolor a folder (default folder cannot be renamed) |
| DELETE | `/folders/:id` | JWT | Delete a folder (default folder cannot be deleted) |
| PUT | `/folders/reorder` | JWT | Reorder folders by an ordered ID list |

### Subscription
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/subscription/plans` | Public | List the three plans and their limits |
| GET | `/subscription/my-plan` | JWT | Get the current user's subscription + plan |
| POST | `/subscription/subscribe` | JWT | Subscribe to a plan (`plan`: free/basic/premium) |
| POST | `/subscription/change-plan` | JWT | Change the current plan (`plan`) |

### Calendar
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/calendar/oauth/connect` | Token via query | Begin Google Calendar OAuth |
| GET | `/calendar/oauth/callback` | Public | Calendar OAuth callback |
| GET | `/calendar/events` | JWT | List upcoming Google Calendar events |
| POST | `/calendar/import` | JWT | Import selected events as meetings (`eventIds`) |
| DELETE | `/calendar/disconnect` | JWT | Disconnect Google Calendar |

### Search & health
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/search?q=...` | JWT | Full-text search across titles and transcripts |
| GET | `/health` | Public | Health check (returns `{ status: "ok" }`) |

---

## 7. Data Model (key entities)

**User:** `email`, `passwordHash`, `name`, `googleId`, `githubId`, `subscription { plan, startedAt, expiresAt }`.

**Folder:** `userId`, `name`, `color`, `isDefault`, `position`.

**Meeting:** `userId`, `folderId`, `title`, `description`, `meetingDate`,
`status` (PENDING | PROCESSING | COMPLETED | FAILED), `durationSeconds`, and
embedded sub-documents:
- `recordings[]`: `{ s3Url, localPath, fileName, fileSize, mimeType, isActive, createdAt }`
- `transcript`: `{ fullText, language, status, segments[], speakers[] }`
- `summary`: `{ shortText, bulletPoints[], actionItems[], keyTopics[], sentiment, status }`
- `highlights[]`: `{ text, startTime, endTime, color, note }`

---

## 8. Business Rules & Validations

- Email must be unique and valid; password minimum 8 characters; name minimum 2 characters.
- Every new user automatically gets an "All Meetings" default folder. If it is ever missing, it is recreated on demand (self-healing).
- The default folder cannot be renamed or deleted.
- Recording uploads are validated by **magic-byte sniffing** (actual file content), not just the client-claimed MIME type; non-audio/video files are rejected with HTTP 400.
- Per-meeting recording count is capped by the user's plan (Free 1, Basic 5, Premium unlimited).
- All meeting/folder/recording queries are scoped to the authenticated user — a user can never read or modify another user's data (no IDOR).
- Search input is escaped before being used in a MongoDB regex (no ReDoS).
- Request bodies are validated with Zod; invalid input returns HTTP 400 with field-level errors.

---

## 9. Security Requirements

- Passwords hashed with bcrypt (cost factor 12).
- JWT access tokens expire in 15 minutes; refresh tokens rotate on each use.
- OAuth flows use a cryptographically random `state` nonce stored in an HTTP-only cookie and verified on callback (CSRF protection).
- Rate limiting: login/register 30 per 15 min, refresh 60 per 15 min, uploads 30 per hour.
- CORS restricted to the known frontend origins (localhost + the Vercel domain).
- Security headers set via Helmet.
- After OAuth, tokens are stripped from the URL immediately so they don't linger in history.

---

## 10. Key Success / Acceptance Criteria

1. A new user can register, log in, and reach the dashboard.
2. A user can create a meeting, record audio, and see it transcribed and summarized (status reaches COMPLETED).
3. A Free user is blocked from adding a 2nd recording to a meeting; a Basic user can add up to 5; Premium unlimited.
4. A user can play back any recording, rename/delete meetings, delete individual recordings, and move meetings between folders.
5. Folders can be created, renamed, recolored, reordered, and deleted (with meetings reassigned to the default).
6. Search returns meetings matching title or transcript text.
7. Unauthenticated access to dashboard routes redirects to login.
8. A user can never access another user's meetings, folders, or recordings.
9. The app is fully responsive: on mobile the sidebar collapses into a hamburger-triggered drawer.
