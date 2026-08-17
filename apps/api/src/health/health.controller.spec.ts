import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { PrismaService } from '../prisma/prisma.service';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

type LivenessResponse = {
  status: string;
  uptimeSeconds: number;
  timestamp: string;
};

type ReadinessResponse = {
  status: string;
  database: {
    status: string;
    responseTimeMs?: number;
  };
};

describe('HealthController', () => {
  let app: INestApplication;
  const prismaMock = {
    $queryRaw: jest.fn<Promise<unknown>, [TemplateStringsArray]>()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: prismaMock
        }
      ]
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns the liveness status', async () => {
    const server = app.getHttpServer() as unknown as Parameters<typeof request>[0];
    const response = await request(server).get('/api/health/live').expect(200);
    const body = response.body as unknown as LivenessResponse;

    expect(body.status).toBe('ok');
    expect(typeof body.uptimeSeconds).toBe('number');
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
    expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
  });

  it('returns ready when PostgreSQL responds', async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const server = app.getHttpServer() as unknown as Parameters<typeof request>[0];
    const response = await request(server).get('/api/health/ready').expect(200);
    const body = response.body as unknown as ReadinessResponse;

    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
    expect(body.status).toBe('ok');
    expect(body.database.status).toBe('up');
    expect(typeof body.database.responseTimeMs).toBe('number');
  });

  it('returns unavailable when PostgreSQL fails', async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error('PostgreSQL unavailable'));

    const server = app.getHttpServer() as unknown as Parameters<typeof request>[0];
    const response = await request(server).get('/api/health/ready').expect(503);
    const body = response.body as unknown as ReadinessResponse;

    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
    expect(body.status).toBe('error');
    expect(body.database.status).toBe('down');
  });
});
