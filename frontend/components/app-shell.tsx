"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { homePathFor, LoadingMessage, type Role, useAuth } from "./auth-provider";
import { Icon } from "./icon";

const NAV: Record<Role, { href: string; label: string; icon: string }[]> = {
  STUDENT: [
    { href: "/dashboard", label: "Trang chủ", icon: "home" },
    { href: "/exams", label: "Đề luyện tập", icon: "assignment" },
    { href: "/results", label: "Kết quả", icon: "bar_chart" },
    { href: "/review", label: "Ôn tập gợi ý", icon: "auto_awesome" },
  ],
  TEACHER: [
    { href: "/teacher/questions", label: "Ngân hàng câu hỏi", icon: "quiz" },
    { href: "/teacher/exams", label: "Tạo đề & Đề thi", icon: "assignment_add" },
    { href: "/teacher/stats", label: "Thống kê kết quả", icon: "monitoring" },
  ],
};

export function AppShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  // Kiểm tra ở đây chỉ để điều hướng; quyền thật được backend kiểm tra ở từng API
  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (user.role !== role) router.replace(homePathFor(user.role));
  }, [loading, user, role, router]);

  if (loading || !user || user.role !== role) {
    return <LoadingMessage />;
  }

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen lg:pl-72">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 flex-col justify-between bg-surface-container-lowest px-4 py-6 shadow-sm lg:flex ${
          menuOpen ? "flex" : "hidden"
        }`}
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary">
              <Icon name={role === "TEACHER" ? "school" : "menu_book"} />
            </div>
            <div className="flex flex-col">
              <span className="text-headline-sm font-bold text-primary">LuyenThiTOEIC</span>
              <span className="font-label text-label-sm font-semibold uppercase tracking-wider text-secondary">
                {role === "TEACHER" ? "Cổng giáo viên" : "Cổng luyện thi"}
              </span>
            </div>
          </div>
          <nav aria-label="Điều hướng chính" className="flex flex-col gap-1.5">
            {NAV[role].map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 font-label text-label transition-colors ${
                    active
                      ? "bg-primary-container font-semibold text-white"
                      : "text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  <Icon name={item.icon} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
              <Icon name="person" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-label text-label font-semibold">{user.fullName}</p>
              <p className="font-label text-label-sm text-on-surface-variant">
                {role === "TEACHER" ? "Giáo viên" : "Học viên"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Đăng xuất"
            className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-highest"
          >
            <Icon name="logout" />
          </button>
        </div>
      </aside>

      {menuOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        />
      )}

      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 bg-surface/90 px-4 shadow-sm backdrop-blur lg:hidden">
        <button type="button" aria-label="Mở menu" onClick={() => setMenuOpen(true)} className="p-1">
          <Icon name="menu" />
        </button>
        <span className="font-bold text-primary">LuyenThiTOEIC</span>
      </header>

      <main className="mx-auto w-full max-w-[1400px] p-4 pb-12 lg:p-8">{children}</main>
    </div>
  );
}
