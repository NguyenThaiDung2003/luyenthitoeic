import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, LoadingMessage, useAuth } from "./auth-provider";

function Probe() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingMessage />;
  return <p>{user ? user.fullName : "Chưa đăng nhập"}</p>;
}

function mockReplies(...replies: (number | "network")[]) {
  const fetchMock = vi.fn(async () => {
    const reply = replies.length > 1 ? replies.shift() : replies[0];
    if (reply === "network") throw new TypeError("mất mạng");
    const body = reply === 200 ? { user: { id: "1", fullName: "Lan", email: "a", role: "STUDENT" } } : {};
    return new Response(JSON.stringify(body), { status: reply });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

describe("AuthProvider khi backend đang thức dậy", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("401 là chưa đăng nhập, không thử lại", async () => {
    const fetchMock = mockReplies(401);
    render(<AuthProvider><Probe /></AuthProvider>);

    await advance(0);

    expect(screen.getByText("Chưa đăng nhập")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("503 và lỗi mạng rồi phục hồi thì vẫn giữ phiên đăng nhập", async () => {
    const fetchMock = mockReplies(503, "network", 200);
    render(<AuthProvider><Probe /></AuthProvider>);

    await advance(0);
    expect(screen.getByRole("status").textContent).toBe("Đang tải...");
    await advance(7000);

    expect(screen.getByText("Lan")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("chờ quá lâu thì báo máy chủ đang khởi động", async () => {
    mockReplies(503);
    render(<AuthProvider><Probe /></AuthProvider>);

    await advance(3999);
    expect(screen.getByRole("status").textContent).toBe("Đang tải...");
    await advance(1);

    expect(screen.getByRole("status").textContent).toContain("đang khởi động");
  });

  it("hết lượt thử thì dừng tải", async () => {
    const fetchMock = mockReplies(503);
    render(<AuthProvider><Probe /></AuthProvider>);

    await advance(60000);

    expect(screen.getByText("Chưa đăng nhập")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });
});
