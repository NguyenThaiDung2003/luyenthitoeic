"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Icon } from "./icon";
import { secondaryButtonClass } from "./ui";

interface Explanation {
  id: string;
  helpful: boolean | null;
  content: {
    whyCorrect: string;
    whyWrong: string;
    keyPoint: string;
    similarExample: string;
  };
}

const SECTIONS = [
  ["whyCorrect", "Vì sao đáp án đúng"],
  ["whyWrong", "Vì sao lựa chọn của bạn sai"],
  ["keyPoint", "Điểm cần nhớ"],
  ["similarExample", "Ví dụ tương tự"],
] as const;

export function AiExplanation({ attemptId, questionId }: { attemptId: string; questionId: string }) {
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setExplanation(
        await api<Explanation>(`/attempts/${attemptId}/questions/${questionId}/explanation`, { method: "POST" }),
      );
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không tải được giải thích.");
    } finally {
      setLoading(false);
    }
  };

  const vote = async (helpful: boolean) => {
    if (!explanation) return;
    setError(null);
    try {
      await api(`/ai-explanations/${explanation.id}/feedback`, { method: "POST", body: { helpful } });
      setExplanation({ ...explanation, helpful });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không gửi được phản hồi.");
    }
  };

  if (!explanation) {
    return (
      <div className="mt-2">
        <button type="button" disabled={loading} onClick={() => void load()} className={secondaryButtonClass}>
          <Icon name="auto_awesome" />
          {loading ? "AI đang giải thích..." : error ? "Thử lại" : "Giải thích bằng AI"}
        </button>
        {error && <p role="alert" className="mt-2 text-body-subtle text-error">{error}</p>}
      </div>
    );
  }

  return (
    <section aria-label="Giải thích bằng AI" className="mt-2 rounded-lg bg-primary-fixed/50 p-3">
      <h3 className="mb-2 flex items-center gap-2 font-semibold text-primary">
        <Icon name="auto_awesome" /> Giải thích bằng AI
      </h3>
      <dl className="flex flex-col gap-2 text-body-subtle">
        {SECTIONS.map(([key, label]) => (
          <div key={key}>
            <dt className="font-semibold">{label}</dt>
            <dd>{explanation.content[key]}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-label-sm text-on-surface-variant">Nội dung do AI tạo, có thể chưa chính xác.</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-body-subtle">Lời giải thích này có hữu ích không?</span>
        {([[true, "thumb_up", "Hữu ích"], [false, "thumb_down", "Chưa hữu ích"]] as const).map(([value, icon, label]) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            aria-pressed={explanation.helpful === value}
            onClick={() => void vote(value)}
            className={`rounded-lg p-1.5 ${explanation.helpful === value ? "bg-primary text-on-primary" : "bg-surface-container text-primary"}`}
          >
            <Icon name={icon} />
          </button>
        ))}
      </div>
      {error && <p role="alert" className="mt-2 text-body-subtle text-error">{error}</p>}
    </section>
  );
}
