import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

// Cấu hình thưởng xem rewarded ad. Field nào bỏ trống thì giữ nguyên giá trị cũ.
export class UpdateAdConfigDto {
  @ApiPropertyOptional({ description: 'Giá 1 lượt xem (VND). Tạm cố định; sau này lấy từ eCPM ngày trước qua AdMob API.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  valueVnd?: number;

  @ApiPropertyOptional({ description: 'Tỉ lệ Gold trả về user (bps): 10000 = 100% giá trị lượt xem' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10_000)
  ratioBps?: number;

  @ApiPropertyOptional({ description: 'Trần số lượt xem được thưởng mỗi ngày (UTC+7). 0 = tắt' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(200)
  dailyCap?: number;

  @ApiPropertyOptional({ description: 'Giãn cách tối thiểu giữa 2 lượt xem (giây)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3600)
  cooldownSeconds?: number;
}
