import { Inject, Injectable, Logger } from '@nestjs/common';
import { createVerify } from 'crypto';
import { eq } from 'drizzle-orm';
import { Database, DRIZZLE } from '../../db/drizzle.provider';
import { users } from '../../db/schema';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AdRewardService } from '../shop/ad-reward.service';

const VERIFIER_KEYS_URL = 'https://www.gstatic.com/admob/reward/verifier-keys.json';
const KEYS_TTL_MS = 24 * 60 * 60 * 1000; // cache public key 24h
const MAX_AGE_MS = 60 * 60 * 1000; // callback cũ hơn 1h coi như hết hạn
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface VerifierKey {
  keyId: number;
  pem: string;
}

// AdMob Server-Side Verification: sau khi user xem hết rewarded ad, AdMob GET vào endpoint này
// kèm chữ ký của Google → verify chữ ký rồi mới cộng Gold. Đây là đường DUY NHẤT đáng tin
// (khác POST /shop/ads/reward chỉ dựa vào lời client) — §0.6.
//
// Bật bằng config ads.ssv_enabled = true (đồng thời chặn đường client để không cộng 2 lần)
// và dán URL callback vào từng ad unit trong AdMob console.
@Injectable()
export class AdmobSsvService {
  private readonly logger = new Logger('AdmobSSV');
  private keys = new Map<string, string>(); // key_id → PEM
  private keysFetchedAt = 0;

  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly adReward: AdRewardService,
  ) {}

  private async publicKeyPem(keyId: string): Promise<string> {
    // Hết TTL hoặc gặp key_id lạ (Google có thể xoay key) → tải lại danh sách.
    if (Date.now() - this.keysFetchedAt > KEYS_TTL_MS || !this.keys.has(keyId)) {
      await this.refreshKeys();
    }
    const pem = this.keys.get(keyId);
    if (!pem) throw new BusinessException('SSV_KEY_UNKNOWN', `Không có public key cho key_id=${keyId}`);
    return pem;
  }

  private async refreshKeys(): Promise<void> {
    const res = await fetch(VERIFIER_KEYS_URL);
    if (!res.ok) {
      throw new BusinessException('SSV_KEYS_FETCH_FAILED', `Không tải được verifier keys (HTTP ${res.status})`);
    }
    const body = (await res.json()) as { keys?: VerifierKey[] };
    const next = new Map<string, string>();
    for (const k of body.keys ?? []) next.set(String(k.keyId), k.pem);
    if (next.size === 0) throw new BusinessException('SSV_KEYS_EMPTY', 'Danh sách verifier keys rỗng');
    this.keys = next;
    this.keysFetchedAt = Date.now();
    this.logger.log(`Đã tải ${next.size} verifier key của AdMob`);
  }

  // rawQuery: query string NGUYÊN VẸN lấy từ req.originalUrl — KHÔNG parse rồi ghép lại,
  // vì chữ ký tính trên đúng chuỗi byte đó (đổi thứ tự / encode lại là verify sai).
  // Google ký phần từ tham số đầu đến ngay TRƯỚC '&signature='; signature và key_id luôn là 2 tham số cuối.
  async handleCallback(rawQuery: string) {
    const sigAt = rawQuery.indexOf('&signature=');
    if (sigAt < 0) throw new BusinessException('SSV_MALFORMED', 'Callback thiếu signature');
    const signedContent = rawQuery.slice(0, sigAt);

    // Lấy signature từ chuỗi THÔ: URLSearchParams sẽ đổi '+' thành khoảng trắng, làm hỏng base64.
    const afterSig = rawQuery.slice(sigAt + '&signature='.length);
    const nextAmp = afterSig.indexOf('&');
    const signature = nextAmp >= 0 ? afterSig.slice(0, nextAmp) : afterSig;

    const p = new URLSearchParams(rawQuery);
    const keyId = p.get('key_id') ?? '';
    const userId = p.get('user_id') ?? '';
    const transactionId = p.get('transaction_id') ?? '';
    const timestamp = Number(p.get('timestamp') ?? '');

    if (!signature || !keyId) throw new BusinessException('SSV_MALFORMED', 'Thiếu signature/key_id');
    if (!transactionId) throw new BusinessException('SSV_MALFORMED', 'Thiếu transaction_id');
    // user_id do client gắn qua ServerSideVerificationOptions — chặn giá trị rác trước khi query DB.
    if (!UUID_RE.test(userId)) throw new BusinessException('SSV_MALFORMED', 'user_id không hợp lệ');

    // 1. Verify chữ ký TRƯỚC mọi việc khác (chữ ký ECDSA dạng DER, mã hoá base64url).
    const pem = await this.publicKeyPem(keyId);
    const verified = createVerify('sha256')
      .update(signedContent, 'utf8')
      .verify({ key: pem, dsaEncoding: 'der' }, Buffer.from(signature, 'base64url'));
    if (!verified) {
      this.logger.warn(`Chữ ký SSV không hợp lệ (key_id=${keyId}, txn=${transactionId})`);
      throw new BusinessException('SSV_SIGNATURE_INVALID', 'Chữ ký AdMob không hợp lệ');
    }

    // 2. Chặn dùng lại callback cũ (timestamp của AdMob tính bằng millisecond).
    if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > MAX_AGE_MS) {
      throw new BusinessException('SSV_STALE', 'Callback đã hết hạn');
    }

    // 3. user_id phải là user thật.
    const found = await this.db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
    if (found.length === 0) throw new BusinessException('NOT_FOUND', 'user_id không tồn tại');

    // 4. Cộng Gold — replay cùng transaction_id trả lại kết quả cũ (idempotent), không cộng thêm.
    const result = await this.adReward.creditFromSsv(userId, transactionId);
    this.logger.log(`SSV hợp lệ: user=${userId} txn=${transactionId}`);
    return result;
  }
}
