"use client";

import { type FormEvent, useState } from "react";
import { api, ApiError } from "@/lib/api";
import {
  DIFFICULTY_LABELS,
  type Difficulty,
  OPTION_KEYS,
  type OptionKey,
  type Part,
  PART_LABELS,
  type Passage,
  type Question,
  type Topic,
} from "@/lib/types";
import { ErrorBanner, fieldClass, primaryButtonClass, secondaryButtonClass } from "./ui";

interface Props {
  question: Question | null;
  topics: Topic[];
  passages: Passage[];
  onClose: () => void;
  onSaved: () => void;
}

export function QuestionForm({ question, topics, passages, onClose, onSaved }: Props) {
  const [part, setPart] = useState<Part>(question?.part ?? "PART_5");
  const [content, setContent] = useState(question?.content ?? "");
  const [options, setOptions] = useState(question?.options ?? ["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState<OptionKey>(question?.correctOption ?? "A");
  const [difficulty, setDifficulty] = useState<Difficulty>(question?.difficulty ?? "MEDIUM");
  const [topicId, setTopicId] = useState(question?.topicId ?? topics[0]?.id ?? "");
  const [passageId, setPassageId] = useState(question?.passageId ?? "");
  const [explanation, setExplanation] = useState(question?.explanation ?? "");
  const [source, setSource] = useState(question?.source ?? "Tự biên soạn");
  const [license, setLicense] = useState(question?.license ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    const body = {
      part,
      content,
      options,
      correctOption,
      difficulty,
      topicId,
      passageId: part === "PART_5" ? null : passageId || null,
      explanation: explanation || null,
      source,
      license,
    };
    try {
      await api(question ? `/questions/${question.id}` : "/questions", {
        method: question ? "PATCH" : "POST",
        body,
      });
      onSaved();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Không lưu được câu hỏi.");
      setSaving(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Biên soạn câu hỏi" className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="my-4 flex w-full max-w-2xl flex-col gap-3 rounded-xl bg-surface-container-lowest p-6">
        <h2 className="text-headline-md font-semibold text-primary">
          {question ? "Sửa câu hỏi" : "Thêm câu hỏi"}
        </h2>
        {error && <ErrorBanner message={error} />}

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 font-label text-label">
            Part
            <select value={part} onChange={(event) => setPart(event.target.value as Part)} className={fieldClass}>
              {Object.entries(PART_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 font-label text-label">
            Chủ đề
            <select required value={topicId} onChange={(event) => setTopicId(event.target.value)} className={fieldClass}>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>{topic.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 font-label text-label">
            Mức độ
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)} className={fieldClass}>
              {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>

        {part !== "PART_5" && (
          <label className="flex flex-col gap-1 font-label text-label">
            Đoạn văn
            <select required value={passageId} onChange={(event) => setPassageId(event.target.value)} className={fieldClass}>
              <option value="">Chọn đoạn văn</option>
              {passages.map((passage) => (
                <option key={passage.id} value={passage.id}>{passage.title}</option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1 font-label text-label">
          Nội dung câu hỏi
          <textarea required rows={3} maxLength={2000} value={content} onChange={(event) => setContent(event.target.value)} className={fieldClass} />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="font-label text-label">Các lựa chọn, đánh dấu đáp án đúng</legend>
          {OPTION_KEYS.map((key, index) => (
            <div key={key} className="flex items-center gap-2">
              <input
                type="radio"
                name="correctOption"
                aria-label={`Đáp án đúng là ${key}`}
                checked={correctOption === key}
                onChange={() => setCorrectOption(key)}
              />
              <span className="w-5 font-semibold">{key}</span>
              <input
                required
                aria-label={`Lựa chọn ${key}`}
                maxLength={500}
                value={options[index]}
                onChange={(event) =>
                  setOptions(options.map((option, i) => (i === index ? event.target.value : option)))
                }
                className={fieldClass}
              />
            </div>
          ))}
        </fieldset>

        <label className="flex flex-col gap-1 font-label text-label">
          Giải thích
          <textarea rows={3} maxLength={5000} value={explanation} onChange={(event) => setExplanation(event.target.value)} className={fieldClass} />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 font-label text-label">
            Nguồn
            <input required maxLength={200} value={source} onChange={(event) => setSource(event.target.value)} className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1 font-label text-label">
            Giấy phép
            <input required maxLength={200} value={license} onChange={(event) => setLicense(event.target.value)} className={fieldClass} />
          </label>
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={secondaryButtonClass}>Hủy</button>
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving ? "Đang lưu..." : "Lưu câu hỏi"}
          </button>
        </div>
      </form>
    </div>
  );
}
