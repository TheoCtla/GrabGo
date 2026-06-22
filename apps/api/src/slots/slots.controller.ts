import { Controller, Get, Query } from '@nestjs/common';
import { AvailableSlotsQueryDto } from './dto/available-slots-query.dto';
import { SlotsService } from './slots.service';

@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get('available')
  findAvailableSlots(@Query() query: AvailableSlotsQueryDto) {
    return this.slotsService.findAvailableSlots(query);
  }
}
