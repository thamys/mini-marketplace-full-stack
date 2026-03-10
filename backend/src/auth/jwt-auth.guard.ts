import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

interface ExtendedJwtInfo {
  name?: string;
  message?: string;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(
    err: any,
    user: TUser,
    info: ExtendedJwtInfo | undefined,
  ): TUser {
    if (err || !user) {
      // console.log('JWT Auth info:', info); // Debugging
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired');
      }
      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      if (!info || info.message === 'No auth token') {
        throw new UnauthorizedException('Token not provided');
      }
      throw err || new UnauthorizedException('Invalid token');
    }
    return user;
  }
}
