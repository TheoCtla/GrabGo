import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type LivenessStatus = {
  status: 'ok';
  uptimeSeconds: number;
  timestamp: string;
};

type ReadinessStatus = {
  status: 'ok';
  database: {
    status: 'up';
    responseTimeMs: number;
  };
  uptimeSeconds: number;
  timestamp: string;
};

type UnavailableStatus = {
  status: 'error';
  database: {
    status: 'down';
  };
  uptimeSeconds: number;
  timestamp: string;
};

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getLiveness(): LivenessStatus {
    return {
      status: 'ok',
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  async getReadiness(): Promise<ReadinessStatus> {
    const startedAt = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        database: {
          status: 'up',
          responseTimeMs: Date.now() - startedAt
        },
        uptimeSeconds: process.uptime(),
        timestamp: new Date().toISOString()
      };
    } catch {
      const response: UnavailableStatus = {
        status: 'error',
        database: {
          status: 'down'
        },
        uptimeSeconds: process.uptime(),
        timestamp: new Date().toISOString()
      };

      throw new ServiceUnavailableException(response);
    }
  }
}
