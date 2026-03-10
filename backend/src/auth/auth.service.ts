import { Injectable, ConflictException } from '@nestjs/common';
import { UserRepository } from '../users/users.repository';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async register(data: RegisterDto) {
    const existingUser = await this.userRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('Este email já está cadastrado');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await this.userRepository.createUser({
      email: data.email,
      name: data.name,
      passwordHash,
      role: Role.CUSTOMER,
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}
