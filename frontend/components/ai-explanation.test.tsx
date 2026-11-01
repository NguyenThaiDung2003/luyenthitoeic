import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AiExplanation } from "./ai-explanation";

const explanation = {
  id: "e1",
  helpful: null,
  content: { whyCorrect: "Lý do đúng", whyWrong: "Lý do sai", keyPoint: "Ghi nhớ", similarExample: "Ví dụ" },
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe("AiExplanation", () => {
  afterEach(() => vi.unstubAllGlobals());

  const open = async () => {
    render(<AiExplanation attemptId="a1" questionId="q1" />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Giải thích bằng AI/ }));
    return user;
  };

  it("chỉ gọi API khi học viên bấm, rồi hiện đủ bốn phần", async () => {
    const fetchMock = vi.fn(async () => json(explanation));
    vi.stubGlobal("fetch", fetchMock);
    render(<AiExplanation attemptId="a1" questionId="q1" />);
    expect(fetchMock).not.toHaveBeenCalled();

    await userEvent.setup().click(screen.getByRole("button", { name: /Giải thích bằng AI/ }));

    for (const text of Object.values(explanation.content)) {
      expect(await screen.findByText(text)).toBeDefined();
    }
    expect(fetchMock.mock.calls[0]).toEqual(
      expect.arrayContaining(["/api/attempts/a1/questions/q1/explanation"]),
    );
  });

  it("báo lỗi và cho thử lại", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ message: "AI đang bận, vui lòng thử lại sau" }, 503))
      .mockResolvedValueOnce(json(explanation));
    vi.stubGlobal("fetch", fetchMock);

    const user = await open();

    expect((await screen.findByRole("alert")).textContent).toContain("AI đang bận");
    await user.click(screen.getByRole("button", { name: /Thử lại/ }));
    expect(await screen.findByText("Lý do đúng")).toBeDefined();
  });

  it("hiện thông báo hết lượt từ máy chủ", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ message: "Bạn đã dùng hết lượt" }, 429)));

    await open();

    expect((await screen.findByRole("alert")).textContent).toContain("hết lượt");
  });

  it("gửi phản hồi và đánh dấu lựa chọn", async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.endsWith("/feedback") ? json({ helpful: false }) : json(explanation),
    );
    vi.stubGlobal("fetch", fetchMock);

    const user = await open();
    const button = await screen.findByRole("button", { name: "Chưa hữu ích" });
    await user.click(button);

    await vi.waitFor(() => expect(button.getAttribute("aria-pressed")).toBe("true"));
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/ai-explanations/e1/feedback",
      expect.objectContaining({ body: JSON.stringify({ helpful: false }) }),
    );
  });
});
