import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

// Deal chỉ nhận GOLD hoặc DIAMOND (GREEN không dùng để đổi quà — §8).
const DEAL_CURRENCIES = ['GOLD', 'DIAMOND'] as const;
const ITEM_TYPES = ['DIGITAL', 'PHYSICAL'] as const;

export class CreateDealDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'ID đối tác cung cấp quà' })
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiProperty({ description: 'Giá quy đổi (điểm)' })
  @IsInt()
  @Min(1)
  cost!: number;

  @ApiProperty({ enum: DEAL_CURRENCIES })
  @IsIn(DEAL_CURRENCIES)
  currency!: (typeof DEAL_CURRENCIES)[number];

  @ApiProperty({ enum: ITEM_TYPES })
  @IsIn(ITEM_TYPES)
  itemType!: (typeof ITEM_TYPES)[number];

  @ApiProperty({ description: 'Số lượng kho' })
  @IsInt()
  @Min(0)
  stock!: number;

  @ApiPropertyOptional({ description: 'Số ngày hiệu lực của quà sau khi đổi' })
  @IsOptional()
  @IsInt()
  @Min(1)
  validityDays?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// Sửa deal: mọi field optional. stock_sold KHÔNG cho sửa (chỉ tăng khi user đổi — §8).
export class UpdateDealDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  cost?: number;

  @ApiPropertyOptional({ enum: DEAL_CURRENCIES })
  @IsOptional()
  @IsIn(DEAL_CURRENCIES)
  currency?: (typeof DEAL_CURRENCIES)[number];

  @ApiPropertyOptional({ enum: ITEM_TYPES })
  @IsOptional()
  @IsIn(ITEM_TYPES)
  itemType?: (typeof ITEM_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  validityDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
