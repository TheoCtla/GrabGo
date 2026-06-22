import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SnacksController } from './snacks.controller';
import { SnacksService } from './snacks.service';

@Module({
  imports: [PrismaModule],
  controllers: [SnacksController],
  providers: [SnacksService],
  exports: [SnacksService]
})
export class SnacksModule {}
