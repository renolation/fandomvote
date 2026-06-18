import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsISO8601, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateCampaignDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'HTML/markdown thể lệ' })
  @IsOptional()
  @IsString()
  rulesContent?: string;

  @ApiProperty({ description: 'Mốc sao (chốt ở DRAFT, không sửa sau OPEN)' })
  @IsInt()
  @Min(1)
  starGoal!: number;

  @ApiPropertyOptional({ description: 'Tỉ lệ quỹ basis points (5000 = 50%)', default: 5000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  donationRatioBps?: number;

  @ApiPropertyOptional({ description: 'Thời điểm mở (ISO8601)' })
  @IsOptional()
  @IsISO8601()
  openAt?: string;

  @ApiPropertyOptional({ description: 'Thời điểm đóng (ISO8601)' })
  @IsOptional()
  @IsISO8601()
  closeAt?: string;
}

export class AddIdolDto {
  @ApiProperty()
  @IsString()
  idolId!: string;
}
