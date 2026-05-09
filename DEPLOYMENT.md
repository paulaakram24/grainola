# Deploying Grainola

The repo is set up to deploy on:
- **Frontend → Vercel** (free, one-click from GitHub)
- **Backend → Render** (free tier, persistent disk for `/uploads`)

Why not Vercel for the backend too? Vercel runs Express as serverless
functions — `fs.writeFileSync` doesn't survive across invocations. Render's
free Node service has a real filesystem, perfect for the local-storage flow.

---

## Step 1 — Frontend on Vercel

A browser tab should already be open at the Vercel "Clone" page. If not:

> https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpaulaakram24%2Fgrainola&project-name=grainola&root-directory=frontend&env=NEXT_PUBLIC_API_URL

1. Sign in with GitHub (use the **paulaakram24** account).
2. Click **Authorize Vercel** when prompted.
3. **Root directory:** `frontend` (already pre-filled).
4. **Framework preset:** `Next.js` (auto-detected).
5. **Environment variables:**
   - `NEXT_PUBLIC_API_URL` → leave as `http://localhost:4000/api/v1` for now.
     We'll come back and update this to the Render URL after Step 2.
6. Click **Deploy**. ~60 seconds later you'll have a live URL like
   `https://grainola.vercel.app`.

---

## Step 2 — Backend on Render

The other browser tab should be open at the Render "Connect a repository"
page. If not:

> https://dashboard.render.com/select-repo?type=blueprint

1. Sign in (use GitHub OAuth — same paulaakram24 account).
2. Click **Public Git repository** → paste `https://github.com/paulaakram24/grainola`
   (or pick it from the connected list).
3. Render reads `render.yaml` from the repo root and shows the proposed
   `grainola-api` web service with a 1 GB persistent disk.
4. Click **Apply**.
5. After the service appears, open it → **Environment** → fill in the secrets
   that were marked `sync: false`:

   | Key | Value |
   |---|---|
   | `MONGODB_URI` | (copy from `backend/.env`) |
   | `JWT_SECRET` | (copy or regenerate to a 64+ char random string) |
   | `JWT_REFRESH_SECRET` | (copy or regenerate) |
   | `GROQ_API_KEY` | (copy from `backend/.env`) |
   | `GOOGLE_CLIENT_ID` | (copy from `backend/.env`) |
   | `GOOGLE_CLIENT_SECRET` | (copy from `backend/.env`) |
   | `GOOGLE_REDIRECT_URI` | `https://<your-render-url>.onrender.com/api/v1/calendar/oauth/callback` |
   | `BACKEND_URL` | `https://<your-render-url>.onrender.com` |
   | `FRONTEND_URL` | the Vercel URL from Step 1 |
   | `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | optional |

6. Click **Save Changes** — Render redeploys with the new vars (~3 min).

7. Test:
   ```bash
   curl https://<your-render-url>.onrender.com/health
   # → {"status":"ok",...}
   ```

---

## Step 3 — Wire the frontend to the deployed backend

Back in **Vercel** dashboard → your `grainola` project → **Settings** → **Environment Variables**:

- Edit `NEXT_PUBLIC_API_URL` → set to `https://<your-render-url>.onrender.com/api/v1`
- Save → trigger a redeploy (Deployments tab → latest → ⋯ → Redeploy)

---

## Step 4 — Update Google OAuth redirect URIs

Because both services moved to public URLs, add the production callback
to your Google Cloud Console:

1. https://console.cloud.google.com/apis/credentials
2. Open your OAuth 2.0 Client ID.
3. Under **Authorized redirect URIs**, add:
   `https://<your-render-url>.onrender.com/api/v1/calendar/oauth/callback`
4. Save.

(You don't need to add a Vercel URL — only the backend talks to Google.)

---

## Free-tier notes

- Render free web services **sleep after 15 minutes of inactivity** and
  take ~30 s to wake up on the first request afterwards. The persistent
  disk survives the sleep.
- Vercel's free tier allows unlimited deployments but throttles serverless
  function calls per month (we don't hit serverless functions anyway since
  the backend is on Render).
- MongoDB Atlas M0 free tier is fine for the project's scale.

---

## After deployment

The discussion-day URL should be your Vercel URL, e.g.
`https://grainola.vercel.app`. The backend at Render is invisible to the
audience but you can show the architecture: frontend → Vercel,
backend → Render, DB → MongoDB Atlas, AI → Groq.
