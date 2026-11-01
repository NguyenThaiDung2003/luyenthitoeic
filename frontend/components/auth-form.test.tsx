import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthForm } from "./auth-form";
import { AuthProvider } from "./auth-provider";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

function mockFetch(handler: (url: string) => { status: number; body: unknown }) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const { status, body } = handler(url);
      return new Response(JSON.stringify(body), { status });
    }),
  );
}

async function fillAndSubmit() {
  render(
    <AuthProvider>
      <AuthForm />
    </AuthProvider>,
  );
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Địa chỉ email"), "a@example.com");
  await user.type(screen.getByLabelText("Mật khẩu"), "mat-khau-123");
  await user.click(screen.getByRole("button", { name: /Đăng nhập ngay/ }));
}

describe("AuthForm", () => {
  beforeEach(() => replace.mockClear());
  afterEach(() => vi.unstubAllGlobals());

  it("hiện lỗi từ máy chủ khi đăng nhập sai", async () => {
    mockFetch((url) =>
      url.endsWith("/auth/login")
        ? { status: 401, body: { message: "Email hoặc mật khẩu không đúng" } }
        : { status: 401, body: {} },
    );

    await fillAndSubmit();

    expect((await screen.findByRole("alert")).textContent).toContain("Email hoặc mật khẩu không đúng");
    expect(replace).not.toHaveBeenCalled();
  });

  it("chuyển giáo viên tới cổng giáo viên", async () => {
    mockFetch((url) =>
      url.endsWith("/auth/login")
        ? { status: 200, body: { user: { id: "1", email: "a", fullName: "A", role: "TEACHER" } } }
        : { status: 401, body: {} },
    );

    await fillAndSubmit();

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/teacher/questions"));
  });
});
