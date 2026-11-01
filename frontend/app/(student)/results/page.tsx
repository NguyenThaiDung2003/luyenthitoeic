"use client";

import { useEffect, useState } from "react";
import { AttemptList } from "@/components/attempt-list";
import { Card, ErrorBanner, PageHeader } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import type { AttemptListItem } from "@/lib/types";

export default function ResultsPage() {
  const [attempts, setAttempts] = useState<AttemptListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<AttemptListItem[]>("/attempts")
      .then(setAttempts)
      .catch((caught: unknown) =>
        setError(caught instanceof ApiError ? caught.message : "Không tải được lịch sử."),
      );
  }, []);

  return (
    <>
      <PageHeader title="Kết quả" description="Lịch sử làm bài của bạn." />
      {error && <ErrorBanner message={error} />}
      <Card>{attempts ? <AttemptList attempts={attempts} /> : <p className="text-on-surface-variant">Đang tải...</p>}</Card>
    </>
  );
}
