import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetProductsDto } from './dto/get-products.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: GetProductsDto) {
    const { page = 1, limit = 100, search, category } = query;

    const where: Prisma.ProductWhereInput = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (category) {
      where.category = category;
    }

    const all = await this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Out-of-stock products always go last (globally, not per page)
    all.sort((a, b) => {
      const aOut = a.stock === 0 ? 1 : 0;
      const bOut = b.stock === 0 ? 1 : 0;
      return aOut - bOut;
    });

    const total = all.length;
    const skip = (page - 1) * limit;
    const data = all.slice(skip, skip + limit);

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

  async create(dto: CreateProductDto): Promise<Product> {
    return this.prisma.product.create({
      data: {
        ...dto,
        price: new Prisma.Decimal(dto.price),
      },
    });
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    await this.findById(id);

    const updateData: Prisma.ProductUpdateInput = { ...dto };
    if (dto.price !== undefined) {
      updateData.price = new Prisma.Decimal(dto.price);
    }

    return this.prisma.product.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.product.delete({
      where: { id },
    });
  }
}
