import { useEffect, useState } from 'react';

// Đồng hồ tick (mặc định 1s) để animate countdown dựa mốc SERVER. KHÔNG dùng để quyết nghiệp vụ.
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
