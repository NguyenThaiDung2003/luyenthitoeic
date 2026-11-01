# Chương 2. Cơ sở lý thuyết

## 2.1. Bài thi TOEIC Reading
Phần Reading của bài thi TOEIC gồm 100 câu trắc nghiệm làm trong 75 phút, thang điểm 5 đến 495 `[CẦN TRÍCH DẪN: tài liệu của ETS]`. Bài thi có ba phần:

| Phần | Dạng | Số câu |
|---|---|---|
| Part 5 | Hoàn thành câu | 30 |
| Part 6 | Hoàn thành đoạn văn | 16 |
| Part 7 | Đọc hiểu đoạn văn đơn và đa đoạn | 54 |

Điểm chính thức được quy đổi theo bảng của ETS, không phải tỷ lệ tuyến tính `[CẦN TRÍCH DẪN]`. Do không có bảng quy đổi công khai dùng được, hệ thống dùng điểm ước lượng tuyến tính và ghi rõ trên giao diện.

## 2.2. Luyện tập có phản hồi và ôn tập theo điểm yếu
`[CẦN TRÍCH DẪN: nghiên cứu về vai trò của phản hồi trong học ngôn ngữ, về học thích ứng]`

Viết phần này sau khi có nguồn thật. Nội dung cần làm rõ: vì sao phản hồi ngay sau bài làm giúp người học, và vì sao ôn theo điểm yếu hiệu quả hơn làm đề tràn lan.

## 2.3. Mô hình ngôn ngữ lớn trong giải thích đáp án
`[CHƯA TRIỂN KHAI]` Viết khi hoàn thành B7: giới thiệu mô hình ngôn ngữ lớn, cách thiết kế prompt, đầu ra có cấu trúc, rủi ro nội dung sai.

## 2.4. Công nghệ sử dụng
Phiên bản dưới đây đọc từ `node_modules` của dự án ngày 2026-11-01.

| Thành phần | Công nghệ | Phiên bản | Vai trò |
|---|---|---|---|
| Môi trường chạy | Node.js | 26.13.0 | Chạy backend và công cụ build |
| Ngôn ngữ | TypeScript | 6.0.3 | Kiểm tra kiểu cho cả hai phía |
| Giao diện | Next.js, React | 16.4.3, 19.3.1 | Ứng dụng web, định tuyến |
| Định dạng | Tailwind CSS | 4.3.3 | CSS theo token thiết kế |
| Backend | NestJS | 12.3.2 | Tổ chức module, dependency injection, guard |
| Cơ sở dữ liệu | PostgreSQL | 18 | Lưu trữ quan hệ |
| Truy cập dữ liệu | Prisma | 7.10.1 | Schema, migration, truy vấn |
| Băm mật khẩu | bcrypt | 6.0.0 | Lưu mật khẩu an toàn |
| Kiểm thử | Vitest, Supertest, Testing Library | 4.1.12 và 5.0.5 | Test đơn vị và tích hợp |
| Đóng gói | Docker, Docker Compose | | Chạy CSDL và triển khai |

Dự án ưu tiên phiên bản ổn định mới nhất. TypeScript dùng bản 6 thay vì 7 vì Nest CLI và typescript-eslint chưa hỗ trợ bản 7. Prisma dùng bản 7.10.1 vì tag `latest` của gói đang là bản thử nghiệm của Prisma 8.

### 2.4.1. JSON Web Token
JWT là chuỗi có chữ ký, chứa thông tin định danh, cho phép máy chủ xác thực mà không cần lưu phiên `[CẦN TRÍCH DẪN: RFC 7519]`. Hệ thống đặt JWT trong cookie `HttpOnly` để JavaScript trên trang không đọc được, giảm rủi ro khi có lỗi XSS `[CẦN TRÍCH DẪN: OWASP]`.

### 2.4.2. Băm mật khẩu bằng bcrypt
bcrypt là hàm băm chậm có muối, có tham số chi phí để làm chậm tấn công dò mật khẩu `[CẦN TRÍCH DẪN]`. Hệ thống dùng chi phí 12.

### 2.4.3. Khóa dòng trong PostgreSQL
`SELECT ... FOR UPDATE` khóa dòng được chọn cho đến khi giao dịch kết thúc, nên các giao dịch khác muốn sửa dòng đó phải chờ `[CẦN TRÍCH DẪN: tài liệu PostgreSQL]`. Hệ thống dùng cơ chế này để tránh chấm một bài hai lần.
