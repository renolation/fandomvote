import { useEffect, useMemo, useRef } from 'react';
import { NeuButton } from '@/components/neu';
import { useToast } from '@/components/toast';

interface ImageUploadProps {
  // File đang chọn (chưa upload). null = chưa chọn.
  file: File | null;
  // Emit file đã chọn (KHÔNG upload ngay) — parent upload lúc submit.
  onChange: (file: File | null) => void;
  disabled?: boolean;
}

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX = 5 * 1024 * 1024;

// Chọn ảnh + preview cục bộ. KHÔNG gọi mạng — upload do parent thực hiện khi submit.
export function ImageUpload({ file, onChange, disabled }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = ''; // cho phép chọn lại cùng 1 file
    if (!f) return;
    if (!ALLOWED.includes(f.type)) {
      toast.error(new Error('Chỉ chấp nhận ảnh JPG / PNG / WebP / GIF'));
      return;
    }
    if (f.size > MAX) {
      toast.error(new Error('Ảnh vượt quá 5MB'));
      return;
    }
    onChange(f);
  };

  return (
    <div className="col" style={{ gap: 10, alignItems: 'center' }}>
      <div
        style={{
          width: '100%',
          maxWidth: 280,
          aspectRatio: '1 / 1',
          flexShrink: 0,
          border: '2px solid var(--c-ink)',
          borderRadius: 12,
          overflow: 'hidden',
          background: '#f5f1e8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 64, opacity: 0.5 }}>🖼</span>
        )}
      </div>
      <div className="col" style={{ gap: 6, alignItems: 'center' }}>
        <small className="muted" style={{ fontSize: 11, textAlign: 'center', wordBreak: 'break-all', maxWidth: 280 }}>
          {file ? file.name : 'PNG / JPG, tối đa 5MB. Tải lên khi gửi.'}
        </small>
        <div className="row" style={{ gap: 6 }}>
          <NeuButton size="sm" variant="blue" disabled={disabled} onClick={() => inputRef.current?.click()}>
            {file ? 'Đổi ảnh' : 'Tải ảnh lên'}
          </NeuButton>
          {file && (
            <NeuButton size="sm" variant="ghost" disabled={disabled} onClick={() => onChange(null)}>
              Xoá
            </NeuButton>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pick} />
    </div>
  );
}
