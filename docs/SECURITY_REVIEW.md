# Rà soát bảo mật

Ngày rà soát: 2026-11-01. Phạm vi: toàn bộ API backend, cấu hình frontend, dependency, tệp theo dõi trong git.

## 1. Cách rà soát
- Đọc mã từng controller, service, guard và DTO.
- Test tự động `backend/test/security.e2e-spec.ts` liệt kê endpoint thật từ router, nên endpoint mới chưa khai báo quyền sẽ làm test thất bại.
- Tìm `queryRawUnsafe`, `dangerouslySetInnerHTML`, `localStorage`, chuỗi giống khóa bí mật trong tệp được git theo dõi: không có kết quả trong mã chạy thật.
- `npm audit --omit=dev`: 0 lỗ hổng ở cả backend và frontend. `npm audit` đầy đủ còn cảnh báo trong công cụ phát triển, không nằm trong gói chạy production.

## 2. Lỗi đã sửa
| Mức | Lỗi | Cách sửa |
|---|---|---|
| Cao | Đề cho phép tới 300 phút nhưng token sống 2 giờ, học viên bị mất khả năng lưu bài giữa chừng | Thêm `POST /auth/refresh`, phòng thi gia hạn mỗi 15 phút và báo rõ khi phiên hết hạn |
| Cao | Seed tạo tài khoản giáo viên với mật khẩu mẫu kể cả ở production | Seed từ chối mật khẩu mẫu hoặc dưới 12 ký tự khi `NODE_ENV=production` |
| Cao | Backend chấp nhận `JWT_SECRET` ngắn | Không khởi động nếu khóa dưới 32 ký tự |
| Trung bình | Mỗi lần bấm tạo bộ ôn tập sinh thêm đề, làm phình CSDL | Mở lại bộ chưa hoàn thành thay vì tạo mới |
| Trung bình | Frontend thiếu header chống nhúng trang và đoán kiểu nội dung | Thêm `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` |
| Thấp | `@nestjs/mau` không dùng nhưng kéo theo gói có cảnh báo cao | Gỡ khỏi dependency |
| Cao | Kiểm tra sau deploy cho thấy 12 lần đăng nhập sai qua Vercel không bị chặn, vì Vercel ra Internet bằng nhiều IP nên giới hạn theo IP không có tác dụng | Thêm giới hạn theo email cho `POST /auth/login` |

## 3. Lỗi còn mở
| Mức | Vấn đề | Đề xuất |
|---|---|---|
| Trung bình | Giới hạn theo email có thể bị lợi dụng để tạm khóa đăng nhập của người khác trong tối đa 1 phút | Chấp nhận vì thời gian khóa ngắn |
| Trung bình | Giới hạn theo IP cho đăng ký và API chung không tin cậy được khi đi qua Vercel | Thêm bộ đếm theo tài khoản hoặc đặt tường lửa trước backend |
| Trung bình | Đăng xuất chỉ xóa cookie; token đã bị sao chép vẫn dùng được tới khi hết hạn (2 giờ) | Thêm danh sách thu hồi nếu cần |
| Thấp | Vai trò trong token cũ có hiệu lực tới khi hết hạn nếu bị đổi | Thời hạn token ngắn đã giới hạn rủi ro |
| Thấp | Sửa đáp án đúng của câu hỏi ảnh hưởng tới lượt đang làm chưa chấm | Khóa sửa đáp án nếu câu thuộc đề đã xuất bản |
| Thấp | Mọi giáo viên quản lý được mọi đề và câu hỏi | Phù hợp với một đơn vị đào tạo; cần phân quyền nếu nhiều đơn vị |
| Thấp | Đáp án của đề hiện ra sau khi nộp, học viên có thể làm lại với đáp án đã biết | Chấp nhận vì mục đích là luyện tập, không phải thi chính thức |
| Thấp | `POST /auth/register` trả 409 làm lộ email đã đăng ký | Chấp nhận để thông báo rõ cho người dùng |
| Thấp | Frontend chưa có Content-Security-Policy | Cần cấu hình cho Google Fonts và script của Next.js |

## 3a. Phần AI
- Khóa Gemini chỉ đọc từ biến môi trường, gửi qua header, không nằm trong URL hay log.
- Không gửi thông tin học viên. Có test xác nhận prompt không chứa email và tên.
- Nội dung câu hỏi được đặt trong khối dữ liệu để giảm rủi ro chèn lệnh vào prompt. Câu hỏi do giáo viên soạn nên rủi ro thấp, và rủi ro này không loại bỏ hoàn toàn được.
- Đáp án chỉ được giải thích sau khi nộp bài, và chỉ qua lượt của chính học viên.
- Chi phí bị chặn bởi cache và giới hạn lượt mỗi ngày. Gọi đồng thời không vượt được giới hạn.
- Nội dung AI có thể sai, nên giao diện ghi rõ và có nút phản hồi.

## 4. Kết quả theo hạng mục
| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| Quyền từng endpoint | Đạt | 37 endpoint cần đăng nhập đều trả 401 khi chưa đăng nhập; endpoint theo vai trò đều trả 403 khi sai vai trò |
| Lộ đáp án | Đạt | Đề thi dùng `select` liệt kê trường được phép; test đọc mọi endpoint trước khi nộp |
| Injection | Đạt | Prisma và `$queryRaw` dạng template đều tham số hóa; id kiểm tra UUID; có test chuỗi tấn công SQL |
| Giới hạn tốc độ | Đạt một phần | Đăng nhập: 10 lần mỗi phút theo email; đăng ký: 10 lần mỗi phút theo IP; toàn cục: 300 lần mỗi phút theo IP; xem mục 3 |
| Lộ khóa | Đạt | `.env` không được theo dõi; khóa chỉ đọc từ biến môi trường |
| CORS | Đạt | Chỉ `FRONTEND_ORIGIN`; có test nguồn lạ |
| CSRF | Đạt | Cookie `SameSite=Lax`, thao tác ghi không dùng GET |
| Validate đầu vào | Đạt | `ValidationPipe` với `whitelist` và `forbidNonWhitelisted`; body quá lớn trả 413 |
| Mật khẩu | Đạt | bcrypt cost 12; thông báo sai email và sai mật khẩu giống nhau |
