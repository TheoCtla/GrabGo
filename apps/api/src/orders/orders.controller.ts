import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { IdParamDto } from '../common/dto/id-param.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ValidateWithdrawalDto } from './dto/validate-withdrawal.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @Post()
  createOrder(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @Post(':id/pay')
  payOrder(@CurrentUser() user: AuthenticatedUser, @Param() params: IdParamDto) {
    return this.ordersService.paySimulatedOrder(user.id, params.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  @Patch(':id/status')
  updateOrderStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param() params: IdParamDto,
    @Body() dto: UpdateOrderStatusDto
  ) {
    return this.ordersService.updateMerchantOrderStatus(user.id, params.id, dto.status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MERCHANT)
  @Post('withdrawal/validate')
  validateWithdrawal(@CurrentUser() user: AuthenticatedUser, @Body() dto: ValidateWithdrawalDto) {
    return this.ordersService.validateWithdrawal(user.id, dto);
  }
}
