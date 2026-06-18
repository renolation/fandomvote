import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { BusinessException } from '../../common/exceptions/business.exception';

export interface GooglePayload {
  sub: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

// Verify Google ID token (cert Google, aud/iss/exp) — §11.
@Injectable()
export class GoogleAuthService {
  private readonly clientId: string;
  private readonly client: OAuth2Client;

  constructor(config: ConfigService) {
    this.clientId = config.get<string>('GOOGLE_CLIENT_ID') ?? '';
    this.client = new OAuth2Client(this.clientId);
  }

  async verify(idToken: string): Promise<GooglePayload> {
    try {
      const ticket = await this.client.verifyIdToken({ idToken, audience: this.clientId });
      const p = ticket.getPayload();
      if (!p?.sub || !p.email) {
        throw new BusinessException('SIGNATURE_INVALID', 'Google token thiếu thông tin');
      }
      return {
        sub: p.sub,
        email: p.email,
        name: p.name ?? p.email.split('@')[0],
        emailVerified: !!p.email_verified,
      };
    } catch (e) {
      if (e instanceof BusinessException) throw e;
      throw new BusinessException('SIGNATURE_INVALID', 'Google token không hợp lệ');
    }
  }
}
