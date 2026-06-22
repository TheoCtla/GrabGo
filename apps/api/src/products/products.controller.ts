import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { IdParamDto } from '../common/dto/id-param.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findBySnack(@Query('snackId') snackId?: string) {
    if (!snackId) {
      throw new BadRequestException('snackId query parameter is required');
    }

    return this.productsService.findBySnack(snackId);
  }

  @Get(':id')
  findById(@Param() params: IdParamDto) {
    return this.productsService.findById(params.id);
  }
}
