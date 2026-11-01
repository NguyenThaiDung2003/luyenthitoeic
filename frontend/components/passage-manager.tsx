"use client";

import { type FormEvent, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Passage } from "@/lib/types";
import { Card, ErrorBanner, fieldClass, primaryButtonClass, secondaryButtonClass } from "./ui";

interface Props {
  passages: Passage[];
  onChanged: () => void;
}

const EMPTY = { title: "", content: "", source: "Tự biên soạn", license: "" };

export function PassageManager({ passages, onChanged }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setEditingId(null);
    setDraft(EMPTY);
  };

  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
      reset();
      onChanged();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không thực hiện được thao tác.");
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void run(() =>
      api(editingId ? `/passages/${editingId}` : "/passages", {
        method: editingId ? "PATCH" : "POST",
        body: draft,
      }),
    );
  };

  const setField = (field: keyof typeof EMPTY, value: string) =>
    setDraft((current) => ({ ...current, [field]: value }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h2 className="mb-3 text-headline-sm font-semibold">
          {editingId ? "Sửa đoạn văn" : "Thêm đoạn văn"}
        </h2>
        {error && <ErrorBanner message={error} />}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 font-label text-label">
            Tiêu đề
            <input required maxLength={200} value={draft.title} onChange={(event) => setField("title", event.target.value)} className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1 font-label text-label">
            Nội dung
            <textarea required rows={8} maxLength={20000} value={draft.content} onChange={(event) => setField("content", event.target.value)} className={fieldClass} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 font-label text-label">
              Nguồn
              <input required maxLength={200} value={draft.source} onChange={(event) => setField("source", event.target.value)} className={fieldClass} />
            </label>
            <label className="flex flex-col gap-1 font-label text-label">
              Giấy phép
              <input required maxLength={200} value={draft.license} onChange={(event) => setField("license", event.target.value)} className={fieldClass} />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" className={primaryButtonClass}>Lưu đoạn văn</button>
            {editingId && (
              <button type="button" onClick={reset} className={secondaryButtonClass}>Hủy</button>
            )}
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 text-headline-sm font-semibold">Đoạn văn ({passages.length})</h2>
        <ul className="flex flex-col gap-2">
          {passages.map((passage) => (
            <li key={passage.id} className="flex items-center justify-between gap-2 rounded-xl bg-surface-container-low p-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{passage.title}</p>
                <p className="text-body-subtle text-on-surface-variant">{passage._count?.questions ?? 0} câu hỏi</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={() => {
                    setEditingId(passage.id);
                    setDraft({
                      title: passage.title,
                      content: passage.content,
                      source: passage.source,
                      license: passage.license,
                    });
                  }}
                >
                  Sửa
                </button>
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={() => void run(() => api(`/passages/${passage.id}`, { method: "DELETE" }))}
                >
                  Xóa
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
