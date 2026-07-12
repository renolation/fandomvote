import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class OfferwallPostbackDto {
  @ApiProperty()
  @IsString()
  userId!: string;

  @ApiProperty({ description: 'ID giao dịch của offerwall (idempotency/replay)' })
  @IsString()
  transactionId!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  goldAmount!: number;

  @ApiPropertyOptional({ enum: ['CREDIT', 'CHARGEBACK'], default: 'CREDIT' })
  @IsOptional()
  @IsIn(['CREDIT', 'CHARGEBACK'])
  type?: 'CREDIT' | 'CHARGEBACK';

  @ApiProperty({ description: 'HMAC-SHA256(secret, `userId:transactionId:goldAmount`)' })
  @IsString()
  signature!: string;
}

export class IapWebhookDto {
  @ApiProperty()
  @IsString()
  userId!: string;

  @ApiProperty({ description: 'transaction_id của payment provider (chống replay)' })
  @IsString()
  transactionId!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  diamondAmount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  packageSku?: string;

  @ApiProperty({ description: 'HMAC-SHA256(secret, `userId:transactionId:diamondAmount`)' })
  @IsString()
  signature!: string;
}

// Lootably offerwall postback (GET query). Verify: SHA256(userID + ip + revenue + currencyReward + SECRET).
export class LootablyPostbackDto {
  @ApiProperty() @IsString() userID!: string;
  @ApiPropertyOptional({ description: 'IP end-user do Lootably ghi (nằm trong hash)' })
  @IsOptional() @IsString() ip?: string;
  @ApiProperty({ description: 'Payout publisher (USD)' }) @IsString() revenue!: string;
  @ApiProperty({ description: 'Số currency Lootably trả user' }) @IsString() currencyReward!: string;
  @ApiProperty({ description: 'ID giao dịch (idempotency/replay)' }) @IsString() transactionID!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() offerID?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() offerName?: string;
  @ApiProperty({ description: 'SHA256 hash để verify' }) @IsString() hash!: string;
}
