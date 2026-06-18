import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ReferralModule } from '../referral/referral.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleAuthService } from './google-auth.service';
import { TokenService } from './token.service';
import { VerificationService } from './verification.service';

@Module({
  imports: [JwtModule.register({}), ReferralModule],
  controllers: [AuthController],
  providers: [AuthService, TokenService, GoogleAuthService, VerificationService],
  exports: [TokenService],
})
export class AuthModule {}
