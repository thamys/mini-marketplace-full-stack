import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

const mockProduct = (
  overrides: Partial<{
    id: string;
    name: string;
    price: Decimal;
    stock: number;
  }> = {},
) => ({
  id: 'prod-1',
  name: 'Notebook Dell',
  description: 'Um ótimo notebook',
  price: new Decimal(5000),
  category: 'eletronicos',
  stock: 10,
  imageUrl: null,
  createdAt: new Date(),
  ...overrides,
});

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: jest.Mocked<PrismaService>;

  const txMock = {
    product: { update: jest.fn() },
    order: { create: jest.fn() },
  };

  beforeEach(async () => {
    const prismaServiceMock = {
      product: {
        findMany: jest.fn(),
      },
      order: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get(PrismaService);

    // Default: $transaction calls callback with txMock
    (prisma.$transaction as jest.Mock).mockImplementation(
      (cb: (tx: typeof txMock) => unknown) => cb(txMock),
    );
    txMock.product.update.mockResolvedValue({});
  });

  afterEach(() => jest.clearAllMocks());

  describe('TC-11.2.1: create() com itens válidos', () => {
    it('calcula o total corretamente e cria o pedido', async () => {
      const product = mockProduct({ price: new Decimal(100), stock: 5 });
      (prisma.product.findMany as jest.Mock).mockResolvedValue([product]);

      const createdOrder = {
        id: 'order-1',
        userId: 'user-1',
        total: new Decimal(200),
        status: 'PENDING',
        createdAt: new Date(),
        items: [
          {
            id: 'item-1',
            orderId: 'order-1',
            productId: product.id,
            productName: product.name,
            quantity: 2,
            unitPrice: product.price,
          },
        ],
      };
      txMock.order.create.mockResolvedValue(createdOrder);

      const result = await service.create('user-1', {
        items: [{ productId: product.id, quantity: 2 }],
      });

      expect(result).toEqual(createdOrder);
      expect(txMock.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            userId: 'user-1',
            total: new Decimal(200),
          }),
        }),
      );
    });
  });

  describe('TC-11.2.2: create() captura snapshot de nome e preço', () => {
    it('OrderItem recebe productName e unitPrice do produto no momento do pedido', async () => {
      const product = mockProduct({
        name: 'Produto Original',
        price: new Decimal(299.99),
      });
      (prisma.product.findMany as jest.Mock).mockResolvedValue([product]);
      txMock.order.create.mockResolvedValue({ id: 'order-1', items: [] });

      await service.create('user-1', {
        items: [{ productId: product.id, quantity: 1 }],
      });

      expect(txMock.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            items: {
              create: [
                expect.objectContaining({
                  productName: 'Produto Original',
                  unitPrice: new Decimal(299.99),
                }),
              ],
            },
          }),
        }),
      );
    });
  });

  describe('TC-11.2.3: create() com productId inválido', () => {
    it('lança BadRequestException quando produto não existe', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);

      await expect(
        service.create('user-1', {
          items: [{ productId: 'nonexistent-id', quantity: 1 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('TC-11.2.4: create() com estoque insuficiente', () => {
    it('lança BadRequestException com error=INSUFFICIENT_STOCK e details corretos', async () => {
      const product = mockProduct({ stock: 2 });
      (prisma.product.findMany as jest.Mock).mockResolvedValue([product]);

      try {
        await service.create('user-1', {
          items: [{ productId: product.id, quantity: 5 }],
        });
        fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const body = (err as BadRequestException).getResponse() as {
          error: string;
          details: {
            productId: string;
            requested: number;
            available: number;
          }[];
        };
        expect(body.error).toBe('INSUFFICIENT_STOCK');
        expect(body.details).toEqual([
          expect.objectContaining({
            productId: product.id,
            requested: 5,
            available: 2,
          }),
        ]);
      }
    });
  });

  describe('TC-11.2.5: create() com conflito parcial de estoque', () => {
    it('rejeita o pedido inteiro atomicamente — nenhum estoque é decrementado', async () => {
      const prodOk = mockProduct({ id: 'prod-ok', stock: 10 });
      const prodFail = mockProduct({ id: 'prod-fail', stock: 1 });
      (prisma.product.findMany as jest.Mock).mockResolvedValue([
        prodOk,
        prodFail,
      ]);

      await expect(
        service.create('user-1', {
          items: [
            { productId: prodOk.id, quantity: 2 },
            { productId: prodFail.id, quantity: 5 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);

      // $transaction callback never reached — no stock decremented
      expect(txMock.product.update).not.toHaveBeenCalled();
    });
  });

  describe('TC-11.2.6: findByUser()', () => {
    it('retorna pedidos do usuário ordenados por createdAt DESC', async () => {
      const orders = [
        { id: 'order-2', createdAt: new Date('2024-02-01'), items: [] },
        { id: 'order-1', createdAt: new Date('2024-01-01'), items: [] },
      ];

      const prismaAny = prisma as unknown as { order: { findMany: jest.Mock } };
      prismaAny.order.findMany.mockResolvedValue(orders);

      const result = await service.findByUser('user-1');

      expect(result).toEqual(orders);
      expect(prismaAny.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          orderBy: { createdAt: 'desc' },
          include: { items: true },
        }),
      );
    });
  });
});
