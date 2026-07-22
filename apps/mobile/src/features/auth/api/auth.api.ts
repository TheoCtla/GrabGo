import { endpoints } from '../../../shared/api/endpoints';
import { ApiError } from '../../../shared/api/api-error';
import { httpClient } from '../../../shared/api/http-client';
import { AuthResponse, LoginPayload, RegisterPayload, authResponseSchema } from '../types';
import { ensureStudentSession } from '../utils/auth-role';

export async function loginStudent(payload: LoginPayload): Promise<AuthResponse> {
  const session = await httpClient<AuthResponse>(endpoints.auth.login, {
    method: 'POST',
    body: payload,
    schema: authResponseSchema
  });

  return ensureStudentSession(session);
}

export async function registerStudent(payload: RegisterPayload): Promise<AuthResponse> {
  try {
    const session = await httpClient<AuthResponse>(endpoints.auth.registerStudent, {
      method: 'POST',
      body: payload,
      schema: authResponseSchema
    });

    return ensureStudentSession(session);
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      throw new ApiError('Cette adresse email est déjà utilisée.', error.status, error.details);
    }

    throw error;
  }
}
