import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class BoardQueryDto {
  @ApiPropertyOptional({ enum: ['TOP_VOTER', 'TOP_EARNER'], default: 'TOP_VOTER' })
  @IsOptional()
  @IsIn(['TOP_VOTER', 'TOP_EARNER'])
  type: 'TOP_VOTER' | 'TOP_EARNER' = 'TOP_VOTER';

  @ApiPropertyOptional({ enum: ['DAY', 'WEEK', 'MONTH'], default: 'WEEK' })
  @IsOptional()
  @IsIn(['DAY', 'WEEK', 'MONTH'])
  period: 'DAY' | 'WEEK' | 'MONTH' = 'WEEK';

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
