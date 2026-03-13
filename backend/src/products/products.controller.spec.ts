import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: jest.Mocked<ProductsService>;

  const mockUser = { userId: 'admin-1', email: 'admin@test.com', role: 'ADMIN' };

  const mockProduct = {
    id: 'prod-1',
    name: 'Test Product',
    description: 'Description',
    price: '100' as unknown as import('@prisma/client').Prisma.Decimal,
    category: 'Electronics',
    stock: 10,
    imageUrl: null,
    createdAt: new Date(),
  };

  const paginatedResult = {
    data: [mockProduct],
    meta: { total: 1, page: 1, limit: 12, totalPages: 1 },
  };

  beforeEach(async () => {
    const serviceMock: Partial<jest.Mocked<ProductsService>> = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: serviceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: import('@nestjs/common').ExecutionContext) => {
          ctx.switchToHttp().getRequest<{ user: typeof mockUser }>().user = mockUser;
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(ProductsController);
    service = module.get(ProductsService);
  });

  describe('findAll', () => {
    it('delega ao service com query e retorna lista paginada', async () => {
      service.findAll.mockResolvedValue(paginatedResult);
      const query = { page: 1, limit: 12 };

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('findById', () => {
    it('retorna produto quando ID válido', async () => {
      service.findById.mockResolvedValue(mockProduct);

      const result = await controller.findById('prod-1');

      expect(service.findById).toHaveBeenCalledWith('prod-1');
      expect(result).toEqual(mockProduct);
    });

    it('propaga NotFoundException quando ID não existe', async () => {
      service.findById.mockRejectedValue(new NotFoundException('Product not found'));

      await expect(controller.findById('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('delega ao service com payload correto e retorna produto criado', async () => {
      const dto = {
        name: 'New Product',
        description: 'Desc',
        price: 100,
        category: 'Electronics',
        stock: 5,
      };
      service.create.mockResolvedValue(mockProduct);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('update', () => {
    it('delega ao service com id e dto corretos', async () => {
      const dto = { price: 200 };
      const updated = { ...mockProduct, price: '200' as unknown as import('@prisma/client').Prisma.Decimal };
      service.update.mockResolvedValue(updated);

      const result = await controller.update('prod-1', dto);

      expect(service.update).toHaveBeenCalledWith('prod-1', dto);
      expect(result).toEqual(updated);
    });

    it('propaga NotFoundException quando ID não existe', async () => {
      service.update.mockRejectedValue(new NotFoundException('Product not found'));

      await expect(controller.update('invalid-id', { price: 50 })).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('delega ao service com id correto', async () => {
      service.delete.mockResolvedValue(undefined);

      await controller.delete('prod-1');

      expect(service.delete).toHaveBeenCalledWith('prod-1');
    });

    it('propaga NotFoundException quando ID não existe', async () => {
      service.delete.mockRejectedValue(new NotFoundException('Product not found'));

      await expect(controller.delete('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});
