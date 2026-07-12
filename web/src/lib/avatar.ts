import type { CSSProperties } from 'react';

// Avatar placeholder kiểu sọc chéo neubrutalism (theo design FandomVote Web).
export const PALETTE = ['#FFD60A', '#3B82F6', '#22C55E', '#FB7185'];

export function colorForId(id: string): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function stripeStyle(color: string, size = 48): CSSProperties {
  return {
    width: size,
    height: size,
    flex: 'none',
    border: '3px solid #0a0a0a',
    borderRadius: size >= 64 ? 14 : 10,
    background: `repeating-linear-gradient(45deg, ${color}, ${color} 6px, #0a0a0a 6px, #0a0a0a 9px)`,
  };
}

// Avatar idol: ảnh thật nếu có avatarUrl, ngược lại placeholder sọc. Giữ đúng khung neubrutalism.
export function avatarStyle(avatarUrl: string | null | undefined, id: string, size = 48): CSSProperties {
  if (!avatarUrl) return stripeStyle(colorForId(id), size);
  return {
    width: size,
    height: size,
    flex: 'none',
    border: '3px solid #0a0a0a',
    borderRadius: size >= 64 ? 14 : 10,
    backgroundImage: `url("${avatarUrl}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
}
