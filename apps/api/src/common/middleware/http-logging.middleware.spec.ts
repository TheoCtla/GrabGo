import { Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import { NextFunction, Request, Response } from 'express';
import { HttpLoggingMiddleware } from './http-logging.middleware';

type ResponseMock = EventEmitter & Pick<Response, 'statusCode' | 'once'>;

describe('HttpLoggingMiddleware', () => {
  let middleware: HttpLoggingMiddleware;
  let response: ResponseMock;
  let next: jest.MockedFunction<NextFunction>;
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    middleware = new HttpLoggingMiddleware();
    response = Object.assign(new EventEmitter(), { statusCode: 200 }) as ResponseMock;
    next = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function createRequest(method: string, originalUrl: string): Request {
    return {
      method,
      originalUrl,
      headers: { authorization: 'Bearer secret-token' },
      body: { password: 'secret-password' }
    } as Request;
  }

  it('logs successful requests with their method, URL, status and duration', () => {
    middleware.use(createRequest('GET', '/api/health/live'), response as Response, next);
    response.emit('finish');

    expect(next).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^GET \/api\/health\/live 200 \d+ms$/)
    );
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('warns for client errors', () => {
    response.statusCode = 404;

    middleware.use(createRequest('GET', '/api/route-inexistante'), response as Response, next);
    response.emit('finish');

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^GET \/api\/route-inexistante 404 \d+ms$/)
    );
  });

  it('logs server errors without changing request propagation', () => {
    const unexpectedError = new Error('Unexpected error');
    response.statusCode = 500;
    next.mockImplementation(() => {
      throw unexpectedError;
    });

    expect(() =>
      middleware.use(createRequest('GET', '/api/orders'), response as Response, next)
    ).toThrow(unexpectedError);
    response.emit('finish');

    expect(next).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/^GET \/api\/orders 500 \d+ms$/));
  });

  it('does not include headers, authorization or body data', () => {
    middleware.use(createRequest('POST', '/api/auth/login'), response as Response, next);
    response.emit('finish');

    const logCalls = logSpy.mock.calls as unknown as [string][];
    const loggedMessage = logCalls[0]?.[0] ?? '';

    expect(loggedMessage).not.toContain('authorization');
    expect(loggedMessage).not.toContain('secret-token');
    expect(loggedMessage).not.toContain('body');
    expect(loggedMessage).not.toContain('secret-password');
  });
});
