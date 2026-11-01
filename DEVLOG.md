# Nhật ký phát triển

## 2026-11-01: B2. Dựng khung

**Đã làm**
- Scaffold frontend (Next.js 16) và backend (NestJS 12, ESM, Vitest, oxlint).
- Docker Compose chạy PostgreSQL 18, kèm CSDL `toeic_test` riêng cho test.
- Prisma schema 9 bảng, migration đầu tiên có thêm ràng buộc 4 lựa chọn và chỉ mục một lượt đang làm.
- `npm run dev` ở thư mục gốc chạy toàn bộ dự án, `.env` tự sinh `JWT_SECRET` ngẫu nhiên.
- Endpoint `GET /api/health`, test đơn vị và e2e với CSDL thật, test mẫu frontend.

**Thư viện thêm**
- `tsx`: chạy script TypeScript (seed, nạp dữ liệu).
- `@prisma/adapter-pg`, `pg`: Prisma 7 bắt buộc dùng driver adapter.
- Frontend test dùng Vitest và Testing Library để thống nhất với backend.

**Ngoại lệ phiên bản**
- TypeScript 6.0.3 thay vì 7.0.2: Nest CLI báo TS 7.0 chưa có compiler API; typescript-eslint cũng chưa hỗ trợ.
- npm 12 chặn script cài đặt, nên `bcrypt`, `prisma`, `@prisma/engines` được cho phép rõ ràng.

**Sửa lỗi của bước trước**
- `docs/openapi.yaml` có lỗi cú pháp dấu phẩy đã lọt vào merge B1 vì chuỗi lệnh không dừng khi lint lỗi.
- Cổng 5433 và 3000 đang được container dự án `shopfast` dùng, nên chuyển sang 5434 và 3002.

## 2026-11-01: B1a, B1. PRD, kiến trúc và API

**Đã làm**
- Lưu bộ prompt đã điều chỉnh vào `docs/PROMPTS.md`.
- Viết `docs/PRD.md` suy ra từ 11 màn hình vì repo chưa có PRD.
- Viết `docs/ARCHITECTURE.md` (ERD 9 bảng, giải thích bảng và quan hệ, API theo màn hình) và `docs/openapi.yaml`.

**Quyết định**
- Nâng Node từ 20.20.2 lên 26.13.0 và npm lên 12 theo yêu cầu dùng bản mới nhất. Không dùng `v27.0.0-alpha`.
- Dùng Prisma 7.10.1 vì tag `latest` của gói `prisma` đang trỏ vào `8.0.0-rc.29`, chưa phải bản ổn định.
- Đăng ký công khai chỉ tạo học viên, tránh tự cấp quyền giáo viên.
- PostgreSQL trong Docker dùng cổng 5434, frontend dùng 3002, vì 5432, 5433 và 3000 đã có dịch vụ khác trên máy.
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
