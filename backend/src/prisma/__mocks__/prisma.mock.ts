/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable */
import type { PrismaClient as RealPrismaClient, Prisma as PrismaNamespace, User } from '../../../generated/prisma/client.js';

export const Prisma = {} as unknown as typeof PrismaNamespace;

export class PrismaClient {
  async $connect(): Promise<void> {}
  async $disconnect(): Promise<void> {}
  user = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as any;
}

export interface PrismaClient extends RealPrismaClient {}

export type { User };
