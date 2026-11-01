"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { PassageManager } from "@/components/passage-manager";
import { QuestionForm } from "@/components/question-form";
import { Card, EmptyState, ErrorBanner, fieldClass, PageHeader, primaryButtonClass, secondaryButtonClass } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { DIFFICULTY_LABELS, type Page, PART_LABELS, type Passage, type Question, type Topic } from "@/lib/types";

const PAGE_SIZE = 20;

export default function QuestionsPage() {
  const [tab, setTab] = useState<"questions" | "passages">("questions");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [passages, setPassages] = useState<Passage[]>([]);
  const [result, setResult] = useState<Page<Question> | null>(null);
  const [filters, setFilters] = useState({ part: "", topicId: "", difficulty: "", q: "" });
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Question | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
    try {
      const [questionPage, topicList, passageList] = await Promise.all([
        api<Page<Question>>(`/questions?${params}`),
        api<Topic[]>("/topics"),
        api<Passage[]>("/passages"),
      ]);
      setResult(questionPage);
      setTopics(topicList);
      setPassages(passageList);
      setError(null);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không tải được dữ liệu.");
    }
  }, [filters, page]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 200);
    return () => clearTimeout(timer);
  }, [load]);

  const setFilter = (key: keyof typeof filters, value: string) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const archive = async (question: Question) => {
    if (!window.confirm("Lưu trữ câu hỏi này? Câu sẽ không còn xuất hiện trong ngân hàng.")) return;
    try {
      await api(`/questions/${question.id}`, { method: "DELETE" });
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không lưu trữ được câu hỏi.");
    }
  };

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;

  return (
    <>
      <PageHeader
        title="Ngân hàng câu hỏi"
        description={result ? `${result.total} câu hỏi` : undefined}
        action={
          tab === "questions" && (
            <button type="button" onClick={() => setEditing("new")} className={primaryButtonClass}>
              <Icon name="add_circle" /> Thêm câu hỏi
            </button>
          )
        }
      />

      <div role="tablist" className="mb-4 inline-flex gap-1 rounded-xl bg-surface-container p-1">
        {(["questions", "passages"] as const).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={tab === item}
            onClick={() => setTab(item)}
            className={`rounded-lg px-4 py-2 font-label text-label font-semibold ${
              tab === item ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant"
            }`}
          >
            {item === "questions" ? "Câu hỏi" : "Đoạn văn"}
          </button>
        ))}
      </div>

      {error && <ErrorBanner message={error} />}

      {tab === "passages" ? (
        <PassageManager passages={passages} onChanged={() => void load()} />
      ) : (
        <>
          <Card className="mb-4">
            <div className="grid gap-3 md:grid-cols-4">
              <input
                aria-label="Tìm trong nội dung câu hỏi"
                placeholder="Tìm trong nội dung..."
                value={filters.q}
                onChange={(event) => setFilter("q", event.target.value)}
                className={fieldClass}
              />
              <select aria-label="Lọc theo Part" value={filters.part} onChange={(event) => setFilter("part", event.target.value)} className={fieldClass}>
                <option value="">Tất cả Part</option>
                {Object.entries(PART_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <select aria-label="Lọc theo chủ đề" value={filters.topicId} onChange={(event) => setFilter("topicId", event.target.value)} className={fieldClass}>
                <option value="">Tất cả chủ đề</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>{topic.name}</option>
                ))}
              </select>
              <select aria-label="Lọc theo mức độ" value={filters.difficulty} onChange={(event) => setFilter("difficulty", event.target.value)} className={fieldClass}>
                <option value="">Mọi mức độ</option>
                {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </Card>

          <Card className="overflow-x-auto p-0!">
            {result?.items.length === 0 ? (
              <EmptyState icon="quiz" title="Không có câu hỏi phù hợp" />
            ) : (
              <table className="w-full min-w-[720px] text-left">
                <thead className="font-label text-label text-on-surface-variant">
                  <tr>
                    <th className="p-4 font-medium">Câu hỏi</th>
                    <th className="p-4 font-medium">Part</th>
                    <th className="p-4 font-medium">Chủ đề</th>
                    <th className="p-4 font-medium">Mức độ</th>
                    <th className="p-4 font-medium">Đáp án</th>
                    <th className="p-4 font-medium"><span className="sr-only">Thao tác</span></th>
                  </tr>
                </thead>
                <tbody>
                  {result?.items.map((question) => (
                    <tr key={question.id} className="border-t border-surface-container">
                      <td className="max-w-md p-4">
                        <p className="line-clamp-2">{question.content}</p>
                        {question.passage && (
                          <p className="text-body-subtle text-on-surface-variant">{question.passage.title}</p>
                        )}
                      </td>
                      <td className="whitespace-nowrap p-4">{PART_LABELS[question.part]}</td>
                      <td className="p-4">{question.topic.name}</td>
                      <td className="whitespace-nowrap p-4">{DIFFICULTY_LABELS[question.difficulty]}</td>
                      <td className="p-4 font-semibold">{question.correctOption}</td>
                      <td className="whitespace-nowrap p-4 text-right">
                        <button type="button" aria-label="Sửa câu hỏi" onClick={() => setEditing(question)} className="p-2 text-primary">
                          <Icon name="edit" />
                        </button>
                        <button type="button" aria-label="Lưu trữ câu hỏi" onClick={() => void archive(question)} className="p-2 text-error">
                          <Icon name="delete" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} className={secondaryButtonClass}>Trước</button>
              <span>Trang {page} / {totalPages}</span>
              <button type="button" disabled={page === totalPages} onClick={() => setPage(page + 1)} className={secondaryButtonClass}>Sau</button>
            </div>
          )}
        </>
      )}

      {editing && (
        <QuestionForm
          question={editing === "new" ? null : editing}
          topics={topics}
          passages={passages}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void load();
          }}
        />
      )}
    </>
  );
}
