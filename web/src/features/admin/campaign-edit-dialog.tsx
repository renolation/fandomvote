import { useState } from 'react';
import { NeuButton, NeuDialog, NeuField, NeuInput, NeuTextarea } from '@/components/neu';
import { useToast } from '@/components/toast';
import type { Campaign, UpdateCampaignBody } from '@/types/api';
import { useUpdateCampaign } from './use-admin';

// ISO → 'YYYY-MM-DDTHH:mm' (giờ local) cho input datetime-local.
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

// Sửa campaign (DEV) — áp dụng cho mọi trạng thái, kể cả đã kết thúc (RESOLVED).
export function CampaignEditDialog({ campaign, open, onClose }: { campaign: Campaign; open: boolean; onClose: () => void }) {
  const update = useUpdateCampaign();
  const toast = useToast();
  const [title, setTitle] = useState(campaign.title);
  const [prize, setPrize] = useState(campaign.prize ?? '');
  const [description, setDescription] = useState(campaign.description ?? '');
  const [rulesContent, setRulesContent] = useState(campaign.rulesContent ?? '');
  const [starGoal, setStarGoal] = useState(String(campaign.starGoal));
  const [donationPct, setDonationPct] = useState(String(campaign.donationRatioBps / 100));
  const [closeAt, setCloseAt] = useState(toLocalInput(campaign.closeAt));

  const submit = async () => {
    try {
      const body: UpdateCampaignBody = {
        title: title.trim(),
        prize: prize.trim() || undefined,
        description: description.trim() || undefined,
        rulesContent: rulesContent.trim() || undefined,
        starGoal: Math.max(1, parseInt(starGoal, 10) || campaign.starGoal),
        donationRatioBps: Math.min(10000, Math.max(0, Math.round((parseFloat(donationPct) || 0) * 100))),
        closeAt: closeAt ? new Date(closeAt).toISOString() : null,
      };
      await update.mutateAsync({ id: campaign.id, body });
      toast.success('Đã cập nhật campaign');
      onClose();
    } catch (e) {
      toast.error(e);
    }
  };

  return (
    <NeuDialog
      open={open}
      onClose={onClose}
      title={`✏️ Sửa campaign`}
      footer={
        <NeuButton variant="green" style={{ width: '100%' }} loading={update.isPending} onClick={submit}>
          Lưu thay đổi
        </NeuButton>
      }
    >
      <NeuField label="Tên campaign">
        <NeuInput value={title} onChange={(e) => setTitle(e.target.value)} />
      </NeuField>
      <NeuField label="Phần thưởng (prize)">
        <NeuInput value={prize} onChange={(e) => setPrize(e.target.value)} placeholder="VD: Billboard LED Times Square…" />
      </NeuField>
      <NeuField label="Mô tả">
        <NeuInput value={description} onChange={(e) => setDescription(e.target.value)} />
      </NeuField>
      <NeuField label="Star Goal (mốc sao)">
        <NeuInput inputMode="numeric" value={starGoal} onChange={(e) => setStarGoal(e.target.value)} />
      </NeuField>
      <NeuField label="Tỉ lệ quỹ (%)">
        <NeuInput inputMode="numeric" value={donationPct} onChange={(e) => setDonationPct(e.target.value)} />
      </NeuField>
      <NeuField label="Thời điểm đóng">
        <NeuInput type="datetime-local" value={closeAt} onChange={(e) => setCloseAt(e.target.value)} />
      </NeuField>
      <NeuField label="Thể lệ (HTML/markdown)">
        <NeuTextarea rows={4} value={rulesContent} onChange={(e) => setRulesContent(e.target.value)} />
      </NeuField>
    </NeuDialog>
  );
}
