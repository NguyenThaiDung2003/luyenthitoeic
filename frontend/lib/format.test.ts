import { describe, expect, it } from "vitest";
import { formatDuration, percent } from "./format";

describe("percent", () => {
  it("làm tròn một chữ số thập phân và xử lý tổng bằng 0", () => {
    expect(percent(1, 3)).toBe(33.3);
    expect(percent(4, 4)).toBe(100);
    expect(percent(0, 0)).toBe(0);
  });
});

describe("formatDuration", () => {
  it.each([
    [45, "45 giây"],
    [125, "2 phút 5 giây"],
    [3900, "1 giờ 5 phút"],
    [-3, "0 giây"],
  ])("%i giây là %s", (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});
