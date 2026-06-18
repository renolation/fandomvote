import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({ description: 'Google ID token (client lấy từ Google Sign-In)' })
  @IsString()
  idToken!: string;

  @ApiPropertyOptional({ description: 'Mã mời (nếu user mới)' })
  @IsOptional()
  @IsString()
  referralCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceFingerprint?: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}

export class RequestVerificationDto {
  @ApiProperty({ enum: ['EMAIL', 'PHONE'] })
  @IsIn(['EMAIL', 'PHONE'])
  channel!: 'EMAIL' | 'PHONE';
}

export class ConfirmVerificationDto {
  @ApiProperty({ enum: ['EMAIL', 'PHONE'] })
  @IsIn(['EMAIL', 'PHONE'])
  channel!: 'EMAIL' | 'PHONE';

  @ApiProperty({ description: 'OTP 6 chữ số' })
  @IsString()
  otp!: string;
}
