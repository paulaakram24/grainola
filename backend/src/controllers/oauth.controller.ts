import { Request, Response } from 'express';
import { google } from 'googleapis';
import { env } from '../config/env';
import { authService } from '../services/auth.service';

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
function frontendCallback(
  res: Response,
  result:
    | { ok: true; accessToken: string; refreshToken: string; user: any }
    | { ok: false; error: string },
) {
  const FE = env.FRONTEND_URL ?? 'http://localhost:3000';
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
  const url = googleLoginClient.generateAuthUrl({
    access_type: 'online',
    scope: GOOGLE_LOGIN_SCOPES,
    prompt: 'select_account',
    // Tag this request as a login (vs calendar link) so the shared callback
    // knows to route the response to the login handler.
    state: `${LOGIN_STATE_PREFIX}${Date.now()}`,
  });
  res.redirect(url);
};

/** Process a Google login completion. Called from the calendar callback when
 *  the `state` starts with "login:". */
export const handleGoogleLoginCallback = async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string | undefined;
    if (!code) return frontendCallback(res, { ok: false, error: 'Missing code from Google' });

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
    const FE = env.FRONTEND_URL ?? 'http://localhost:3000';
    return res.redirect(`${FE}/login?error=${encodeURIComponent('GitHub login is not configured on the server')}`);
  }
  const params = new URLSearchParams({
    client_id:    env.GITHUB_CLIENT_ID,
    redirect_uri: `${env.BACKEND_URL ?? 'http://localhost:4000'}/api/v1/auth/oauth/github/callback`,
    scope:        'read:user user:email',
    allow_signup: 'true',
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
      const emails: any[] = await emailsResp.json();
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
