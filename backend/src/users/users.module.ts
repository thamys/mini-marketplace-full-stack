import { Module } from '@nestjs/common';
import { UserRepository } from './users.repository';

@Module({
  providers: [UserRepository],
  exports: [UserRepository],
})
export class UsersModule {}
