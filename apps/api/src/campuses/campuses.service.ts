import { Injectable } from '@nestjs/common';
import { Campus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CampusesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Campus[]> {
    return this.prisma.campus.findMany({
      orderBy: [{ city: 'asc' }, { name: 'asc' }]
    });
  }

  findById(id: string): Promise<Campus | null> {
    return this.prisma.campus.findUnique({
      where: { id }
    });
  }
}
