import { Controller, Get, Param, Query, UsePipes } from '@nestjs/common';
import { ProductsService } from './products.service';
import { GetProductsDtoSchema } from './dto/get-products.dto';
import type { GetProductsDto } from './dto/get-products.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

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
}
