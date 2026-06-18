import { Body, Controller, Get, Ip, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { VerificationService } from './verification.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  ConfirmVerificationDto,
  GoogleAuthDto,
  RefreshDto,
  RequestVerificationDto,
} from './dto/auth-tokens.dto';

// Rate limit chặt cho auth — §11/§5 hardening.
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly verification: VerificationService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('register')
  @ApiOperation({ summary: 'Đăng ký (email/SĐT + password, mã mời optional)' })
  register(@Body() dto: RegisterDto, @Ip() ip: string) {
    return this.auth.register(dto, ip);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập email/SĐT' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('google')
  @ApiOperation({ summary: 'Đăng nhập Google (ID token)' })
  google(@Body() dto: GoogleAuthDto, @Ip() ip: string) {
    return this.auth.googleLogin(dto, ip);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Xoay refresh token (rotation + theft detection)' })
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({ summary: 'Đăng xuất (revoke refresh token)' })
  logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Thông tin user hiện tại' })
  me(@CurrentUser() user: AuthUser) {
    return this.auth.getProfile(user.id);
  }

  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('verify/request')
  @ApiOperation({ summary: 'Gửi OTP verify email/SĐT' })
  async requestVerify(@CurrentUser() user: AuthUser, @Body() dto: RequestVerificationDto) {
    await this.verification.request(user.id, dto.channel);
    return { sent: true };
  }

  @ApiBearerAuth()
  @Post('verify/confirm')
  @ApiOperation({ summary: 'Xác nhận OTP → verified → kích hoạt referral' })
  async confirmVerify(@CurrentUser() user: AuthUser, @Body() dto: ConfirmVerificationDto) {
    await this.verification.confirm(user.id, dto.channel, dto.otp);
    return { verified: true };
  }
}
