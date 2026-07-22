import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../../shared/api/api-error';
import { httpClient } from '../../../shared/api/http-client';
import { AuthResponse } from '../types';
import { registerStudent } from './auth.api';

vi.mock('../../../shared/api/http-client', () => ({
  httpClient: vi.fn()
}));

const httpClientMock = vi.mocked(httpClient);

function createStudentSession(): AuthResponse {
  return {
    accessToken: 'student-token',
    user: {
      id: 'student-id',
      email: 'ada@grabgo.test',
      firstName: 'Ada',
      lastName: 'Lovelace',
      role: 'STUDENT',
      phone: null,
      isActive: true,
      createdAt: '2026-07-22T10:00:00.000Z',
      updatedAt: '2026-07-22T10:00:00.000Z'
    }
  };
}

describe('mobile auth api', () => {
  beforeEach(() => {
    httpClientMock.mockReset();
  });

  it('registers a student without sending a role', async () => {
    const session = createStudentSession();
    httpClientMock.mockResolvedValue(session);

    await expect(
      registerStudent({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@grabgo.test',
        password: 'Password123!'
      })
    ).resolves.toEqual(session);

    expect(httpClientMock).toHaveBeenCalledWith(
      '/auth/register/student',
      expect.objectContaining({
        method: 'POST',
        body: {
          firstName: 'Ada',
          lastName: 'Lovelace',
          email: 'ada@grabgo.test',
          password: 'Password123!'
        }
      })
    );
  });

  it('maps already used email errors to a clear message', async () => {
    httpClientMock.mockRejectedValue(new ApiError('Email already used', 409));

    await expect(
      registerStudent({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@grabgo.test',
        password: 'Password123!'
      })
    ).rejects.toThrow('Cette adresse email est déjà utilisée.');
  });
});
