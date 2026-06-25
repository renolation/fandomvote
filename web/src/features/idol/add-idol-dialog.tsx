import { useState } from 'react';
import { NeuButton, NeuDialog, NeuInput } from '@/components/neu';
import { useToast } from '@/components/toast';
import { useAddIdolToCampaign } from '@/features/campaign/use-campaign';
import { useApprovedIdols } from './use-idol';

export function AddIdolDialog({
  campaignId,
  open,
  onClose,
}: {
  campaignId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const list = useApprovedIdols(search);
  const add = useAddIdolToCampaign(campaignId);
  const toast = useToast();
  const items = list.data?.items ?? [];

  const pick = async (id: string) => {
    try {
      await add.mutateAsync(id);
      toast.success('Đã thêm idol vào chiến dịch.');
      onClose();
    } catch (e) {
      toast.error(e);
    }
  };

  return (
    <NeuDialog open={open} onClose={onClose} title="Thêm idol đã duyệt">
      <NeuInput
        placeholder="Tìm idol…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
      />
      <div className="col thin-scroll" style={{ height: 320, overflowY: 'auto' }}>
        {items.length === 0 && <span className="muted">Không có idol đã duyệt phù hợp.</span>}
        {items.map((idol) => (
          <div key={idol.id} className="spread">
            <span>{idol.name}</span>
            <NeuButton size="sm" onClick={() => pick(idol.id)} disabled={add.isPending}>
              Thêm
            </NeuButton>
          </div>
        ))}
      </div>
    </NeuDialog>
  );
}
