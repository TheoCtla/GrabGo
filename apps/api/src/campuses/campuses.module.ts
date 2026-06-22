import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CampusesController } from './campuses.controller';
import { CampusesService } from './campuses.service';

@Module({
  imports: [PrismaModule],
  controllers: [CampusesController],
  providers: [CampusesService],
  exports: [CampusesService]
})
export class CampusesModule {}
