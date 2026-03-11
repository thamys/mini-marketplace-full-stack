import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UsePipes,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { GetProductsDtoSchema } from './dto/get-products.dto';
import type { GetProductsDto } from './dto/get-products.dto';
import * as CreateProductDtoNamespace from './dto/create-product.dto';
import * as UpdateProductDtoNamespace from './dto/update-product.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(GetProductsDtoSchema))
  findAll(@Query() query: GetProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(
    @Body(
      new ZodValidationPipe(CreateProductDtoNamespace.CreateProductDtoSchema),
    )
    createProductDto: CreateProductDtoNamespace.CreateProductDto,
  ) {
    return this.productsService.create(createProductDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body(
      new ZodValidationPipe(UpdateProductDtoNamespace.UpdateProductDtoSchema),
    )
    updateProductDto: UpdateProductDtoNamespace.UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(204)
  delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }
}
