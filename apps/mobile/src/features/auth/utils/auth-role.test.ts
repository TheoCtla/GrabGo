import { describe, expect, it } from 'vitest';
import { ApiError } from '../../../shared/api/api-error';
import { AuthResponse } from '../types';
import { ensureStudentSession, validateLoginFields } from './auth-role';

function createAuthResponse(role: AuthResponse['user']['role']): AuthResponse {
  return {
    accessToken: 'token',
    user: {
      id: 'user-id',
      email: 'student.test@grabgo.local',
      firstName: 'Ada',
      lastName: 'Lovelace',
      role,
      phone: null,
      isActive: true,
      createdAt: '2026-07-21T10:00:00.000Z',
      updatedAt: '2026-07-21T10:00:00.000Z'
    }
  };
}

describe('student auth role helpers', () => {
  it('accepts student sessions', () => {
    const session = createAuthResponse('STUDENT');

    expect(ensureStudentSession(session)).toEqual(session);
  });

  it('refuses non-student sessions', () => {
    expect(() => ensureStudentSession(createAuthResponse('MERCHANT'))).toThrow(ApiError);
    expect(() => ensureStudentSession(createAuthResponse('MERCHANT'))).toThrow(
      'Cette application est réservée aux étudiants.'
    );
  });

  it('validates login fields', () => {
    expect(validateLoginFields('', '')).toBe('Email et mot de passe sont obligatoires.');
    expect(validateLoginFields('student', 'Password123!')).toBe('Adresse email invalide.');
    expect(validateLoginFields('student.test@grabgo.local', 'Password123!')).toBeUndefined();
  });
});
