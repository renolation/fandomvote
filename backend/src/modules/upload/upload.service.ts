import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { BusinessException } from '../../common/exceptions/business.exception';

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

interface UploadFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

// Proxy upload ảnh lên Cloudflare R2 (S3-compatible). Trả về URL public + key.
@Injectable()
export class UploadService {
  private client?: S3Client;

  constructor(private readonly config: ConfigService) {}

  private getEnv() {
    const accountId = this.config.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('R2_SECRET_ACCESS_KEY');
    const bucket = this.config.get<string>('R2_BUCKET') ?? 'cdn-dev';
    const publicBaseUrl = this.config.get<string>('R2_PUBLIC_BASE_URL');
    if (!accountId || !accessKeyId || !secretAccessKey || !publicBaseUrl) {
      throw new BusinessException('UPLOAD_NOT_CONFIGURED', 'Chưa cấu hình R2 (thiếu R2_* env)');
    }
    return { accountId, accessKeyId, secretAccessKey, bucket, publicBaseUrl };
  }

  // Khởi tạo S3Client lazy (sau khi đã chắc chắn có đủ env).
  private getClient(env: ReturnType<UploadService['getEnv']>): S3Client {
    if (!this.client) {
      this.client = new S3Client({
        endpoint: `https://${env.accountId}.r2.cloudflarestorage.com`,
        region: 'auto',
        credentials: {
          accessKeyId: env.accessKeyId,
          secretAccessKey: env.secretAccessKey,
        },
        // aws-sdk v3 (>=3.729) mặc định thêm checksum x-amz-checksum-crc32 → R2 từ chối
        // (SignatureDoesNotMatch). Chỉ tính checksum khi thật sự bắt buộc để tương thích R2.
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
      });
    }
    return this.client;
  }

  async upload(file: UploadFile): Promise<{ url: string; key: string }> {
    const ext = ALLOWED_MIME[file.mimetype];
    if (!ext) {
      throw new BusinessException('INVALID_FILE', 'Chỉ chấp nhận ảnh JPG/PNG/WebP/GIF');
    }
    if (file.buffer.length > MAX_SIZE) {
      throw new BusinessException('FILE_TOO_LARGE', 'Ảnh vượt quá 5MB');
    }

    const env = this.getEnv();
    const client = this.getClient(env);
    const key = `uploads/${new Date().getFullYear()}/${randomUUID()}${ext}`;

    await client.send(
      new PutObjectCommand({
        Bucket: env.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return { url: `${env.publicBaseUrl.replace(/\/$/, '')}/${key}`, key };
  }
}
