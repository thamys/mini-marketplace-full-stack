import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { Product, Prisma } from '@prisma/client';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: jest.Mocked<PrismaService>;

  const mockProduct: Product = {
    id: '1',
    name: 'Notebook Dell',
    description: 'Um ótimo notebook',
    price: new Decimal(5000),
    category: 'eletronicos',
    stock: 10,
    imageUrl: 'http://image.com',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const prismaServiceMock = {
      product: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: prismaServiceMock,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get(PrismaService);
  });

  describe('findAll', () => {
    it('TC-08.2.1: Sem filtros → retorna { data, meta } com paginação correta', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
      (prisma.product.count as jest.Mock).mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 100 });

      expect(result).toEqual({
        data: [mockProduct],
        meta: { total: 1, page: 1, limit: 100, totalPages: 1 },
      });
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 100,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('TC-08.2.2: search=notebook → retorna apenas produtos com notebook no nome', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
      (prisma.product.count as jest.Mock).mockResolvedValue(1);

      await service.findAll({ search: 'notebook', page: 1, limit: 100 });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: { contains: 'notebook', mode: 'insensitive' } },
        }),
      );
    });

    it('TC-08.2.3: category=eletronicos → filtra por categoria', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
      (prisma.product.count as jest.Mock).mockResolvedValue(1);

      await service.findAll({ category: 'eletronicos', page: 1, limit: 100 });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { category: 'eletronicos' },
        }),
      );
    });

    it('TC-08.2.4: page=2&limit=5 → retorna a segunda página com no máximo 5 itens', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(10);

      const result = await service.findAll({ page: 2, limit: 5 });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        }),
      );
      expect(result.meta).toEqual({
        total: 10,
        page: 2,
        limit: 5,
        totalPages: 2,
      });
    });

    it('TC-08.2.5: meta.total reflete o total real de registros', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(55);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.meta.total).toBe(55);
      expect(result.meta.totalPages).toBe(6);
    });
  });

  describe('findById', () => {
    it('TC-08.3.1: ID válido → retorna produto completo', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

      const result = await service.findById('1');

      expect(result).toEqual(mockProduct);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('TC-08.3.2: ID inexistente → lança NotFoundException', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findById('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('CRUD operations', () => {
    it('TC-09.1.1: create() com payload válido → retorna produto criado', async () => {
      const dto = {
        name: 'New Product',
        description: 'Desc',
        price: 100,
        category: 'cat',
        stock: 5,
        imageUrl: 'http://img.com',
      };
      (prisma.product.create as jest.Mock).mockResolvedValue(mockProduct);

      const result = await service.create(dto);

      expect(result).toEqual(mockProduct);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          price: new Prisma.Decimal(100),
        },
      });
    });

    it('TC-09.1.3: update() com id válido → retorna produto atualizado', async () => {
      const dto = { price: 200 };
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.product.update as jest.Mock).mockResolvedValue({
        ...mockProduct,
        price: new Prisma.Decimal(200),
      });

      const result = await service.update('1', dto);

      expect(result.price).toEqual(new Prisma.Decimal(200));
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: expect.objectContaining({
          price: new Prisma.Decimal(200),
        }),
      });
    });

    it('TC-09.1.4: update() com id inválido → lança NotFoundException', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.update('unknown', { name: 'New' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('TC-09.1.5: delete() com id válido → produto removido do banco', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.product.delete as jest.Mock).mockResolvedValue(mockProduct);

      await service.delete('1');

      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });
});
