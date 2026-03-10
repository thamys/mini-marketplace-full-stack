import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterSchema } from './dto/register.dto';
import type { RegisterDto } from './dto/register.dto';
import { LoginSchema } from './dto/login.dto';
import type { LoginDto } from './dto/login.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body(new ZodValidationPipe(RegisterSchema)) registerDto: RegisterDto,
  ) {
    return await this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body(new ZodValidationPipe(LoginSchema)) loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(
    @Request() req: { user: { userId: string; email: string; role: string } },
  ) {
    // We return a structured object to avoid direct coupling with prisma models
    // and ensure no sensitive data is leaked even if req.user expands in the future.
    return {
      id: req.user.userId,
      email: req.user.email,
      role: req.user.role,
    };
  }
}
