import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class ConfirmPhysicalDto {
  @ApiProperty()
  @IsString()
  shippingAddressId!: string;
}

export class CreateAddressDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  recipient!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  phone!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  line1!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  province!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
