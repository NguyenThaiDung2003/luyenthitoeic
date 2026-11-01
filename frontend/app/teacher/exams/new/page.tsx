"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { Card, ErrorBanner, fieldClass, PageHeader, primaryButtonClass, secondaryButtonClass } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { DIFFICULTY_LABELS, type Page, PART_LABELS, type Question, type Topic } from "@/lib/types";

interface Criterion {
  part: string;
  topicId: string;
  difficulty: string;
  count: number;
}

const EMPTY_CRITERION: Criterion = { part: "", topicId: "", difficulty: "", count: 5 };

export default function NewExamPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [mode, setMode] = useState<"random" | "manual">("random");
  const [criteria, setCriteria] = useState<Criterion[]>([EMPTY_CRITERION]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api<Page<Question>>("/questions?pageSize=100"), api<Topic[]>("/topics")])
      .then(([page, topicList]) => {
        setQuestions(page.items);
        setTopics(topicList);
      })
      .catch((caught: unknown) =>
        setError(caught instanceof ApiError ? caught.message : "Không tải được dữ liệu."),
      );
  }, []);

  const setCriterion = (index: number, change: Partial<Criterion>) =>
    setCriteria(criteria.map((item, i) => (i === index ? { ...item, ...change } : item)));

  const toggleQuestion = (id: string) =>
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    const info = { title, description: description || undefined, durationMinutes };
    try {
      const created = await api<{ id: string }>(mode === "random" ? "/exams/random" : "/exams", {
        method: "POST",
        body:
          mode === "random"
            ? {
                ...info,
                criteria: criteria.map((item) => ({
                  count: item.count,
                  part: item.part || undefined,
                  topicId: item.topicId || undefined,
                  difficulty: item.difficulty || undefined,
                })),
              }
            : { ...info, questionIds: selectedIds },
      });
      router.push(`/teacher/exams/${created.id}`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không tạo được đề.");
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Tạo đề thi mới" description="Đề được lưu dạng bản nháp, xem trước rồi mới xuất bản." />
      {error && <ErrorBanner message={error} />}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card className="flex flex-col gap-3">
          <h2 className="text-headline-sm font-semibold">1. Thông tin chung</h2>
          <label className="flex flex-col gap-1 font-label text-label">
            Tên đề thi
            <input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1 font-label text-label">
            Mô tả
            <textarea rows={2} maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1 font-label text-label sm:w-48">
            Thời gian (phút)
            <input required type="number" min={1} max={300} value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} className={fieldClass} />
          </label>
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="text-headline-sm font-semibold">2. Chọn câu hỏi</h2>
          <div role="tablist" className="inline-flex w-fit gap-1 rounded-xl bg-surface-container p-1">
            {(["random", "manual"] as const).map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={mode === item}
                onClick={() => setMode(item)}
                className={`rounded-lg px-4 py-2 font-label text-label font-semibold ${mode === item ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant"}`}
              >
                {item === "random" ? "Ngẫu nhiên" : "Chọn tay"}
              </button>
            ))}
          </div>

          {mode === "random" ? (
            <>
              {criteria.map((criterion, index) => (
                <div key={index} className="grid items-end gap-2 md:grid-cols-[1fr_1fr_1fr_100px_auto]">
                  <select aria-label="Part" value={criterion.part} onChange={(event) => setCriterion(index, { part: event.target.value })} className={fieldClass}>
                    <option value="">Mọi Part</option>
                    {Object.entries(PART_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <select aria-label="Chủ đề" value={criterion.topicId} onChange={(event) => setCriterion(index, { topicId: event.target.value })} className={fieldClass}>
                    <option value="">Mọi chủ đề</option>
                    {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
                  </select>
                  <select aria-label="Mức độ" value={criterion.difficulty} onChange={(event) => setCriterion(index, { difficulty: event.target.value })} className={fieldClass}>
                    <option value="">Mọi mức độ</option>
                    {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <input aria-label="Số câu" required type="number" min={1} max={200} value={criterion.count} onChange={(event) => setCriterion(index, { count: Number(event.target.value) })} className={fieldClass} />
                  <button type="button" aria-label="Xóa tiêu chí" disabled={criteria.length === 1} onClick={() => setCriteria(criteria.filter((_, i) => i !== index))} className="p-2 text-error disabled:opacity-30">
                    <Icon name="delete" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => setCriteria([...criteria, EMPTY_CRITERION])} className={`${secondaryButtonClass} w-fit`}>
                <Icon name="add" /> Thêm tiêu chí
              </button>
            </>
          ) : (
            <>
              <p className="text-body-subtle text-on-surface-variant">Đã chọn {selectedIds.length} câu</p>
              <ul className="flex max-h-96 flex-col gap-1 overflow-y-auto">
                {questions.map((question) => (
                  <li key={question.id}>
                    <label className="flex cursor-pointer items-start gap-2 rounded-lg p-2 hover:bg-surface-container-low">
                      <input type="checkbox" className="mt-1" checked={selectedIds.includes(question.id)} onChange={() => toggleQuestion(question.id)} />
                      <span>
                        <span className="line-clamp-1">{question.content}</span>
                        <span className="text-body-subtle text-on-surface-variant">
                          {PART_LABELS[question.part]} · {question.topic.name} · {DIFFICULTY_LABELS[question.difficulty]}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <button type="submit" disabled={saving || (mode === "manual" && selectedIds.length === 0)} className={`${primaryButtonClass} w-fit`}>
          {saving ? "Đang tạo..." : "Tạo bản nháp"}
        </button>
      </form>
    </>
  );
}
