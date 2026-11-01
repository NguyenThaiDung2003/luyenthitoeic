# Nhật ký phát triển

## 2026-11-01: B1a, B1. PRD, kiến trúc và API

**Đã làm**
- Lưu bộ prompt đã điều chỉnh vào `docs/PROMPTS.md`.
- Viết `docs/PRD.md` suy ra từ 11 màn hình vì repo chưa có PRD.
- Viết `docs/ARCHITECTURE.md` (ERD 9 bảng, giải thích bảng và quan hệ, API theo màn hình) và `docs/openapi.yaml`.

**Quyết định**
- Nâng Node từ 20.20.2 lên 26.13.0 và npm lên 12 theo yêu cầu dùng bản mới nhất. Không dùng `v27.0.0-alpha`.
- Dùng Prisma 7.10.1 vì tag `latest` của gói `prisma` đang trỏ vào `8.0.0-rc.29`, chưa phải bản ổn định.
- Đăng ký công khai chỉ tạo học viên, tránh tự cấp quyền giáo viên.
- PostgreSQL trong Docker dùng cổng 5433 vì cổng 5432 đang có dịch vụ cục bộ.
- JWT đặt trong cookie `HttpOnly`, trình duyệt gọi API cùng nguồn qua rewrite của Next.js.
- Không có bảng lớp học vì danh sách bảng không có; thống kê giáo viên tính trên toàn bộ học viên.

**Kiểm tra**
- Bước này chỉ có tài liệu nên chưa có test.

## 2026-11-01: B0. Khởi tạo repo và CLAUDE.md

**Đã làm**
- Chạy `git init`, chưa commit.
- Tạo các thư mục `frontend`, `backend`, `design`, `docs`, `data`, `report`, mỗi thư mục có `.gitkeep`.
- Viết `CLAUDE.md`: mô tả dự án, stack, cấu trúc repo, quy tắc làm việc, quy ước đặt tên, cách chạy dự án.
- Tạo `.gitignore` và `DEVLOG.md`.

**Quyết định**
- Backend dùng cổng 3001 vì Next.js và NestJS đều mặc định cổng 3000.
- Mục "Cách chạy dự án" chỉ là dự kiến, cần cập nhật sau khi scaffold.
- Nhà cung cấp AI chưa chốt.

**Kiểm tra**
- Chưa có test vì chưa có code.
- Đã xác nhận bằng git rằng `.gitignore` chặn `.env` và `frontend/node_modules`, không chặn `.env.example`.
