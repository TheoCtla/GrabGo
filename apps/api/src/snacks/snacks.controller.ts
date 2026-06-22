import { Controller, Get, Param, Query } from '@nestjs/common';
import { IdParamDto } from '../common/dto/id-param.dto';
import { SnacksService } from './snacks.service';

@Controller('snacks')
export class SnacksController {
  constructor(private readonly snacksService: SnacksService) {}

  @Get()
  findByCampus(@Query('campusId') campusId?: string) {
    return this.snacksService.findByCampus(campusId);
  }

  @Get(':id')
  findById(@Param() params: IdParamDto) {
    return this.snacksService.findById(params.id);
  }
}
