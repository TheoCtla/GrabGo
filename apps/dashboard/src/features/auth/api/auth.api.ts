import { endpoints } from '../../../shared/api/endpoints';
import { httpClient } from '../../../shared/api/http-client';
import { AuthResponse, LoginPayload, authResponseSchema } from '../types';

export function loginMerchant(payload: LoginPayload): Promise<AuthResponse> {
  return httpClient<AuthResponse>(endpoints.auth.login, {
    method: 'POST',
    body: payload,
    schema: authResponseSchema
  });
}
