"use client";

import { useState } from "react";
import { OPTION_KEYS, PART_LABELS, type ResultQuestion } from "@/lib/types";
import { AiExplanation } from "./ai-explanation";
import { Icon } from "./icon";
import { Card } from "./ui";

type Filter = "all" | "wrong";

export function ResultQuestions({ attemptId, questions }: { attemptId: string; questions: ResultQuestion[] }) {
  const [filter, setFilter] = useState<Filter>("wrong");
  const wrongCount = questions.filter((question) => !question.isCorrect).length;
  const visible = filter === "wrong" ? questions.filter((question) => !question.isCorrect) : questions;

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-headline-sm font-semibold">Xem lại từng câu</h2>
        <div role="tablist" className="inline-flex gap-1 rounded-xl bg-surface-container p-1">
          {(["wrong", "all"] as const).map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={filter === item}
              onClick={() => setFilter(item)}
              className={`rounded-lg px-3 py-1.5 font-label text-label font-semibold ${
                filter === item ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant"
              }`}
            >
              {item === "wrong" ? `Câu sai (${wrongCount})` : `Tất cả (${questions.length})`}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 && <p className="py-6 text-center text-on-surface-variant">Bạn không sai câu nào.</p>}

      <ul className="flex flex-col gap-3">
        {visible.map((question) => (
          <li key={question.id} className="rounded-xl bg-surface-container-low p-4">
            <p className="mb-1 text-body-subtle text-on-surface-variant">
              Câu {question.position} · {PART_LABELS[question.part]} · {question.topic.name}
            </p>
            {question.passage && (
              <details className="mb-2">
                <summary className="cursor-pointer text-body-subtle font-semibold text-primary">
                  Đoạn văn: {question.passage.title}
                </summary>
                <p className="mt-1 whitespace-pre-line text-body-subtle">{question.passage.content}</p>
              </details>
            )}
            <p className="font-semibold">{question.content}</p>
            <ul className="mt-2 flex flex-col gap-1">
              {question.options.map((option, index) => {
                const key = OPTION_KEYS[index];
                const isAnswer = key === question.correctOption;
                const isWrongChoice = key === question.selectedOption && !isAnswer;
                return (
                  <li
                    key={key}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1 ${
                      isAnswer ? "bg-tertiary-fixed/50 font-semibold" : isWrongChoice ? "bg-error-container" : ""
                    }`}
                  >
                    {key}. {option}
                    {isAnswer && <span className="text-label-sm font-semibold">(đáp án đúng)</span>}
                    {isWrongChoice && <span className="text-label-sm font-semibold">(bạn chọn)</span>}
                  </li>
                );
              })}
            </ul>
            {question.selectedOption === null && (
              <p className="mt-2 text-body-subtle text-error">Bạn đã bỏ qua câu này.</p>
            )}
            {question.explanation && (
              <p className="mt-2 flex gap-2 rounded-lg bg-surface-container p-2 text-body-subtle">
                <Icon name="lightbulb" className="text-secondary" />
                <span>{question.explanation}</span>
              </p>
            )}
            {!question.isCorrect && question.selectedOption !== null && (
              <AiExplanation attemptId={attemptId} questionId={question.id} />
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
