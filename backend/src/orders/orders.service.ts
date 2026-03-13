import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Prisma, OrderStatus } from '@prisma/client';

interface StockConflict {
  productId: string;
  productName: string;
  requested: number;
  available: number;
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto) {
    const productIds = dto.items.map((i) => i.productId);

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    // Validate all product IDs exist
    const foundIds = new Set(products.map((p) => p.id));
    const missingIds = productIds.filter((id) => !foundIds.has(id));
    if (missingIds.length > 0) {
      throw new BadRequestException(
        `Products not found: ${missingIds.join(', ')}`,
      );
    }

    // Validate stock for every item
    const conflicts: StockConflict[] = [];
    for (const item of dto.items) {
      const product = products.find((p) => p.id === item.productId)!;
      if (product.stock < item.quantity) {
        conflicts.push({
          productId: product.id,
          productName: product.name,
          requested: item.quantity,
          available: product.stock,
        });
      }
    }

    if (conflicts.length > 0) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'INSUFFICIENT_STOCK',
        details: conflicts,
      });
    }

    // Build product lookup map for snapshots
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Calculate total
    const total = dto.items.reduce((sum, item) => {
      const product = productMap.get(item.productId)!;
      return sum + Number(product.price) * item.quantity;
    }, 0);

    // Create order atomically: decrement stock + create order + create items
    // Stock is re-validated inside the transaction to prevent race conditions
    // where two concurrent checkouts could both pass the pre-check above.
    const order = await this.prisma.$transaction(async (tx) => {
      // Re-check and decrement stock atomically for each product.
      // We use updateMany with a stock >= quantity guard; if no rows are
      // affected the product ran out of stock between our pre-check and now.
      for (const item of dto.items) {
        const result = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (result.count === 0) {
          // Re-fetch to get the current stock for the error response
          const current = await tx.product.findUnique({
            where: { id: item.productId },
            select: { name: true, stock: true },
          });
          throw new BadRequestException({
            statusCode: 400,
            error: 'INSUFFICIENT_STOCK',
            details: [
              {
                productId: item.productId,
                productName: current?.name ?? item.productId,
                requested: item.quantity,
                available: current?.stock ?? 0,
              },
            ],
          });
        }
      }

      return tx.order.create({
        data: {
          userId,
          total: new Prisma.Decimal(total),
          items: {
            create: dto.items.map((item) => {
              const product = productMap.get(item.productId)!;
              return {
                productId: item.productId,
                productName: product.name,
                quantity: item.quantity,
                unitPrice: product.price,
              };
            }),
          },
        },
        include: { items: true },
      });
    });

    return order;
  }

  async findByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  async findAll() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        user: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async updateStatus(orderId: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { items: true },
    });
  }
}
