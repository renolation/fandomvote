import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { NeuButton, NeuCard, NeuField, NeuInput, NeuTextarea } from '@/components/neu';
import { useToast } from '@/components/toast';
import { useCreateCampaign } from '@/features/admin/use-admin';

export function AdminCampaignCreatePage() {
  const create = useCreateCampaign();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    rulesContent: '',
    prize: '',
    starGoal: 1000,
    donationPercent: 50,
    closeAt: '',
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await create.mutateAsync({
        title: form.title,
        description: form.description || undefined,
        rulesContent: form.rulesContent || undefined,
        prize: form.prize || undefined,
        starGoal: form.starGoal,
        donationRatioBps: Math.round(form.donationPercent * 100), // % → basis points
        closeAt: form.closeAt ? new Date(form.closeAt).toISOString() : undefined,
      });
      toast.success('Đã tạo chiến dịch (DRAFT).');
      navigate('/admin');
    } catch (err) {
      toast.error(err);
    }
  };

  return (
    <div className="col" style={{ maxWidth: 520 }}>
      <h2 style={{ margin: 0 }}>Tạo chiến dịch</h2>
      <NeuCard>
        <form onSubmit={submit}>
          <NeuField label="Tiêu đề">
            <NeuInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </NeuField>
          <NeuField label="Mô tả">
            <NeuInput
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </NeuField>
          <NeuField label="Thể lệ (HTML/markdown)">
            <NeuTextarea
              rows={4}
              value={form.rulesContent}
              onChange={(e) => setForm({ ...form, rulesContent: e.target.value })}
            />
          </NeuField>
          <NeuField label="Phần thưởng (prize)">
            <NeuInput
              value={form.prize}
              placeholder="VD: iPhone 16 Pro Max cho fan có công đầu"
              onChange={(e) => setForm({ ...form, prize: e.target.value })}
            />
          </NeuField>
          <NeuField label="Mốc sao (star goal)">
            <NeuInput
              type="number"
              min={1}
              value={form.starGoal}
              onChange={(e) => setForm({ ...form, starGoal: Number(e.target.value) || 1 })}
            />
          </NeuField>
          <NeuField label="Tỉ lệ quỹ (%)">
            <NeuInput
              type="number"
              min={0}
              max={100}
              value={form.donationPercent}
              onChange={(e) => setForm({ ...form, donationPercent: Number(e.target.value) || 0 })}
            />
          </NeuField>
          <NeuField label="Đóng lúc (tuỳ chọn)">
            <NeuInput
              type="datetime-local"
              value={form.closeAt}
              onChange={(e) => setForm({ ...form, closeAt: e.target.value })}
            />
          </NeuField>
          <NeuButton type="submit" variant="green" loading={create.isPending} style={{ width: '100%' }}>
            Tạo (DRAFT)
          </NeuButton>
        </form>
      </NeuCard>
    </div>
  );
}
