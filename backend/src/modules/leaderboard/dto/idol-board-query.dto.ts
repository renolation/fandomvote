import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class IdolBoardQueryDto {
  @ApiPropertyOptional({ enum: ['DAY', 'WEEK', 'MONTH'], default: 'WEEK' })
  @IsOptional()
  @IsIn(['DAY', 'WEEK', 'MONTH'])
  period: 'DAY' | 'WEEK' | 'MONTH' = 'WEEK';
}
