// Local dev convenience flags shared between LoginPage (auto-fill/auto-submit)
// and AuthContext (logout). Not meant to survive a real deploy.
// Credentials come from .env (see .env.example) so real values never get committed.
export const DEV_USERNAME = import.meta.env.VITE_DEV_USERNAME ?? '';
export const DEV_PASSWORD = import.meta.env.VITE_DEV_PASSWORD ?? '';

// Set by AuthContext.logout() - stops auto-login from immediately signing
// back in right after an explicit logout. Cleared once someone signs in again.
export const SKIP_AUTOLOGIN_KEY = 'shifttrack_skip_autologin';
