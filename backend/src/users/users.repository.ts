import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserById = async (id: string): Promise<User | null> => {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  };

  findUserByEmail = async (email: string): Promise<User | null> => {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  };

  findAllUsers = async (): Promise<User[]> => {
    return await this.prisma.user.findMany();
  };

  createUser = async (data: Prisma.UserCreateInput): Promise<User> => {
    return await this.prisma.user.create({
      data,
    });
  };
}
