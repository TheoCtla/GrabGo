import { z } from 'zod';
import { appConfig } from '../../core/config';
import { readAuthSession } from '../auth/auth-storage';
import { ApiError } from './api-error';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

type HttpRequestOptions<TResponse> = {
  method?: HttpMethod;
  body?: unknown;
  schema?: z.ZodSchema<TResponse>;
};

type ApiErrorResponse = {
  message?: string | string[];
  error?: string;
};

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    return response.text();
  }

  return response.json() as Promise<unknown>;
}

function getApiErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const apiError = payload as ApiErrorResponse;

  if (Array.isArray(apiError.message)) {
    return apiError.message.join(', ');
  }

  return apiError.message ?? apiError.error ?? fallback;
}

export async function httpClient<TResponse>(
  endpoint: string,
  options: HttpRequestOptions<TResponse> = {}
): Promise<TResponse> {
  const session = await readAuthSession();
  const headers = new Headers({
    Accept: 'application/json'
  });

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (session?.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`);
  }

  const response = await fetch(`${appConfig.apiBaseUrl}${endpoint}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(
      getApiErrorMessage(payload, "Une erreur est survenue lors de l'appel API."),
      response.status,
      payload
    );
  }

  return options.schema ? options.schema.parse(payload) : (payload as TResponse);
}
