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

export function validateRegisterFields(fields: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}): string | undefined {
  if (!fields.firstName.trim()) {
    return 'Le prénom est obligatoire.';
  }

  if (!fields.lastName.trim()) {
    return 'Le nom est obligatoire.';
  }

  if (!fields.email.trim()) {
    return "L'adresse email est obligatoire.";
  }

  if (!fields.email.includes('@')) {
    return 'Adresse email invalide.';
  }

  if (!fields.password.trim()) {
    return 'Le mot de passe est obligatoire.';
  }

  if (!fields.passwordConfirmation.trim()) {
    return 'La confirmation du mot de passe est obligatoire.';
  }

  if (fields.password !== fields.passwordConfirmation) {
    return 'Les mots de passe ne correspondent pas.';
  }

  return undefined;
}
