# Luyện thi TOEIC Reading

## Mô tả dự án
Hệ thống luyện thi TOEIC Reading có AI giải thích và gợi ý ôn tập. Đây là đồ án tốt nghiệp.

## Stack
- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Backend**: NestJS
- **Cơ sở dữ liệu**: PostgreSQL, Prisma
- **Xác thực**: JWT
- **AI**: chưa chốt nhà cung cấp

## Cấu trúc repo
| Thư mục | Vai trò |
|---|---|
| `frontend/` | Ứng dụng web Next.js |
| `backend/` | API NestJS và Prisma schema |
| `design/` | Thiết kế giao diện, wireframe |
| `docs/` | Tài liệu kỹ thuật, đặc tả |
| `data/` | Dữ liệu đề thi, dữ liệu mẫu |
| `report/` | Báo cáo đồ án |

File `.gitkeep` chỉ để giữ thư mục rỗng trong git; xóa khi thư mục đã có nội dung.

## Quy tắc làm việc

### Trước khi viết code
- Dùng Plan mode, liệt kê file sẽ tạo hoặc sửa và lý do, rồi chờ duyệt.

### Sau khi xong
- Chạy test.
- Tóm tắt đã thay đổi gì.
- Giải thích các đoạn quan trọng bằng tiếng Việt.
- Ghi vào `DEVLOG.md`.

### Luôn tuân thủ
- Comment trong code viết bằng tiếng Việt.
- Viết test cho logic quan trọng.
- Không đưa khóa API vào code. Dùng biến môi trường; `.env` không được đưa lên git.
- Không tự thêm thư viện hay đổi kiến trúc khi chưa hỏi.

## Quy ước đặt tên
| Đối tượng | Quy ước | Ví dụ |
|---|---|---|
| Component React | `PascalCase` | `QuestionCard.tsx` |
| Route Next.js, thư mục | `kebab-case` | `practice-test/` |
| File NestJS | `kebab-case.<loại>.ts` | `auth.service.ts` |
| Biến, hàm | `camelCase` | `calculateScore` |
| Class, type, interface | `PascalCase` | `ExamResult` |
| Hằng số | `UPPER_SNAKE_CASE` | `MAX_ATTEMPTS` |
| Prisma model | `PascalCase` số ít | `Question` |
| Prisma field | `camelCase` | `createdAt` |
| Bảng, cột trong DB | `snake_case` qua `@@map`/`@map` | `created_at` |
| Commit | Conventional Commits | `feat: thêm đăng nhập` |

## Cách chạy dự án
Yêu cầu: Node.js 26, Docker đang chạy.

```bash
npm run dev    # Tạo .env, cài gói, chạy PostgreSQL, migration, seed, backend và frontend
npm test       # Test backend và frontend; backend cần PostgreSQL đang chạy
npm run lint
npm run build
```

| Dịch vụ | Địa chỉ |
|---|---|
| Frontend | http://localhost:3002 |
| Backend | http://localhost:3001/api |
| PostgreSQL | localhost:5434 |

Tài khoản giáo viên lấy từ `SEED_TEACHER_EMAIL` và `SEED_TEACHER_PASSWORD` trong `backend/.env`.

## Phiên bản
Dùng bản ổn định mới nhất. Các ngoại lệ hiện tại:
- TypeScript 6: Nest CLI và typescript-eslint chưa hỗ trợ TS 7.
- Prisma 7: tag `latest` của gói `prisma` đang là bản rc của Prisma 8.
