import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min, ValidateNested } from 'class-validator';

// Bật/tắt từng loại quảng cáo. Field nào bỏ trống thì giữ nguyên.
// Client đọc các cờ này từ server → bật/tắt quảng cáo KHÔNG cần cập nhật app ở store.
export class AdFormatFlagsDto {
  @ApiPropertyOptional({ description: 'Video có thưởng (đang dùng ở tab Shop)' })
  @IsOptional()
  @IsBoolean()
  rewarded?: boolean;

  @ApiPropertyOptional({ description: 'Video có thưởng xen kẽ (có màn giới thiệu trước)' })
  @IsOptional()
  @IsBoolean()
  rewardedInterstitial?: boolean;

  @ApiPropertyOptional({ description: 'Quảng cáo toàn màn hình' })
  @IsOptional()
  @IsBoolean()
  interstitial?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  banner?: boolean;

  @ApiPropertyOptional({ description: 'Quảng cáo lúc mở app' })
  @IsOptional()
  @IsBoolean()
  appOpen?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  native?: boolean;
}

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

  @ApiPropertyOptional({ description: 'Trần số lượt xem được thưởng mỗi ngày (UTC+7). 0 = không giới hạn' })
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

  @ApiPropertyOptional({ description: 'Giãn cách tối thiểu giữa 2 lần mời xem rewarded interstitial (giây)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86_400)
  rewardedInterstitialGapSeconds?: number;

  @ApiPropertyOptional({ type: AdFormatFlagsDto, description: 'Bật/tắt từng loại quảng cáo' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdFormatFlagsDto)
  formats?: AdFormatFlagsDto;
}
