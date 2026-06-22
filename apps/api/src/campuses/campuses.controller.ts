import { Controller, Get, Param } from '@nestjs/common';
import { IdParamDto } from '../common/dto/id-param.dto';
import { CampusesService } from './campuses.service';

@Controller('campuses')
export class CampusesController {
  constructor(private readonly campusesService: CampusesService) {}

  @Get()
  findAll() {
    return this.campusesService.findAll();
  }

  @Get(':id')
  findById(@Param() params: IdParamDto) {
    return this.campusesService.findById(params.id);
  }
}
