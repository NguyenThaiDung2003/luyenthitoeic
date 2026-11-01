# Hướng dẫn triển khai

Có hai phương án. Phương án 1 phù hợp để demo vì không phải quản trị máy chủ. Phương án 2 đã được chạy thử với image thật trên máy phát triển.

## Bản đang chạy
| Thành phần | Địa chỉ | Gói |
|---|---|---|
| Frontend | https://luyenthitoeic-delta.vercel.app | Vercel |
| Backend | https://luyenthitoeic-backend.onrender.com | Render Free, Singapore |
| CSDL | `luyenthitoeic-db` | Render Postgres Free, Singapore |

- Backend tự deploy khi push lên `master`.
- Frontend chưa nối với GitHub, deploy thủ công: `cd frontend`, rồi `npx vercel@latest deploy --prod`.
- Tên `luyenthitoeic.vercel.app` thuộc về người khác. `FRONTEND_ORIGIN` phải là địa chỉ thật ở bảng trên.
- Mật khẩu giáo viên xem ở biến `SEED_TEACHER_PASSWORD` trên trang Environment của service Render.
- Khi đặt biến trên Vercel bằng PowerShell, dùng `vercel env add TEN production --value "giá trị"`. Không truyền qua pipe vì PowerShell làm sai giá trị.
- Gói miễn phí của Render có giới hạn về ngủ dịch vụ và thời hạn CSDL. Kiểm tra điều khoản hiện tại trước ngày demo.

## 1. Vercel và Render

### Backend và CSDL trên Render
1. Tạo PostgreSQL trên Render và lấy Internal Database URL.
2. Tạo Web Service kiểu Docker, Root Directory là `backend`.
3. Gói trả phí: Pre-Deploy Command là `npx prisma migrate deploy && npm run seed`. Gói miễn phí không có bước này, nên đặt Docker Command là `npm run start:render`.
4. Health Check Path: `/api/health`.
5. Đặt biến môi trường theo bảng ở mục 3.

### Frontend trên Vercel
1. Import repo, Root Directory là `frontend`.
2. Đặt `BACKEND_URL` là địa chỉ Render, ví dụ `https://ten-dich-vu.onrender.com`.
3. Mỗi lần đổi `BACKEND_URL` phải build lại vì Next.js ghi rewrite vào bản build.

Trình duyệt chỉ gọi tên miền Vercel, nên cookie đăng nhập là cookie cùng nguồn.

## 2. VPS với Docker Compose
1. Tạo `.env.prod` ở thư mục gốc, không đưa lên git:
   ```bash
   POSTGRES_PASSWORD=<mật khẩu ngẫu nhiên>
   JWT_SECRET=<ít nhất 32 ký tự, tạo bằng: openssl rand -hex 32>
   PUBLIC_URL=https://ten-mien-cua-ban
   SEED_TEACHER_EMAIL=<email giáo viên>
   SEED_TEACHER_PASSWORD=<ít nhất 12 ký tự>
   ```
2. Chạy:
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
   ```
3. Đặt reverse proxy HTTPS (Nginx hoặc Caddy) trỏ tới `127.0.0.1:8080`. Bắt buộc có HTTPS vì cookie đăng nhập dùng `Secure` khi chạy production.

## 3. Biến môi trường backend
| Biến | Bắt buộc | Ghi chú |
|---|---|---|
| `DATABASE_URL` | Có | Chuỗi kết nối PostgreSQL |
| `JWT_SECRET` | Có | Ít nhất 32 ký tự, nếu ngắn hơn backend không khởi động |
| `JWT_EXPIRES_IN_SECONDS` | Không | Mặc định 7200 |
| `NODE_ENV` | Có | Đặt `production`; image Docker đã đặt sẵn |
| `FRONTEND_ORIGIN` | Có | Địa chỉ công khai của frontend |
| `TRUST_PROXY_HOPS` | Có | Xem bên dưới |
| `AUTH_RATE_LIMIT` | Không | Mặc định 10 lần mỗi phút |
| `GLOBAL_RATE_LIMIT` | Không | Mặc định 300 lần mỗi phút |
| `SEED_TEACHER_EMAIL`, `SEED_TEACHER_PASSWORD` | Khi seed | Mật khẩu ít nhất 12 ký tự |

**`TRUST_PROXY_HOPS`** là số proxy đứng trước backend, dùng để lấy đúng IP cho giới hạn tốc độ:
- VPS: `2` (reverse proxy, Next.js).
- Vercel và Render: `2` (Vercel, Render). Giá trị này chỉ ảnh hưởng tới giới hạn theo IP. Đăng nhập được giới hạn theo email nên không phụ thuộc vào nó.

## 4. Migration khi deploy
- Chỉ dùng `npx prisma migrate deploy`. Không dùng `migrate dev` ở production.
- Migration chạy trước khi bản mới nhận truy cập: Pre-Deploy Command trên Render, dịch vụ `migrate` trên VPS.
- Sao lưu CSDL trước migration có xóa hoặc đổi cột.
- Thay đổi lớn nên chia hai đợt: thêm cột mới, deploy, rồi mới xóa cột cũ.

## 5. Sao lưu CSDL
Trên VPS, tạo bản sao lưu:
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T postgres \
  pg_dump -U toeic -d toeic --format=custom > backup-$(date +%F).dump
```

Khôi phục:
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod exec -T postgres \
  pg_restore -U toeic -d toeic --clean --if-exists < backup-YYYY-MM-DD.dump
```

- Đặt lịch hằng ngày bằng cron và giữ bản sao ở nơi khác máy chủ.
- Trên Render, bản sao lưu tự động phụ thuộc gói dịch vụ; kiểm tra trước khi dùng dữ liệu thật.
- Thử khôi phục định kỳ, vì bản sao lưu chưa từng khôi phục thì chưa thể tin cậy.

## 6. Checklist sau deploy
- [ ] `GET /api/health` trả `{"status":"ok","database":"up"}`.
- [ ] Mở trang bằng HTTPS, trình duyệt không cảnh báo.
- [ ] Cookie `access_token` có `HttpOnly`, `Secure`, `SameSite=Lax`.
- [ ] Đăng ký học viên mới, gửi thêm trường `role: "TEACHER"` phải bị từ chối.
- [ ] Giáo viên đăng nhập được và đổi mật khẩu seed nếu đã từng dùng chung.
- [ ] Tạo đề, xuất bản, học viên làm bài, tự lưu, tải lại trang vẫn còn bài, nộp bài, xem kết quả.
- [ ] Học viên mở `/teacher/stats` bị chuyển đi; gọi API giáo viên nhận 403.
- [ ] Đăng nhập sai 11 lần trong một phút với cùng một email nhận 429, còn email khác vẫn đăng nhập được.
- [ ] `git ls-files` không có file `.env` thật.
- [ ] Chạy thử một lần sao lưu và khôi phục.
