import { ZodSchema } from 'zod';
import { appConfig } from '../../app/config';
import { ApiError } from './api-error';
import { readAuthSession } from '../auth/auth-storage';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

type HttpRequestOptions<TResponse> = {
  method?: HttpMethod;
  body?: unknown;
  schema?: ZodSchema<TResponse>;
  signal?: AbortSignal;
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
  const session = readAuthSession();
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
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal
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
