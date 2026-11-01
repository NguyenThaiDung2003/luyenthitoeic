# Nhật ký phát triển

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
