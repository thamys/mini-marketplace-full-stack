import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetProductsDto } from './dto/get-products.dto';
import { Product, Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: GetProductsDto) {
    const { page = 1, limit = 100, search, category } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (category) {
      where.category = category;
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }
}

