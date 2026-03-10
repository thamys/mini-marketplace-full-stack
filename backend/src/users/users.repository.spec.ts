import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from './users.repository';
import { PrismaService } from '../prisma/prisma.service';
import { User, Role } from '@prisma/client';

type MockPrismaService = {
  user: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
  };
};

const mockPrismaService: MockPrismaService = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
};

describe('UserRepository', () => {
  let repository: UserRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findUserById', () => {
    it('should return a user by id', async () => {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test',
        passwordHash: 'hashed_password',
        role: Role.CUSTOMER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result: User | null = await repository.findUserById('1');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await repository.findUserById('1');
      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create and return a new user', async () => {
      const mockInput = {
        email: 'new@example.com',
        name: 'New User',
        passwordHash: 'hashed_password',
      };
      const mockCreatedUser: User = {
        id: '2',
        ...mockInput,
        passwordHash: 'hashed_password',
        role: Role.CUSTOMER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);

      const result: User = await repository.createUser(mockInput);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: mockInput,
      });
      expect(result).toEqual(mockCreatedUser);
    });
  });
});
