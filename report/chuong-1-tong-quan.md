# Chương 1. Tổng quan đề tài

## 1.1. Lý do chọn đề tài
TOEIC là chứng chỉ tiếng Anh được dùng phổ biến trong môi trường làm việc và chuẩn đầu ra ở nhiều trường đại học tại Việt Nam `[CẦN TRÍCH DẪN]`. `[CẦN SỐ LIỆU: tỷ lệ sinh viên cần chứng chỉ, số người dự thi nếu có nguồn]`

Người tự luyện TOEIC Reading thường gặp ba khó khăn. Thứ nhất, họ biết mình sai câu nào nhưng khó biết mình yếu ở dạng kiến thức nào. Thứ hai, luyện đề không bấm giờ thì không tạo được áp lực như phòng thi thật. Thứ ba, sau khi làm đề, họ không biết nên ôn gì tiếp theo. `[CẦN BỔ SUNG: nhận định này nên có khảo sát hoặc nguồn dẫn]`

Đề tài xây dựng một hệ thống web giúp người học luyện đề trong điều kiện bấm giờ, xem thống kê điểm yếu theo chủ đề, nhận bộ câu hỏi ôn tập phù hợp, và được giải thích đáp án bằng AI. Giáo viên có công cụ quản lý câu hỏi, tạo đề và theo dõi học viên.

## 1.2. Mục tiêu
| Mục tiêu | Trạng thái |
|---|---|
| Luyện đề TOEIC Reading có đếm giờ, tự lưu bài | Đã hoàn thành |
| Chấm điểm tự động, thống kê điểm yếu theo chủ đề | Đã hoàn thành |
| Gợi ý bộ ôn tập dựa trên kết quả của từng học viên | Đã hoàn thành (theo luật) |
| Công cụ cho giáo viên: ngân hàng câu hỏi, tạo đề, thống kê | Đã hoàn thành |
| Giải thích đáp án bằng AI | `[CHƯA TRIỂN KHAI]` |
| Đánh giá chất lượng giải thích của AI | `[CHƯA TRIỂN KHAI]` |

## 1.3. Đối tượng sử dụng
- **Học viên:** người đang luyện thi TOEIC Reading.
- **Giáo viên:** người soạn câu hỏi, tạo đề và theo dõi kết quả.

## 1.4. Phạm vi
**Trong phạm vi:** TOEIC Reading gồm Part 5, 6, 7; ứng dụng web tiếng Việt; hai vai trò học viên và giáo viên.

**Ngoài phạm vi:**
- Phần Listening. Cơ sở dữ liệu đã chừa trường `audio_url` và `transcript` để mở rộng.
- Lớp học, hỏi đáp, thông báo, xuất PDF và Excel.
- Đăng nhập Google, quên mật khẩu.
- Quy đổi điểm chính thức. Hệ thống chỉ hiển thị điểm ước lượng.

## 1.5. Phương pháp thực hiện
Dự án chia thành các bước nối tiếp: thiết kế giao diện, phân tích yêu cầu từ thiết kế, thiết kế dữ liệu và API, dựng khung, phát triển từng chức năng kèm kiểm thử, rà soát bảo mật, chuẩn bị triển khai. Mỗi bước làm trên một nhánh git riêng và chỉ gộp vào nhánh chính khi kiểm thử đạt. Quá trình được ghi trong `DEVLOG.md`.

## 1.6. Cấu trúc báo cáo
Chương 2 trình bày kiến thức nền. Chương 3 phân tích và thiết kế hệ thống. Chương 4 mô tả cài đặt các chức năng chính. Chương 5 trình bày kiểm thử. Chương 6 kết luận và nêu hướng phát triển.
