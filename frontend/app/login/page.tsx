"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthForm } from "@/components/auth-form";
import { homePathFor, useAuth } from "@/components/auth-provider";
import { Icon } from "@/components/icon";

const FEATURES = [
  {
    icon: "verified",
    title: "Giải thích từng câu sau khi nộp bài",
    text: "Xem đáp án đúng và lời giải để hiểu rõ vì sao mình sai.",
  },
  {
    icon: "timer",
    title: "Bấm giờ như phòng thi",
    text: "Đồng hồ đếm ngược do máy chủ quản lý, bài làm tự động lưu.",
  },
  {
    icon: "insights",
    title: "Thống kê điểm yếu theo chủ đề",
    text: "Biết chủ đề nào cần ưu tiên và nhận bộ câu ôn tập phù hợp.",
  },
];

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace(homePathFor(user.role));
  }, [loading, user, router]);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-center gap-8 bg-primary p-12 text-on-primary lg:flex">
        <div className="flex items-center gap-3">
          <Icon name="menu_book" className="text-[32px]!" />
          <span className="text-headline-md font-bold">
            LuyenThi<span className="text-secondary-container">TOEIC</span>
          </span>
        </div>
        <div>
          <h1 className="text-headline-xl font-bold">Luyện TOEIC Reading, hiểu rõ lỗi sai</h1>
          <p className="mt-3 max-w-lg text-white/80">
            Luyện đề trong điều kiện bấm giờ và theo dõi điểm yếu của bạn qua từng lần làm bài.
          </p>
        </div>
        <ul className="flex flex-col gap-5">
          {FEATURES.map((feature) => (
            <li key={feature.icon} className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <Icon name={feature.icon} />
              </span>
              <div>
                <h2 className="font-semibold">{feature.title}</h2>
                <p className="text-body-subtle text-white/75">{feature.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="flex items-center justify-center p-6">
        <AuthForm />
      </section>
    </div>
  );
}
