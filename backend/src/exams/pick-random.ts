import { randomInt } from 'node:crypto';

// Fisher-Yates: mọi tập con có xác suất như nhau
export function pickRandom<T>(items: readonly T[], count: number) {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
