'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.26 1.05-3.72 1.05-2.86 0-5.28-1.93-6.15-4.53H2.17v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.85 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.35-2.1V7.06H2.17a11 11 0 0 0 0 9.88l3.68-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.13 14.97 1 12 1A11 11 0 0 0 2.17 7.06l3.68 2.84C6.72 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M12 .3a12 12 0 0 0-3.79 23.4c.6.1.82-.26.82-.58v-2.05c-3.34.73-4.04-1.4-4.04-1.4-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .3Z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M16.37 1c.04 1.21-.42 2.4-1.18 3.27-.78.92-2.07 1.64-3.32 1.54a3.8 3.8 0 0 1 1.1-3.13C13.78 1.74 15.18 1.07 16.37 1ZM20.5 17.32c-.55 1.27-1.21 2.49-2.06 3.6-.96 1.27-2.32 2.85-4 2.86-1.49.02-1.88-.97-3.92-.96-2.04.01-2.46 1-3.96.96-1.68-.05-2.96-1.47-3.92-2.74-2.69-3.55-2.97-7.7-1.31-9.92.97-1.32 2.5-2.13 4.02-2.16 1.69-.04 3.28 1.12 3.92 1.12.65 0 2.71-1.39 4.56-1.18.78.04 2.95.32 4.36 2.42-3.65 2.16-3.06 7.46.31 8.9-.5.96-.84 1.47-2 3.1Z" />
    </svg>
  );
}

export function SocialLoginButtons() {
  const googleHref = `${API_URL}/auth/oauth/google`;
  const githubHref = `${API_URL}/auth/oauth/github`;

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-muted-foreground tracking-wider">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <a
          href={googleHref}
          className="flex items-center justify-center gap-2 h-10 rounded-md border border-input bg-background hover:bg-accent transition-colors text-sm font-medium"
          aria-label="Continue with Google"
        >
          <GoogleIcon />
          <span className="hidden sm:inline">Google</span>
        </a>

        <a
          href={githubHref}
          className="flex items-center justify-center gap-2 h-10 rounded-md border border-input bg-gray-900 text-white hover:bg-gray-800 transition-colors text-sm font-medium"
          aria-label="Continue with GitHub"
        >
          <GitHubIcon />
          <span className="hidden sm:inline">GitHub</span>
        </a>

        <button
          type="button"
          disabled
          title="Sign in with Apple requires an Apple Developer account ($99/year). Coming soon."
          className="flex items-center justify-center gap-2 h-10 rounded-md border border-input bg-black/90 text-white opacity-60 cursor-not-allowed text-sm font-medium"
          aria-label="Continue with Apple — not yet configured"
        >
          <AppleIcon />
          <span className="hidden sm:inline">Apple</span>
        </button>
      </div>
    </div>
  );
}
