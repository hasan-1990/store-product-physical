export const WEAK_SECRET_VALUES = new Set([
  'your-secret-key',
  'your-jwt-secret-key-here',
  'your-super-secret-jwt-key-change-this-in-production',
  'your-super-secret-nextauth-key-change-this-minimum-32-characters',
  'fallback-secret',
  'fallback-secret-key',
  'change-this',
  'dev-only-secret-do-not-use-in-production',
  'CHANGE-THIS-TO-A-RANDOM-32-CHARACTER-STRING',
  'CHANGE-THIS-TO-ANOTHER-RANDOM-32-CHARACTER-STRING',
]);

export const MIN_SECRET_LENGTH = 32;

const DEV_ONLY_SECRET = 'dev-only-secret-do-not-use-in-production';

function validateSecretValue(name: string, value: string): void {
  if (value.length < MIN_SECRET_LENGTH) {
    throw new Error(`${name} must be at least ${MIN_SECRET_LENGTH} characters in production`);
  }
  if (WEAK_SECRET_VALUES.has(value)) {
    throw new Error(`${name} uses a weak/default value in production`);
  }
}

function requireSecret(name: 'JWT_SECRET' | 'NEXTAUTH_SECRET'): string {
  const value = process.env[name]?.trim();
  if (value) {
    if (process.env.NODE_ENV === 'production') {
      validateSecretValue(name, value);
    }
    return value;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} environment variable is required in production`);
  }

  console.warn(`⚠️ ${name} not set — using development-only default`);
  return DEV_ONLY_SECRET;
}

export function getJwtSecret(): string {
  return requireSecret('JWT_SECRET');
}

export function getNextAuthSecret(): string {
  return requireSecret('NEXTAUTH_SECRET');
}
