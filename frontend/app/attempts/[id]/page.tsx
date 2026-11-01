"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { ExamRoom, type Paper } from "@/components/exam-room";
import { ErrorBanner } from "@/components/ui";
import { api, ApiError } from "@/lib/api";

export default function AttemptPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    api<Paper>(`/attempts/${id}`)
      .then((data) => {
        if (data.status === "SUBMITTED") router.replace(`/attempts/${id}/result`);
        else setPaper(data);
      })
      .catch((caught: unknown) =>
        setError(caught instanceof ApiError ? caught.message : "Không tải được đề thi."),
      );
  }, [id, loading, user, router]);

  if (error) {
    return (
      <div className="p-8">
        <ErrorBanner message={error} />
      </div>
    );
  }
  if (!paper) return <p className="p-8 text-on-surface-variant">Đang tải đề thi...</p>;
  return <ExamRoom paper={paper} />;
}
