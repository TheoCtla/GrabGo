import { describe, expect, it } from 'vitest';
import { ApiError } from '../../../shared/api/api-error';
import { AuthResponse } from '../types';
import { ensureStudentSession, validateLoginFields, validateRegisterFields } from './auth-role';

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

  it('validates register fields', () => {
    const validFields = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@grabgo.test',
      password: 'Password123!',
      passwordConfirmation: 'Password123!'
    };

    expect(validateRegisterFields({ ...validFields, firstName: '' })).toBe(
      'Le prénom est obligatoire.'
    );
    expect(validateRegisterFields({ ...validFields, lastName: '' })).toBe(
      'Le nom est obligatoire.'
    );
    expect(validateRegisterFields({ ...validFields, email: '' })).toBe(
      "L'adresse email est obligatoire."
    );
    expect(validateRegisterFields({ ...validFields, email: 'ada' })).toBe(
      'Adresse email invalide.'
    );
    expect(validateRegisterFields({ ...validFields, password: '' })).toBe(
      'Le mot de passe est obligatoire.'
    );
    expect(validateRegisterFields({ ...validFields, passwordConfirmation: '' })).toBe(
      'La confirmation du mot de passe est obligatoire.'
    );
    expect(
      validateRegisterFields({ ...validFields, passwordConfirmation: 'OtherPassword123!' })
    ).toBe('Les mots de passe ne correspondent pas.');
    expect(validateRegisterFields(validFields)).toBeUndefined();
  });
});
