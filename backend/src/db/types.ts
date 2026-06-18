import { db } from './drizzle.provider';

// Alias dùng chung cho cả db và tx — service phụ nhận DbOrTx, không tự mở transaction (§1.2).
export type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];
