import { endpoints } from '../../../shared/api/endpoints';
import { httpClient } from '../../../shared/api/http-client';
import { AuthResponse, LoginPayload, authResponseSchema } from '../types';
import { ensureStudentSession } from '../utils/auth-role';

export async function loginStudent(payload: LoginPayload): Promise<AuthResponse> {
  const session = await httpClient<AuthResponse>(endpoints.auth.login, {
    method: 'POST',
    body: payload,
    schema: authResponseSchema
  });

  return ensureStudentSession(session);
}
