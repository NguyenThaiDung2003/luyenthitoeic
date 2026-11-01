"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { OPTION_KEYS, type OptionKey, PART_LABELS, type Part } from "@/lib/types";
import { Icon } from "./icon";
import { ErrorBanner, primaryButtonClass, secondaryButtonClass } from "./ui";

export const AUTOSAVE_INTERVAL_MS = 5000;
export const SESSION_REFRESH_INTERVAL_MS = 15 * 60 * 1000;

export interface PaperQuestion {
  id: string;
  position: number;
  part: Part;
  content: string;
  options: string[];
  passage: { id: string; title: string; content: string } | null;
  selectedOption: OptionKey | null;
  isFlagged: boolean;
}

export interface Paper {
  id: string;
  status: "IN_PROGRESS" | "SUBMITTED";
  examTitle: string;
  remainingSeconds: number;
  questions: PaperQuestion[];
}

type AnswerState = Record<string, { selectedOption: OptionKey | null; isFlagged: boolean }>;
type SaveState = "saved" | "saving" | "error";

export function formatTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

export function ExamRoom({ paper }: { paper: Paper }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<AnswerState>(() =>
    Object.fromEntries(
      paper.questions.map((question) => [
        question.id,
        { selectedOption: question.selectedOption, isFlagged: question.isFlagged },
      ]),
    ),
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remaining, setRemaining] = useState(paper.remainingSeconds);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mốc kết thúc theo đồng hồ đơn điệu, nên chỉnh giờ máy không làm sai số giây hiển thị
  const deadlineRef = useRef(0);
  const remainingRef = useRef(paper.remainingSeconds);
  const answersRef = useRef(answers);
  const dirtyRef = useRef(new Set<string>());
  const savingRef = useRef<Promise<void> | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    deadlineRef.current = performance.now() + paper.remainingSeconds * 1000;
  }, [paper.remainingSeconds]);

  const goToResult = useCallback(() => {
    router.replace(`/attempts/${paper.id}/result`);
  }, [router, paper.id]);

  const flush = useCallback(async () => {
    if (savingRef.current) await savingRef.current;
    const ids = [...dirtyRef.current];
    if (ids.length === 0) return;
    dirtyRef.current.clear();
    setSaveState("saving");

    const task = (async () => {
      try {
        const saved = await api<{ remainingSeconds: number }>(`/attempts/${paper.id}/answers`, {
          method: "PUT",
          body: { answers: ids.map((questionId) => ({ questionId, ...answersRef.current[questionId] })) },
        });
        deadlineRef.current = performance.now() + saved.remainingSeconds * 1000;
        setSaveState(dirtyRef.current.size > 0 ? "saving" : "saved");
      } catch (caught) {
        // Giữ lại các câu chưa lưu để lần sau gửi lại
        for (const id of ids) dirtyRef.current.add(id);
        setSaveState("error");
        throw caught;
      }
    })();
    savingRef.current = task.catch(() => undefined).finally(() => {
      savingRef.current = null;
    });
    await task;
  }, [paper.id]);

  const submit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setConfirming(false);
    try {
      // Hết giờ thì máy chủ từ chối lưu, bài được chấm theo các câu đã lưu trước đó
      await flush().catch((caught: unknown) => {
        if (remainingRef.current > 0 && !(caught instanceof ApiError && caught.status === 409)) {
          throw caught;
        }
      });
      await api(`/attempts/${paper.id}/submit`, { method: "POST" });
      goToResult();
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409) {
        goToResult();
        return;
      }
      submittedRef.current = false;
      setSubmitting(false);
      setError("Chưa nộp được bài. Bài làm vẫn được giữ, vui lòng thử nộp lại.");
    }
  }, [flush, goToResult, paper.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = Math.max(0, Math.ceil((deadlineRef.current - performance.now()) / 1000));
      remainingRef.current = next;
      setRemaining(next);
      if (next === 0) void submit();
    }, 1000);
    return () => clearInterval(timer);
  }, [submit]);

  useEffect(() => {
    const timer = setInterval(() => {
      flush().catch((caught: unknown) => {
        if (caught instanceof ApiError && caught.status === 409) void submit();
      });
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [flush, submit]);

  // Gia hạn phiên trong lúc làm bài, nếu không đề dài hơn thời hạn token sẽ không lưu được
  useEffect(() => {
    const timer = setInterval(() => {
      api("/auth/refresh", { method: "POST" }).catch((caught: unknown) => {
        if (caught instanceof ApiError && caught.status === 401) {
          setError("Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại ở tab khác rồi quay lại để lưu bài.");
        }
      });
    }, SESSION_REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  // Lưu ngay khi học viên chuyển tab, giảm rủi ro mất bài khi đóng trình duyệt
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") flush().catch(() => undefined);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [flush]);

  const update = (questionId: string, change: Partial<AnswerState[string]>) => {
    const next = { ...answersRef.current, [questionId]: { ...answersRef.current[questionId], ...change } };
    answersRef.current = next;
    dirtyRef.current.add(questionId);
    setAnswers(next);
    setSaveState("saving");
  };

  const question = paper.questions[currentIndex];
  const answer = answers[question.id];
  const answeredCount = Object.values(answers).filter((item) => item.selectedOption).length;
  const flaggedCount = Object.values(answers).filter((item) => item.isFlagged).length;
  const unanswered = paper.questions.length - answeredCount;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 bg-surface-container-lowest px-4 py-3 shadow-sm lg:px-8">
        <div className="min-w-0">
          <p className="truncate font-semibold text-primary">{paper.examTitle}</p>
          <p role="status" className="flex items-center gap-1 text-body-subtle text-on-surface-variant">
            <Icon name={saveState === "error" ? "cloud_off" : "cloud_done"} />
            {saveState === "saved" && "Đã lưu"}
            {saveState === "saving" && "Đang lưu..."}
            {saveState === "error" && "Mất kết nối, sẽ thử lưu lại"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            role="timer"
            aria-label="Thời gian còn lại"
            className={`flex items-center gap-1 rounded-xl px-3 py-2 font-label text-headline-sm font-semibold tabular-nums ${
              remaining <= 300 ? "bg-error-container text-on-error-container" : "bg-secondary-fixed text-secondary"
            }`}
          >
            <Icon name="timer" />
            {formatTime(remaining)}
          </div>
          <button type="button" disabled={submitting} onClick={() => setConfirming(true)} className={primaryButtonClass}>
            <Icon name="assignment_turned_in" /> {submitting ? "Đang nộp..." : "Nộp bài"}
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1400px] gap-4 p-4 lg:grid-cols-[1fr_380px] lg:p-8">
        <div className="min-w-0">
          {error && <ErrorBanner message={error} />}
          <div className={question.passage ? "grid gap-4 xl:grid-cols-2" : ""}>
            {question.passage && (
              <section className="rounded-xl bg-surface-container-lowest p-5 shadow-sm xl:max-h-[calc(100vh-140px)] xl:overflow-y-auto">
                <h2 className="mb-3 flex items-center gap-2 font-semibold text-primary">
                  <Icon name="menu_book" /> {question.passage.title}
                </h2>
                <p className="whitespace-pre-line text-body-reading">{question.passage.content}</p>
              </section>
            )}

            <section className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-2">
                <span className="rounded-full bg-primary px-3 py-1 font-label text-label font-semibold text-on-primary">
                  Câu {question.position} / {paper.questions.length} · {PART_LABELS[question.part]}
                </span>
                <button
                  type="button"
                  aria-pressed={answer.isFlagged}
                  onClick={() => update(question.id, { isFlagged: !answer.isFlagged })}
                  className={`flex items-center gap-1 rounded-lg px-3 py-1 font-label text-label ${
                    answer.isFlagged ? "bg-secondary-fixed text-secondary" : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  <Icon name="flag" /> {answer.isFlagged ? "Đang gắn cờ" : "Gắn cờ"}
                </button>
              </div>

              <p className="mb-4 text-headline-sm font-semibold">{question.content}</p>

              <div role="radiogroup" aria-label={`Lựa chọn câu ${question.position}`} className="flex flex-col gap-2">
                {question.options.map((option, index) => {
                  const key = OPTION_KEYS[index];
                  const selected = answer.selectedOption === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => update(question.id, { selectedOption: selected ? null : key })}
                      className={`flex items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                        selected ? "bg-surface-container-high font-semibold text-primary ring-2 ring-primary" : "bg-surface-container-low hover:bg-surface-container"
                      }`}
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold ${selected ? "bg-primary text-on-primary" : "bg-surface-container-high"}`}>
                        {key}
                      </span>
                      {option}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex justify-between">
                <button type="button" disabled={currentIndex === 0} onClick={() => setCurrentIndex(currentIndex - 1)} className={secondaryButtonClass}>
                  <Icon name="arrow_back" /> Câu trước
                </button>
                <button type="button" disabled={currentIndex === paper.questions.length - 1} onClick={() => setCurrentIndex(currentIndex + 1)} className={primaryButtonClass}>
                  Câu sau <Icon name="arrow_forward" />
                </button>
              </div>
            </section>
          </div>
        </div>

        <aside className="self-start rounded-xl bg-surface-container-lowest p-5 shadow-sm lg:sticky lg:top-24">
          <h2 className="mb-2 font-semibold">Bảng câu hỏi</h2>
          <p className="mb-3 text-body-subtle text-on-surface-variant">
            Đã làm {answeredCount} · Gắn cờ {flaggedCount} · Chưa làm {unanswered}
          </p>
          <div className="grid grid-cols-7 gap-1.5">
            {paper.questions.map((item, index) => {
              const state = answers[item.id];
              const colors = state.isFlagged
                ? "bg-secondary-container text-on-secondary-container"
                : state.selectedOption
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant";
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Tới câu ${item.position}${state.selectedOption ? ", đã làm" : ""}${state.isFlagged ? ", gắn cờ" : ""}`}
                  aria-current={index === currentIndex ? "true" : undefined}
                  onClick={() => setCurrentIndex(index)}
                  className={`rounded-lg py-2 font-label text-label font-semibold ${colors} ${index === currentIndex ? "ring-2 ring-primary ring-offset-1" : ""}`}
                >
                  {item.position}
                </button>
              );
            })}
          </div>
        </aside>
      </main>

      {confirming && (
        <div role="dialog" aria-modal="true" aria-label="Xác nhận nộp bài" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-surface-container-lowest p-6">
            <h2 className="text-headline-md font-semibold text-primary">Nộp bài?</h2>
            <p className="mt-2 text-on-surface-variant">
              {unanswered > 0 ? `Bạn còn ${unanswered} câu chưa làm. ` : "Bạn đã làm tất cả các câu. "}
              Sau khi nộp sẽ không sửa được bài.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirming(false)} className={secondaryButtonClass}>Làm tiếp</button>
              <button type="button" onClick={() => void submit()} className={primaryButtonClass}>Nộp bài</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
