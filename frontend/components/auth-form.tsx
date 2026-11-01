"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { homePathFor, type User, useAuth } from "./auth-provider";
import { Icon } from "./icon";

type Mode = "login" | "register";

const inputClass =
  "w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

export function AuthForm() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const body = mode === "login" ? { email, password } : { email, password, fullName };
      const { user } = await api<{ user: User }>(`/auth/${mode}`, { method: "POST", body });
      setUser(user);
      router.replace(homePathFor(user.role));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Đã có lỗi xảy ra.");
      setSubmitting(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  return (
    <div className="w-full max-w-md">
      <h2 className="text-headline-lg font-semibold text-primary">
        {mode === "login" ? "Chào mừng trở lại" : "Tạo tài khoản học viên"}
      </h2>
      <p className="mt-1 text-body-subtle text-on-surface-variant">
        {mode === "login"
          ? "Đăng nhập để tiếp tục luyện TOEIC Reading"
          : "Bắt đầu luyện đề và theo dõi điểm yếu của bạn"}
      </p>

      <div role="tablist" className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-surface-container p-1">
        {(["login", "register"] as const).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={mode === item}
            onClick={() => switchMode(item)}
            className={`rounded-lg py-2 font-label text-label font-semibold ${
              mode === item ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant"
            }`}
          >
            {item === "login" ? "Đăng nhập" : "Đăng ký"}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="mt-4 flex gap-2 rounded-xl bg-error-container p-3 text-on-error-container">
          <Icon name="error" />
          <span className="text-body-subtle">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        {mode === "register" && (
          <label className="flex flex-col gap-1 font-label text-label font-medium">
            Họ và tên
            <input
              required
              maxLength={100}
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className={inputClass}
            />
          </label>
        )}
        <label className="flex flex-col gap-1 font-label text-label font-medium">
          Địa chỉ email
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 font-label text-label font-medium">
          Mật khẩu
          <span className="relative">
            <input
              required
              type={showPassword ? "text" : "password"}
              minLength={mode === "register" ? 8 : undefined}
              maxLength={72}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            >
              <Icon name={showPassword ? "visibility_off" : "visibility"} />
            </button>
          </span>
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-label text-label font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "Đang xử lý..." : mode === "login" ? "Đăng nhập ngay" : "Tạo tài khoản"}
          <Icon name="arrow_forward" />
        </button>
      </form>
    </div>
  );
}
