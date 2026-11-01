import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTOSAVE_INTERVAL_MS, ExamRoom, formatTime, type Paper } from "./exam-room";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const paper: Paper = {
  id: "attempt-1",
  status: "IN_PROGRESS",
  examTitle: "Đề thử",
  remainingSeconds: 600,
  questions: [1, 2].map((position) => ({
    id: `q${position}`,
    position,
    part: "PART_5",
    content: `Nội dung ${position}`,
    options: ["a", "b", "c", "d"],
    passage: null,
    selectedOption: null,
    isFlagged: false,
  })),
};

type Handler = (url: string, init: RequestInit) => Response;

function mockFetch(handler: Handler) {
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => handler(url, init));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const callsTo = (fetchMock: ReturnType<typeof mockFetch>, suffix: string) =>
  fetchMock.mock.calls.filter(([url]) => url.endsWith(suffix));

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe("formatTime", () => {
  it.each([
    [0, "00:00"],
    [65, "01:05"],
    [3725, "1:02:05"],
  ])("%i giây là %s", (seconds, expected) => {
    expect(formatTime(seconds)).toBe(expected);
  });
});

describe("ExamRoom", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    replace.mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("tự lưu sau chu kỳ và chỉ gửi câu đã thay đổi", async () => {
    const fetchMock = mockFetch(() => json({ remainingSeconds: 590 }));
    render(<ExamRoom paper={paper} />);

    fireEvent.click(screen.getByRole("radio", { name: /B\s*b/ }));
    await advance(AUTOSAVE_INTERVAL_MS);

    const saves = callsTo(fetchMock, "/answers");
    expect(saves).toHaveLength(1);
    expect(JSON.parse(saves[0][1].body as string)).toEqual({
      answers: [{ questionId: "q1", selectedOption: "B", isFlagged: false }],
    });

    await advance(AUTOSAVE_INTERVAL_MS);
    expect(callsTo(fetchMock, "/answers")).toHaveLength(1);
  });

  it("mất mạng thì báo lỗi và gửi lại ở chu kỳ sau", async () => {
    let online = false;
    const fetchMock = mockFetch(() => {
      if (!online) throw new TypeError("mất mạng");
      return json({ remainingSeconds: 590 });
    });
    render(<ExamRoom paper={paper} />);

    fireEvent.click(screen.getByRole("radio", { name: /A\s*a/ }));
    await advance(AUTOSAVE_INTERVAL_MS);
    expect(screen.getByRole("status").textContent).toContain("Mất kết nối");

    online = true;
    await advance(AUTOSAVE_INTERVAL_MS);

    expect(callsTo(fetchMock, "/answers")).toHaveLength(2);
    expect(screen.getByRole("status").textContent).toContain("Đã lưu");
  });

  it("đồng hồ đếm theo số giây máy chủ trả về", async () => {
    mockFetch(() => json({ remainingSeconds: 590 }));
    render(<ExamRoom paper={paper} />);

    expect(screen.getByRole("timer").textContent).toContain("10:00");
    await advance(3000);
    expect(screen.getByRole("timer").textContent).toContain("09:57");
  });

  it("nộp bài lưu câu còn lại trước rồi mới nộp", async () => {
    const order: string[] = [];
    mockFetch((url) => {
      order.push(url.endsWith("/submit") ? "submit" : "save");
      return json({ remainingSeconds: 590 });
    });
    render(<ExamRoom paper={paper} />);

    fireEvent.click(screen.getByRole("radio", { name: /A\s*a/ }));
    fireEvent.click(screen.getByRole("button", { name: /Nộp bài/ }));
    fireEvent.click(screen.getAllByRole("button", { name: "Nộp bài" }).at(-1)!);
    await advance(0);

    expect(order).toEqual(["save", "submit"]);
    expect(replace).toHaveBeenCalledWith("/attempts/attempt-1/result");
  });

  it("hết giờ thì tự nộp một lần", async () => {
    const fetchMock = mockFetch(() => json({ remainingSeconds: 0 }));
    render(<ExamRoom paper={{ ...paper, remainingSeconds: 2 }} />);

    await advance(4000);

    expect(callsTo(fetchMock, "/submit")).toHaveLength(1);
    expect(replace).toHaveBeenCalledWith("/attempts/attempt-1/result");
  });
});
