import { AuthSession } from './auth-types';

let inMemorySession: AuthSession | null = null;

export function readAuthSession(): Promise<AuthSession | null> {
  return Promise.resolve(inMemorySession);
}

export function writeAuthSession(session: AuthSession): Promise<void> {
  inMemorySession = session;
  return Promise.resolve();
}

export function clearAuthSession(): Promise<void> {
  inMemorySession = null;
  return Promise.resolve();
}
