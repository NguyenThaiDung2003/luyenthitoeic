import { formatDate } from "@/lib/format";
import type { TrendPoint } from "@/lib/types";

const MAX_SCORE = 495;

export function TrendChart({ points }: { points: TrendPoint[] }) {
  if (points.length === 0) return <p className="text-on-surface-variant">Chưa có dữ liệu.</p>;
  return (
    <ol className="flex h-48 items-end gap-3" aria-label="Điểm ước lượng các lần gần nhất">
      {points.map((point) => (
        <li key={point.attemptId} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
          <span className="font-label text-label font-semibold text-primary">{point.estimatedScore}</span>
          <div
            className="w-full max-w-14 rounded-t-lg bg-primary"
            style={{ height: `${(point.estimatedScore / MAX_SCORE) * 70}%` }}
            title={`${point.examTitle}: ${point.accuracy}%`}
          />
          <span className="text-label-sm text-on-surface-variant">{formatDate(point.submittedAt)}</span>
        </li>
      ))}
    </ol>
  );
}
