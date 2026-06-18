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
