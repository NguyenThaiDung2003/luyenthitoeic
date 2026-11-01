# Nhật ký phát triển

## 2026-11-01: Tổng hợp báo cáo

**Đã làm**
- Gộp 6 chương và phần tài liệu tham khảo thành `report/bao-cao-do-an.md`, thêm trang tiêu đề, mục lục và bảng việc còn thiếu.
- Nội dung chương giữ nguyên, các tệp chương vẫn còn.

**Kiểm tra**
- Đối chiếu tự động với tệp nguồn: đủ nội dung, đúng thứ tự, đủ sơ đồ Mermaid.

## 2026-11-01: B13. Báo cáo

**Đã làm**
- Viết bản nháp 6 chương trong `report/` và danh sách nguồn cần tìm.

**Quyết định**
- Dùng cấu trúc đồ án phổ biến vì `report/` chưa có mẫu của trường.
- Số liệu kiểm thử lấy từ lần chạy thật: 167 test backend, 16 test frontend, độ phủ dòng lệnh backend 93,05%.
- Không tự tạo tài liệu tham khảo; phần chưa có dùng các nhãn `[CẦN SỐ LIỆU]`, `[CHƯA TRIỂN KHAI]`, `[CẦN TRÍCH DẪN]`, `[CẦN BỔ SUNG]`.

## 2026-11-01: B12. Triển khai

**Đã làm**
- Dockerfile backend và frontend, `docker-compose.prod.yml`, `docs/DEPLOYMENT.md`.
- `prisma` và `tsx` chuyển sang dependencies vì migration và seed chạy ở production.
- Bật `output: "standalone"` cho Next.js.

**Kiểm tra**
- Build image thật và chạy stack production cô lập ở cổng 8091, luồng trình duyệt đạt toàn bộ.
- Cookie có `HttpOnly; Secure; SameSite=Lax`.
- Backend từ chối khởi động khi `JWT_SECRET` ngắn; seed từ chối mật khẩu mẫu ở production.
- Chưa deploy thật lên Vercel, Render hay VPS.

**Lỗi tự phát hiện**
- Dockerfile ban đầu sao chép `src/generated` đã bị gitignore, sẽ thất bại trên bản clone sạch. Đã bỏ vì postinstall tự sinh lại.

## 2026-11-01: B11. Kiểm thử và bảo mật

**Đã làm**
- Rà soát toàn bộ API, kết quả trong `docs/SECURITY_REVIEW.md`.
- Sửa 3 lỗi mức cao, 2 mức trung bình, 1 mức thấp. Còn 3 lỗi mức trung bình và 6 lỗi mức thấp được ghi lại.
- Test bảo mật tự liệt kê endpoint thật từ router, nên endpoint mới quên khai báo quyền sẽ làm test thất bại.
- Chạy luồng người dùng trên Chromium bằng Playwright đặt ngoài repo, có cả khổ điện thoại.

**Lỗi phát hiện nhờ chạy trình duyệt**
- Nút hiện mật khẩu nằm trong `label` làm sai tên của ô mật khẩu.
- Trang gợi ý hiện nút ôn tập dù đã hết câu chưa làm.

## 2026-11-01: B9. Thống kê giáo viên

**Đã làm**
- Bốn endpoint thống kê bằng SQL và trang `/teacher/stats`.

**Quyết định**
- Điểm theo chủ đề là tỷ lệ đúng quy đổi tuyến tính sang thang 495.
- Học viên cần hỗ trợ: tỷ lệ đúng dưới 50% trong 5 lần nộp gần nhất.
- Không có bảng lớp học nên thống kê trên toàn bộ học viên.

## 2026-11-01: B8. Gợi ý ôn tập

**Thuật toán** (`backend/src/recommendations/recommend.ts`)
1. Chọn tối đa 3 chủ đề có tỷ lệ đúng thấp nhất, bỏ chủ đề đã đúng hết.
2. Chọn mức độ theo năng lực: dưới 50% là Dễ, dưới 75% là Trung bình, còn lại là Nâng cao.
3. Chia 10 câu theo tỷ lệ sai bằng phương pháp phần dư lớn nhất.
4. Chọn câu chưa làm theo mức phù hợp, thiếu thì lấy mức gần nhất.
5. Vẫn thiếu thì lấy từ chủ đề yếu khác, sau đó từ các chủ đề còn lại.

Thuật toán tách riêng thành hàm thuần để test với dữ liệu giả. Không gọi mô hình ngôn ngữ.

## 2026-11-01: B6. Chấm điểm, kết quả và thống kê

**Đã làm**
- Trang kết quả, trang lịch sử, trang chủ học viên.
- Thống kê bằng SQL: tỷ lệ đúng theo chủ đề, xu hướng 5 lần gần nhất.

**Quyết định**
- Điểm ước lượng tuyến tính, làm tròn theo bước 5, tối thiểu 5. Ghi rõ không phải điểm chính thức.
- Câu bỏ trống tính là sai.

## 2026-11-01: B5. Tạo đề và làm bài

**Đã làm**
- Tạo đề chọn tay hoặc ngẫu nhiên, xuất bản đề, phòng thi.
- Tự lưu mỗi 5 giây, chỉ gửi câu đã đổi; mất mạng thì giữ lại và gửi lại.

**Quyết định**
- Lưu nháp và chấm bài cùng khóa dòng `attempts`, nên nộp đồng thời chỉ một yêu cầu thành công.
- Tắt `cacheComponents` của Next.js vì ứng dụng tải dữ liệu phía client, tính năng này không có lợi và bắt bọc `Suspense` cho route động.

## 2026-11-01: B4. Ngân hàng câu hỏi

**Đã làm**
- CRUD câu hỏi, đoạn văn, lọc theo part, chủ đề, mức độ, từ khóa.
- Script `npm run import:questions`: báo số dòng lỗi, nạp trong một giao dịch, chạy lại không tạo bản trùng.
- 10 câu mẫu tự soạn trong `data/sample-questions.json`.

**Quyết định**
- Schema nạp có thêm `part` và `passage` vì hệ thống cần để phân loại câu Part 6, 7.
- Thêm `@nestjs/mapped-types` để dùng `PartialType` cho DTO sửa.

## 2026-11-01: B3. Xác thực và phân quyền

**Đã làm**
- Đăng ký, đăng nhập, đăng xuất, guard toàn cục theo vai trò, trang đăng nhập.
- Test đăng nhập sai, sai quyền, token hết hạn, token giả mạo, `alg: none`, giới hạn thử.

**Quyết định**
- Dùng bcrypt cost 12.
- Bỏ chọn vai trò ở màn hình đăng nhập vì vai trò lấy từ tài khoản.
- Tự viết guard JWT bằng `@nestjs/jwt`, không dùng Passport vì không cần nhiều chiến lược đăng nhập.

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


