import type { Express } from 'express';

/**
 * @deprecated UI هاب فقط روی Next.js (npm run dev) — Express فقط API است.
 */
export function registerHubUiRoutes(_app: Express): void {
  console.warn(
    '[core-server] registerHubUiRoutes غیرفعال است — UI را از http://localhost:3000 باز کنید.',
  );
}
