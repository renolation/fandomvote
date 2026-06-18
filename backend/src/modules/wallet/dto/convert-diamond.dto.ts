import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class ConvertDiamondDto {
  @ApiProperty({ description: 'Số Diamond đổi sang Gold (1 Diamond = 1.000 Gold)', minimum: 1 })
  @IsInt()
  @Min(1)
  diamonds!: number;
}
