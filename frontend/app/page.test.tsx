import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Trang chủ", () => {
  it("hiển thị tên hệ thống", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: "LuyenThiTOEIC" })).toBeDefined();
  });
});
