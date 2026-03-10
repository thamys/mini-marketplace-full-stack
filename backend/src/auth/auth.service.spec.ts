import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserRepository } from '../users/users.repository';
import { ConflictException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: {
            findUserByEmail: jest.fn(),
            createUser: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(UserRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
    };

    it('should successfully register a new user', async () => {
      userRepository.findUserByEmail.mockResolvedValue(null);
      userRepository.createUser.mockResolvedValue({
        id: '1',
        email: registerDto.email,
        name: registerDto.name,
        passwordHash: 'hashed_password',
        role: Role.CUSTOMER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.register(registerDto);

      expect(result).toEqual({
        id: '1',
        email: registerDto.email,
        name: registerDto.name,
      });
      expect(userRepository.findUserByEmail.mock.calls[0][0]).toBe(
        registerDto.email,
      );
      expect(userRepository.createUser.mock.calls.length).toBe(1);

      const createData = userRepository.createUser.mock.calls[0][0];
      expect(createData.passwordHash).toMatch(/^\$2b\$10\$/);
    });

    it('should throw ConflictException if user already exists', async () => {
      userRepository.findUserByEmail.mockResolvedValue({
        id: '1',
        email: registerDto.email,
        name: registerDto.name,
        passwordHash: 'hashed_password',
        role: Role.CUSTOMER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
