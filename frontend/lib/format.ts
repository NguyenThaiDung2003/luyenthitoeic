export function percent(part: number, total: number) {
  return total === 0 ? 0 : Math.round((1000 * part) / total) / 10;
}

export function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours} giờ ${minutes % 60} phút`;
  return minutes > 0 ? `${minutes} phút ${seconds % 60} giây` : `${seconds} giây`;
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN");
}
