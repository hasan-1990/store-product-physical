/**
 * گزارش خطا به Sentry (اختیاری — بدون SDK سنگین)
 * فعال با: SENTRY_DSN=https://key@o0.ingest.sentry.io/projectId
 */
import crypto from 'crypto';

type SentryAuth = {
  publicKey: string;
  host: string;
  projectId: string;
};

function parseSentryDsn(dsn: string): SentryAuth | null {
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\//, '');
    const publicKey = url.username;
    if (!publicKey || !projectId) return null;
    return { publicKey, host: url.host, projectId };
  } catch {
    return null;
  }
}

export function isSentryEnabled(): boolean {
  return !!process.env.SENTRY_DSN?.trim();
}

export async function captureServerException(
  error: Error,
  extra?: Record<string, unknown>
): Promise<void> {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;

  const auth = parseSentryDsn(dsn);
  if (!auth) {
    console.warn('⚠️ SENTRY_DSN نامعتبر است');
    return;
  }

  const eventId = crypto.randomBytes(16).toString('hex');
  const payload = {
    event_id: eventId,
    platform: 'node',
    timestamp: new Date().toISOString(),
    level: 'error',
    environment: process.env.NODE_ENV || 'production',
    server_name: process.env.HOSTNAME || 'store-app',
    exception: {
      values: [
        {
          type: error.name,
          value: error.message,
          stacktrace: error.stack
            ? { frames: error.stack.split('\n').map((line) => ({ filename: line.trim() })) }
            : undefined,
        },
      ],
    },
    extra,
  };

  const sentryAuth = `Sentry sentry_version=7, sentry_key=${auth.publicKey}, sentry_client=store-app/1.0`;
  const endpoint = `https://${auth.host}/api/${auth.projectId}/store/`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': sentryAuth,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.warn('⚠️ Sentry report failed:', response.status);
    }
  } catch (reportError) {
    console.warn('⚠️ Sentry report error:', reportError);
  }
}

export function registerGlobalErrorHandlers(): void {
  if (!isSentryEnabled()) return;

  process.on('uncaughtException', (error) => {
    void captureServerException(error, { source: 'uncaughtException' });
  });

  process.on('unhandledRejection', (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    void captureServerException(error, { source: 'unhandledRejection' });
  });

  console.log('✅ Sentry error monitoring registered');
}
