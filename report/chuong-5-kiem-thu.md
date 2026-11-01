# Chương 5. Kiểm thử và đánh giá

Số liệu trong chương này đo ngày 2026-11-01 trên mã nguồn hiện tại, chạy trên máy phát triển.

## 5.1. Phương pháp
| Loại | Công cụ | Phạm vi |
|---|---|---|
| Test đơn vị | Vitest | Hàm thuần: chấm điểm, gợi ý, kiểm tra dữ liệu nạp |
| Test tích hợp API | Vitest, Supertest | Gọi HTTP thật tới ứng dụng, dùng PostgreSQL thật ở CSDL riêng |
| Test giao diện | Testing Library | Biểu mẫu đăng nhập, phòng thi với đồng hồ giả lập |
| Test toàn luồng | Playwright, Chromium | Chạy thủ công, không nằm trong bộ test tự động |
| Kiểm tra tĩnh | TypeScript, oxlint, ESLint | Toàn bộ mã nguồn |

Test tích hợp dùng cơ sở dữ liệu thật thay vì giả lập, vì các lỗi quan trọng như nộp trùng phụ thuộc vào hành vi khóa của PostgreSQL.

## 5.2. Kết quả tự động
| Hạng mục | Kết quả |
|---|---|
| Test backend | 168/168 đạt, 11 tệp |
| Test frontend | 16/16 đạt, 3 tệp |
| Độ phủ backend, theo dòng lệnh | 93,1% (513/551) |
| Độ phủ backend, theo nhánh | 76,87% (246/320) |
| Độ phủ backend, theo hàm | 93,44% (171/183) |
| `npm audit --omit=dev` | 0 lỗ hổng ở cả hai phía |

Độ phủ chỉ đo mã backend tự viết, không tính mã Prisma sinh tự động. Độ phủ frontend chưa được đo.

**Phân bổ test backend:**

| Tệp | Số test | Nội dung |
|---|---|---|
| `security.e2e-spec.ts` | 77 | Quyền từng endpoint, lộ đáp án, lỗi, CORS |
| `exams.e2e-spec.ts` | 21 | Tạo đề, làm bài, nộp trùng, hết giờ |
| `recommend.spec.ts` | 15 | Thuật toán gợi ý với dữ liệu giả |
| `auth.e2e-spec.ts` | 15 | Đăng ký, đăng nhập, token, phân quyền |
| `insights.e2e-spec.ts` | 8 | Gợi ý và thống kê giáo viên |
| `scoring.spec.ts` | 8 | Tính điểm |
| `import-validator.spec.ts` | 8 | Kiểm tra dữ liệu nạp |
| `stats.e2e-spec.ts` | 7 | Kết quả và thống kê với dữ liệu cụ thể |
| `questions.e2e-spec.ts` | 6 | Ngân hàng câu hỏi |
| `health.controller.spec.ts` | 2 | Kiểm tra sức khỏe |
| `app.e2e-spec.ts` | 1 | Kết nối CSDL thật |

## 5.3. Các ca kiểm thử nghiệp vụ quan trọng
| Ca kiểm thử | Kết quả mong đợi | Kết quả |
|---|---|---|
| Đăng nhập sai mật khẩu và sai email | Cùng thông báo, không có cookie | Đạt |
| Token hết hạn, ký bằng khóa khác, `alg: none` | 401 | Đạt |
| Đăng ký kèm `role: TEACHER` | 400, không tạo tài khoản | Đạt |
| Học viên gọi endpoint giáo viên | 403 | Đạt |
| Đọc đề và lưu nháp trước khi nộp | Không có đáp án và giải thích | Đạt |
| Xem kết quả trước khi nộp | 409 | Đạt |
| Gửi đồng thời 5 yêu cầu nộp | Đúng 1 lần 200, 4 lần 409 | Đạt |
| Gửi đồng thời 5 yêu cầu bắt đầu | Chỉ tạo 1 lượt | Đạt |
| Lưu nháp sau khi hết giờ | 409, không ghi dữ liệu | Đạt |
| Nộp sau khi hết giờ | Chỉ chấm câu đã lưu, đánh dấu tự nộp | Đạt |
| Xem, lưu, nộp bài của người khác | 403 | Đạt |
| 10/24 câu đúng toàn bộ, 10/20 câu đúng 5 lần gần nhất | Tỷ lệ 41,7% và 50% | Đạt |
| Tỷ lệ sai 80%, 60%, 20% | Phân bổ 5, 4, 1 câu | Đạt |
| Chuỗi tấn công SQL trong từ khóa | Coi là văn bản, bảng còn nguyên | Đạt |

## 5.4. Kiểm thử toàn luồng
Luồng sau được chạy tự động trên Chromium, ở môi trường phát triển, stack production bằng image Docker, và trên địa chỉ đã triển khai:

1. Giáo viên đăng nhập sai, thấy thông báo lỗi, rồi đăng nhập đúng.
2. Giáo viên xem ngân hàng câu hỏi, tạo đề 10 câu ngẫu nhiên, xuất bản.
3. Học viên đăng ký trên khổ màn hình điện thoại, vào phòng thi, chọn đáp án, gắn cờ.
4. Tải lại trang, bài đã chọn vẫn còn.
5. Học viên làm hết bài, nộp, xem kết quả, xem điểm yếu và gợi ý.
6. Học viên mở trang giáo viên bị chuyển đi. Giáo viên xem thống kê.

Kết quả: mọi bước đạt, không có lỗi console, không tràn ngang trên điện thoại.

Bước này tìm ra hai lỗi mà test tự động bỏ sót: nút hiện mật khẩu nằm trong nhãn làm sai tên của ô nhập, và trang gợi ý hiện nút ôn tập khi đã hết câu chưa làm. Cả hai đã được sửa.

Việc build image từ bản clone sạch cũng làm lộ một lỗi Dockerfile phụ thuộc vào tệp chỉ có trên máy phát triển, lỗi này đã được sửa.

## 5.5. Đánh giá bảo mật
Kết quả chi tiết tại `docs/SECURITY_REVIEW.md`. Rà soát đã sửa 4 lỗi mức cao, 2 mức trung bình và 1 mức thấp. Hai lỗi đáng chú ý là token hết hạn giữa bài thi dài, và giới hạn đăng nhập không có tác dụng trên môi trường thật.

Lỗi thứ hai chỉ lộ ra khi kiểm tra sau triển khai: 12 lần đăng nhập sai qua Vercel không bị chặn vì Vercel ra Internet bằng nhiều IP. Sau khi chuyển sang giới hạn theo email, lần thứ 11 với cùng email nhận 429 trên chính địa chỉ đã triển khai, còn email khác vẫn dùng được.

Còn 3 vấn đề mức trung bình chưa sửa: giới hạn theo email có thể bị lợi dụng để tạm khóa người khác trong tối đa 1 phút, giới hạn theo IP cho đăng ký và API chung không tin cậy được khi đi qua Vercel, và token chưa thu hồi được khi đăng xuất.

Đây là rà soát do chính nhóm phát triển thực hiện, không phải kiểm thử xâm nhập độc lập.

## 5.6. Đánh giá chất lượng giải thích AI
`[CHƯA TRIỂN KHAI]` Thực hiện sau B7 và B10: lấy 50 đến 100 lời giải thích, chấm tay theo rubric (đúng nội dung, dễ hiểu, hữu ích, thang 1 đến 5), so sánh giữa các cấu hình prompt.

`[CẦN SỐ LIỆU: bảng điểm trung bình theo từng cấu hình]`

## 5.7. Đánh giá với người dùng
`[CẦN SỐ LIỆU]` Chưa thực hiện. Nội dung đề xuất:
- Số người tham gia, thời gian thử nghiệm.
- Mức hài lòng theo thang SUS hoặc bảng khảo sát riêng.
- So sánh điểm trước và sau khi dùng hệ thống, nếu có điều kiện.

## 5.8. Đánh giá hiệu năng
`[CẦN SỐ LIỆU]` Chưa đo. Nên đo thời gian phản hồi của API lưu nháp và thống kê với số người dùng đồng thời giả định, trên môi trường đã triển khai. Gói miễn phí có tài nguyên thấp nên kết quả không đại diện cho môi trường trả phí.

## 5.9. Giới hạn của kiểm thử
- Ngân hàng chỉ có 10 câu mẫu, nên thuật toán gợi ý mới được kiểm chứng về logic, chưa về hiệu quả học tập.
- Độ chính xác của điểm ước lượng so với điểm TOEIC thật chưa được kiểm chứng.
- Luồng trình duyệt chưa đưa vào bộ test tự động.
- Chưa thử trên Safari, Firefox và thiết bị di động thật.
