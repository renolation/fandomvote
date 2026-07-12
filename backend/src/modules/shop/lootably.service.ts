import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OFFERWALL_USD_TO_GOLD } from '../../common/utils/money.util';

const OFFERS_API_URL = 'https://api.lootably.com/api/v2/offers/get';

// Offer đã chuẩn hoá để hiển thị ở Shop (kiếm Gold).
export interface LiveOffer {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  actionUrl: string;
  rewardGold: number;
  // Chỉ dùng cho fallback offer tĩnh (Lootably dùng imageUrl).
  icon?: string | null;
  iconBg?: string | null;
}

// Shape offer trả về từ Lootably Offers API (chỉ khai field dùng tới).
interface LootablyOffer {
  type?: string;
  offerID: string | number;
  name?: string;
  description?: string;
  image?: string;
  link?: string;
  revenue?: number | string;
  goals?: Array<{ revenue?: number | string }>;
}
interface LootablyOffersResponse {
  data?: { offers?: LootablyOffer[] };
  offers?: LootablyOffer[];
}

// Tích hợp Lootably offerwall (native): fetch offers server-side + quy đổi payout USD → Gold.
@Injectable()
export class LootablyService {
  private readonly log = new Logger(LootablyService.name);
  constructor(private readonly config: ConfigService) {}

  private get apiKey(): string {
    return this.config.get<string>('LOOTABLY_API_KEY') ?? '';
  }
  private get placementId(): string {
    return this.config.get<string>('LOOTABLY_PLACEMENT_ID') ?? '';
  }
  isConfigured(): boolean {
    return !!(this.apiKey && this.placementId);
  }

  // Gold thưởng từ payout USD: (USD × 26.000) / 2.
  goldForUsd(usd: number): number {
    return Number.isFinite(usd) && usd > 0 ? Math.round(usd * OFFERWALL_USD_TO_GOLD) : 0;
  }

  // Revenue USD 1 offer để hiển thị: singlestep dùng revenue; multistep cộng các goal.
  private offerRevenueUsd(o: LootablyOffer): number {
    if (o.type === 'multistep' && Array.isArray(o.goals)) {
      return o.goals.reduce((sum, g) => sum + (Number(g.revenue) || 0), 0);
    }
    const r = Number(o.revenue);
    return Number.isFinite(r) ? r : 0;
  }

  async fetchOffers(userId: string, ip: string, userAgent: string): Promise<LiveOffer[]> {
    if (!this.isConfigured()) return [];
    try {
      const res = await fetch(OFFERS_API_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          apiKey: this.apiKey,
          placementID: this.placementId,
          userData: { userID: userId, userAgentHeader: userAgent || 'Mozilla/5.0', ipAddress: ip || '' },
        }),
      });
      if (!res.ok) {
        this.log.warn(`Lootably offers HTTP ${res.status}`);
        return [];
      }
      const json = (await res.json()) as LootablyOffersResponse;
      const offers = json.data?.offers ?? json.offers ?? [];
      return offers
        .map((o) => ({
          id: String(o.offerID),
          title: String(o.name ?? 'Offer'),
          description: o.description ? String(o.description) : null,
          imageUrl: o.image ? String(o.image) : null,
          actionUrl: String(o.link ?? ''),
          rewardGold: this.goldForUsd(this.offerRevenueUsd(o)),
        }))
        .filter((o) => o.actionUrl.length > 0 && o.rewardGold > 0);
    } catch (e) {
      this.log.error(`Lootably offers fetch failed: ${(e as Error).message}`);
      return [];
    }
  }
}
