import { ApiError } from '../../../shared/api/api-error';
import { AuthResponse } from '../types';

export function ensureStudentSession(session: AuthResponse): AuthResponse {
  if (session.user.role !== 'STUDENT') {
    throw new ApiError('Cette application est réservée aux étudiants.', 403);
  }

  return session;
}

export function validateLoginFields(email: string, password: string): string | undefined {
  if (!email.trim() || !password.trim()) {
    return 'Email et mot de passe sont obligatoires.';
  }

  if (!email.includes('@')) {
    return 'Adresse email invalide.';
  }

  return undefined;
}
