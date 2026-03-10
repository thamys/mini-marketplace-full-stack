import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserRepository } from '../users/users.repository';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<UserRepository>;
  let jwtServiceMock: { sign: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();
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
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(UserRepository);
    jwtServiceMock = module.get(JwtService);
  });

  it('TC-B01: should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
    };

    it('TC-B02: should successfully register a new user', async () => {
      userRepository.findUserByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      userRepository.createUser.mockResolvedValue({
        id: '1',
        email: registerDto.email,
        name: registerDto.name,
        passwordHash: 'hashed_password',
        role: Role.CUSTOMER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jwtServiceMock.sign.mockReturnValue('mock_token');
      const result = await service.register(registerDto);

      expect(result).toEqual({
        access_token: 'mock_token',
        expiresIn: '24h',
        user: {
          id: '1',
          email: registerDto.email,
          name: registerDto.name,
          role: Role.CUSTOMER,
        },
      });
      expect(userRepository.findUserByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(userRepository.createUser).toHaveBeenCalledWith({
        email: registerDto.email,
        name: registerDto.name,
        passwordHash: 'hashed_password',
        role: Role.CUSTOMER,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
    });

    it('TC-B03: should throw ConflictException if user already exists', async () => {
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

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: '1',
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      role: Role.CUSTOMER,
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('TC-B04: should successfully login with valid credentials', async () => {
      userRepository.findUserByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtServiceMock.sign.mockReturnValue('mock_token');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: 'mock_token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        },
        expiresIn: '24h',
      });
      expect(jwtServiceMock.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash,
      );
    });

    it('TC-B05: should throw UnauthorizedException if email not found', async () => {
      userRepository.findUserByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('TC-B06: should throw UnauthorizedException if password incorrect', async () => {
      userRepository.findUserByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
