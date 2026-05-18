import { Request, Response } from 'express';
import crypto from 'crypto';
import { google } from 'googleapis';
import { env } from '../config/env';
import { authService } from '../services/auth.service';

const OAUTH_STATE_COOKIE = 'oauth_state';
const STATE_COOKIE_OPTS = {
  httpOnly: true,
  secure:   env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge:   10 * 60 * 1000, // 10 minutes — enough for the redirect round-trip
  path:     '/',
};

/** Cryptographically random state nonce — protects the OAuth flow from CSRF. */
function newState(prefix: string): string {
  return `${prefix}:${crypto.randomBytes(24).toString('base64url')}`;
}

/** Constant-time comparison of the state in the redirect against the cookie. */
function verifyState(req: Request, expectedPrefix: string): boolean {
  const fromQuery  = String(req.query.state ?? '');
  const fromCookie = String(req.cookies?.[OAUTH_STATE_COOKIE] ?? '');
  if (!fromQuery || !fromCookie) return false;
  if (!fromQuery.startsWith(`${expectedPrefix}:`)) return false;
  if (fromQuery.length !== fromCookie.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(fromQuery), Buffer.from(fromCookie));
  } catch {
    return false;
  }
}

// Reuses the *same* redirect URI that's already registered in the user's Google
// Cloud Console for Calendar (env.GOOGLE_REDIRECT_URI). The shared callback at
// /api/v1/calendar/oauth/callback inspects the `state` parameter and routes
// "login:..." states here. This avoids needing to register a second redirect URI.
const googleLoginClient = new google.auth.OAuth2(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_REDIRECT_URI,
);

const GOOGLE_LOGIN_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'openid',
];

const LOGIN_STATE_PREFIX = 'login:';

/** Helper — redirect the browser to /auth/oauth/callback on the frontend
 *  with the issued tokens, or to /login with an error message. */
/**
 * FRONTEND_URL can be a comma-separated list (so CORS allows both localhost
 * and the deployed Vercel URL). When we 302 back to the frontend after OAuth
 * we need a SINGLE URL — prefer the first non-localhost entry (i.e. the
 * production URL), falling back to the first entry overall.
 */
export function pickFrontendOrigin(): string {
  const raw = env.FRONTEND_URL ?? 'http://localhost:3000';
  const all = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (all.length === 0) return 'http://localhost:3000';
  const remote = all.find((u) => !u.includes('localhost') && !u.includes('127.0.0.1'));
  // Strip trailing slash so `${origin}/path` doesn't double up.
  return (remote ?? all[0]).replace(/\/$/, '');
}

function frontendCallback(
  res: Response,
  result:
    | { ok: true; accessToken: string; refreshToken: string; user: any }
    | { ok: false; error: string },
) {
  const FE = pickFrontendOrigin();
  if (result.ok) {
    const params = new URLSearchParams({
      accessToken:  result.accessToken,
      refreshToken: result.refreshToken,
      user:         JSON.stringify(result.user),
    });
    res.redirect(`${FE}/auth/oauth/callback?${params.toString()}`);
  } else {
    const params = new URLSearchParams({ error: result.error });
    res.redirect(`${FE}/login?${params.toString()}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE
// ─────────────────────────────────────────────────────────────────────────────

export const googleOAuthStart = (_req: Request, res: Response) => {
  // Random nonce prevents CSRF — cookie carries the only valid value.
  const state = newState('login');
  res.cookie(OAUTH_STATE_COOKIE, state, STATE_COOKIE_OPTS);

  const url = googleLoginClient.generateAuthUrl({
    access_type: 'online',
    scope: GOOGLE_LOGIN_SCOPES,
    prompt: 'select_account',
    state,
  });
  res.redirect(url);
};

/** Process a Google login completion. Called from the calendar callback when
 *  the `state` starts with "login:". */
export const handleGoogleLoginCallback = async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string | undefined;
    if (!code) return frontendCallback(res, { ok: false, error: 'Missing code from Google' });

    // Verify the state nonce that we issued at /auth/oauth/google.
    if (!verifyState(req, 'login')) {
      return frontendCallback(res, { ok: false, error: 'Invalid OAuth state — possible CSRF attempt' });
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: '/' });

    const { tokens } = await googleLoginClient.getToken(code);
    googleLoginClient.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: googleLoginClient });
    const { data } = await oauth2.userinfo.get();
    if (!data.id || !data.email) {
      return frontendCallback(res, { ok: false, error: 'Google did not return profile info' });
    }

    const result = await authService.findOrCreateOAuthUser({
      provider:   'google',
      providerId: data.id,
      email:      data.email,
      name:       data.name ?? data.email.split('@')[0],
      avatarUrl:  data.picture ?? undefined,
    });

    return frontendCallback(res, { ok: true, ...result });
  } catch (err: any) {
    return frontendCallback(res, {
      ok: false,
      error: err?.message ?? 'Google login failed',
    });
  }
};

/** Returns true if the given state was issued by googleOAuthStart. */
export function isLoginState(state: unknown): boolean {
  return typeof state === 'string' && state.startsWith(LOGIN_STATE_PREFIX);
}

// ─────────────────────────────────────────────────────────────────────────────
// GITHUB
// ─────────────────────────────────────────────────────────────────────────────

export const githubOAuthStart = (_req: Request, res: Response) => {
  if (!env.GITHUB_CLIENT_ID) {
    const FE = pickFrontendOrigin();
    return res.redirect(`${FE}/login?error=${encodeURIComponent('GitHub login is not configured on the server')}`);
  }
  // CSRF protection — same scheme as Google.
  const state = newState('gh');
  res.cookie(OAUTH_STATE_COOKIE, state, STATE_COOKIE_OPTS);

  const params = new URLSearchParams({
    client_id:    env.GITHUB_CLIENT_ID,
    redirect_uri: `${env.BACKEND_URL ?? 'http://localhost:4000'}/api/v1/auth/oauth/github/callback`,
    scope:        'read:user user:email',
    allow_signup: 'true',
    state,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
};

export const githubOAuthCallback = async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string | undefined;
    if (!code) return frontendCallback(res, { ok: false, error: 'Missing code from GitHub' });
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
      return frontendCallback(res, { ok: false, error: 'GitHub login is not configured' });
    }

    // CSRF: validate the state nonce we set when starting the flow.
    if (!verifyState(req, 'gh')) {
      return frontendCallback(res, { ok: false, error: 'Invalid OAuth state — possible CSRF attempt' });
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: '/' });

    // 1. Exchange code → access_token
    const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
      method:  'POST',
      headers: {
        Accept:         'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id:     env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const tokenJson: any = await tokenResp.json();
    if (!tokenJson.access_token) {
      return frontendCallback(res, { ok: false, error: tokenJson.error_description ?? 'GitHub token exchange failed' });
    }
    const accessToken: string = tokenJson.access_token;

    // 2. Fetch the user
    const userResp = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'Grainola' },
    });
    const ghUser: any = await userResp.json();
    if (!ghUser.id) return frontendCallback(res, { ok: false, error: 'GitHub returned no user' });

    // 3. GitHub may not return a public email — fetch the verified one.
    let email: string | null = ghUser.email ?? null;
    if (!email) {
      const emailsResp = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'Grainola' },
      });
      const emails = (await emailsResp.json()) as any[];
      const primary = emails.find((e) => e.primary && e.verified) ?? emails.find((e) => e.verified);
      email = primary?.email ?? null;
    }
    if (!email) {
      return frontendCallback(res, {
        ok: false,
        error: 'No verified email on your GitHub account',
      });
    }

    const result = await authService.findOrCreateOAuthUser({
      provider:   'github',
      providerId: String(ghUser.id),
      email,
      name:       ghUser.name ?? ghUser.login ?? email.split('@')[0],
      avatarUrl:  ghUser.avatar_url ?? undefined,
    });

    return frontendCallback(res, { ok: true, ...result });
  } catch (err: any) {
    return frontendCallback(res, {
      ok: false,
      error: err?.message ?? 'GitHub login failed',
    });
  }
};
