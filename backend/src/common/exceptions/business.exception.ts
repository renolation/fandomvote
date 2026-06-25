import { HttpStatus } from '@nestjs/common';

// Mã lỗi nghiệp vụ → HTTP. Filter map ra { error: { code, message } } — §11.
export const BUSINESS_ERROR_STATUS: Record<string, HttpStatus> = {
  INSUFFICIENT_BALANCE: HttpStatus.UNPROCESSABLE_ENTITY,
  GREEN_CAP_EXCEEDED: HttpStatus.UNPROCESSABLE_ENTITY,
  CAMPAIGN_NOT_OPEN: HttpStatus.CONFLICT,
  CAMPAIGN_CLOSED: HttpStatus.CONFLICT,
  INVALID_STATE: HttpStatus.CONFLICT,
  IDOL_DUPLICATE: HttpStatus.CONFLICT,
  OUT_OF_STOCK: HttpStatus.CONFLICT,
  DEAL_INACTIVE: HttpStatus.CONFLICT,
  REPLAY_DETECTED: HttpStatus.CONFLICT,
  IN_PROGRESS: HttpStatus.CONFLICT,
  ALREADY_CLAIMED: HttpStatus.CONFLICT,
  REFERRAL_LIMIT: HttpStatus.CONFLICT,
  SELF_REFERRAL: HttpStatus.BAD_REQUEST,
  DIAMOND_NO_DIRECT_VOTE: HttpStatus.BAD_REQUEST,
  VALIDATION_ERROR: HttpStatus.BAD_REQUEST,
  INVALID_CREDENTIALS: HttpStatus.UNAUTHORIZED,
  TOKEN_INVALID: HttpStatus.UNAUTHORIZED,
  TOKEN_REUSE_DETECTED: HttpStatus.UNAUTHORIZED,
  SIGNATURE_INVALID: HttpStatus.UNAUTHORIZED,
  ACCOUNT_FLAGGED: HttpStatus.FORBIDDEN,
  FORBIDDEN: HttpStatus.FORBIDDEN,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  CONFLICT: HttpStatus.CONFLICT,
  FILE_TOO_LARGE: HttpStatus.PAYLOAD_TOO_LARGE,
  UPLOAD_NOT_CONFIGURED: HttpStatus.SERVICE_UNAVAILABLE,
};

export type BusinessErrorCode = keyof typeof BUSINESS_ERROR_STATUS | string;

export class BusinessException extends Error {
  readonly code: string;
  readonly status: HttpStatus;
  readonly details?: unknown;

  constructor(code: BusinessErrorCode, message?: string, details?: unknown) {
    super(message ?? code);
    this.code = code;
    this.status = BUSINESS_ERROR_STATUS[code] ?? HttpStatus.BAD_REQUEST;
    this.details = details;
  }
}
