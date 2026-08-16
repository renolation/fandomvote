import { useEffect, useState } from 'react';
import { NeuButton, NeuField, NeuInput } from '@/components/neu';
import { ErrorState, Loading } from '@/components/state-views';
import { useToast } from '@/components/toast';
import { formatNumber } from '@/lib/format';
import type { AdFormatFlags, UpdateAdConfigBody } from '@/types/api';
import { useAdConfig, useUpdateAdConfig } from './use-admin';

// Cấu hình quy đổi "xem 1 rewarded ad → Gold".
// Gold/lượt = giá 1 lượt xem (VND) × tỉ lệ trả về; 1 Gold = 1đ.
// Ví dụ: giá 200đ, tỉ lệ 100% → user nhận 200 Gold. Tỉ lệ 50% → 100 Gold (giữ lại 50%).
// Giá 1 lượt hiện nhập tay; sau này lấy tự động từ eCPM ngày hôm trước qua AdMob API.
// implemented = app đã cài chỗ hiển thị cho loại này. Loại chưa cài vẫn lưu được cờ,
// để khi app hỗ trợ thì bật lên là chạy, không phải phát hành lại app.
const AD_FORMATS: { key: keyof AdFormatFlags; label: string; implemented: boolean }[] = [
  { key: 'rewarded', label: '🎬 Video có thưởng', implemented: true },
  { key: 'rewardedInterstitial', label: '🎞 Video thưởng xen kẽ (sau khi vote)', implemented: true },
  { key: 'interstitial', label: '📺 Toàn màn hình', implemented: false },
  { key: 'banner', label: '📰 Banner', implemented: false },
  { key: 'appOpen', label: '🚀 Mở app', implemented: false },
  { key: 'native', label: '🧩 Native', implemented: false },
];

export function AdRewardConfigCard() {
  const { data, isLoading, error, refetch } = useAdConfig();
  const update = useUpdateAdConfig();
  const toast = useToast();

  const [valueVnd, setValueVnd] = useState('');
  const [ratioPercent, setRatioPercent] = useState('');
  const [dailyCap, setDailyCap] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState('');
  const [riGap, setRiGap] = useState('');
  const [formats, setFormats] = useState<AdFormatFlags | null>(null);

  // Nạp giá trị hiện tại vào form khi tải xong / sau khi lưu.
  useEffect(() => {
    if (!data) return;
    setValueVnd(String(data.valueVnd));
    setRatioPercent(String(data.ratioBps / 100));
    setDailyCap(String(data.dailyCap));
    setCooldownSeconds(String(data.cooldownSeconds));
    setRiGap(String(data.rewardedInterstitialGapSeconds));
    setFormats(data.formats);
  }, [data]);

  const parsedValue = Number(valueVnd);
  const parsedRatio = Number(ratioPercent);
  const previewGold =
    Number.isFinite(parsedValue) && Number.isFinite(parsedRatio)
      ? Math.floor((parsedValue * Math.round(parsedRatio * 100)) / 10000)
      : 0;

  const submit = async () => {
    const cap = Number(dailyCap);
    const cooldown = Number(cooldownSeconds);
    if (!Number.isFinite(parsedValue) || parsedValue < 0) return toast.error('Giá 1 lượt phải ≥ 0');
    if (!Number.isFinite(parsedRatio) || parsedRatio < 0 || parsedRatio > 100) {
      return toast.error('Tỉ lệ phải trong khoảng 0–100%');
    }
    if (!Number.isFinite(cap) || cap < 0) return toast.error('Trần lượt/ngày phải ≥ 0');
    if (!Number.isFinite(cooldown) || cooldown < 0) return toast.error('Cooldown phải ≥ 0');
    const gap = Number(riGap);
    if (!Number.isFinite(gap) || gap < 0) return toast.error('Giãn cách mời phải ≥ 0');

    const body: UpdateAdConfigBody = {
      valueVnd: Math.round(parsedValue),
      ratioBps: Math.round(parsedRatio * 100), // 100% → 10000 bps
      dailyCap: Math.round(cap),
      cooldownSeconds: Math.round(cooldown),
      rewardedInterstitialGapSeconds: Math.round(gap),
      formats: formats ?? undefined,
    };
    try {
      await update.mutateAsync(body);
      toast.success('Đã lưu cấu hình thưởng quảng cáo');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lưu thất bại');
    }
  };

  return (
    <div style={{ background: 'var(--c-white)', border: '3px solid var(--c-ink)', borderRadius: 12, boxShadow: '5px 5px 0 var(--c-ink)', overflow: 'hidden', marginBottom: 20 }}>
      <div className="spread" style={{ padding: '16px 20px', borderBottom: '3px solid var(--c-ink)' }}>
        <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 17 }}>🎬 Thưởng xem quảng cáo</span>
        <span className="mono" style={{ fontSize: 12, color: '#555' }}>
          {data ? `hiện tại: ${formatNumber(data.goldPerView)} Gold / lượt` : '—'}
        </span>
      </div>

      {isLoading && <Loading />}
      {error && <ErrorState error={error} onRetry={() => refetch()} />}

      {data && (
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <NeuField label="Giá 1 lượt xem (VND)">
              <NeuInput type="number" min={0} value={valueVnd} onChange={(e) => setValueVnd(e.target.value)} />
            </NeuField>
            <NeuField label="Tỉ lệ trả về user (%)">
              <NeuInput type="number" min={0} max={100} value={ratioPercent} onChange={(e) => setRatioPercent(e.target.value)} />
            </NeuField>
            <NeuField label="Trần lượt/ngày (0 = không giới hạn)">
              <NeuInput type="number" min={0} value={dailyCap} onChange={(e) => setDailyCap(e.target.value)} />
            </NeuField>
            <NeuField label="Cooldown giữa 2 lượt (giây)">
              <NeuInput type="number" min={0} value={cooldownSeconds} onChange={(e) => setCooldownSeconds(e.target.value)} />
            </NeuField>
            <NeuField label="Giãn cách mời sau khi vote (giây)">
              <NeuInput type="number" min={0} value={riGap} onChange={(e) => setRiGap(e.target.value)} />
            </NeuField>
          </div>

          {/* Bật/tắt loại quảng cáo — app đọc cờ này từ server, đổi xong có hiệu lực ngay,
              không cần phát hành bản app mới lên store. */}
          {formats && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
                Loại quảng cáo hiển thị trong app
              </div>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                {AD_FORMATS.map(({ key, label, implemented }) => {
                  const on = formats[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormats({ ...formats, [key]: !on })}
                      title={implemented ? undefined : 'App chưa cài loại này — bật sẽ chưa thấy gì'}
                      style={{
                        border: '2px solid var(--c-ink)',
                        borderRadius: 20,
                        padding: '7px 14px',
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer',
                        background: on ? '#22C55E' : 'var(--c-white)',
                        color: on ? '#fff' : 'var(--c-ink)',
                        opacity: implemented ? 1 : 0.6,
                      }}
                    >
                      {on ? '✓ ' : ''}
                      {label}
                      {!implemented && ' *'}
                    </button>
                  );
                })}
              </div>
              <small className="muted" style={{ fontSize: 11, display: 'block', marginTop: 8 }}>
                * app chưa cài loại này — bật giờ cũng chưa hiển thị, nhưng cờ được lưu sẵn cho bản app sau.
              </small>
            </div>
          )}

          <div style={{ marginTop: 14, background: 'var(--c-yellow)', border: '3px solid var(--c-ink)', borderRadius: 11, padding: '12px 14px', fontSize: 13, fontWeight: 600, lineHeight: 1.6 }}>
            User xem xong 1 quảng cáo → nhận <strong>{formatNumber(previewGold)} Gold</strong>
            {' '}(= {formatNumber(Math.round(parsedValue) || 0)}đ × {Number.isFinite(parsedRatio) ? parsedRatio : 0}%).{' '}
            {Math.round(Number(dailyCap)) > 0 ? (
              <>
                Tối đa <strong>{formatNumber(Math.round(Number(dailyCap)))} lượt/ngày</strong> ≈{' '}
                {formatNumber(previewGold * Math.round(Number(dailyCap)))} Gold/ngày mỗi user.
              </>
            ) : (
              <>
                <strong>Không giới hạn số lượt/ngày</strong> — chi phí mỗi user không có trần trên. Đặt số &gt; 0 nếu
                muốn khống chế. Tắt hẳn thưởng thì để tỉ lệ hoặc giá = 0.
              </>
            )}
          </div>

          <div className="row" style={{ marginTop: 14, gap: 10 }}>
            <NeuButton variant="green" onClick={submit} disabled={update.isPending}>
              {update.isPending ? 'Đang lưu…' : 'Lưu cấu hình'}
            </NeuButton>
            <span className="muted" style={{ fontSize: 12 }}>
              Giá 1 lượt sẽ tự lấy từ eCPM ngày hôm trước (AdMob API) ở bước sau.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
