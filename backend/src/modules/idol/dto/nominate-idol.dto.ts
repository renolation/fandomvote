import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class NominateIdolDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aliases?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Mô tả ngắn về idol' })
  @IsOptional()
  @IsString()
  bio?: string;
}

export class CheckDuplicateQueryDto {
  @ApiProperty({ description: 'Tên cần check trùng (normalized)' })
  @IsString()
  @MinLength(1)
  name!: string;
}
