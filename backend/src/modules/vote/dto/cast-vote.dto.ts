import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

export class CastVoteDto {
  @ApiProperty({ description: 'ID của campaign_idols (idol trong 1 campaign)' })
  @IsString()
  campaignIdolId!: string;

  @ApiProperty({ description: 'Số phiếu (Green trừ trước → Gold sau)', minimum: 1 })
  @IsInt()
  @Min(1)
  amount!: number;
}
