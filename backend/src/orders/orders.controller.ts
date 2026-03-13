import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDtoSchema } from './dto/create-order.dto';
import type { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDtoSchema } from './dto/update-order-status.dto';
import type { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.CUSTOMER)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Request() req: { user: { userId: string } },
    @Body(new ZodValidationPipe(CreateOrderDtoSchema)) dto: CreateOrderDto,
  ) {
    return this.ordersService.create(req.user.userId, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CUSTOMER)
  findOrders(@Request() req: { user: { userId: string; role: string } }) {
    if (req.user.role === Role.ADMIN) {
      return this.ordersService.findAll();
    }
    return this.ordersService.findByUser(req.user.userId);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateOrderStatusDtoSchema))
    dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto.status);
  }
}
