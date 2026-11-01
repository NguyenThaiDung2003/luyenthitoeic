# Chương 6. Kết luận và hướng phát triển

## 6.1. Kết quả đạt được
Hệ thống đã có đủ luồng luyện thi cho học viên và công cụ cho giáo viên:

- Xác thực, phân quyền hai vai trò, mọi endpoint mặc định cần đăng nhập.
- Ngân hàng câu hỏi, đoạn văn, nạp dữ liệu từ JSON có kiểm tra.
- Tạo đề chọn tay hoặc ngẫu nhiên.
- Phòng thi đếm giờ phía máy chủ, tự lưu, chịu được mất mạng tạm thời.
- Chấm điểm một lần, không lộ đáp án trước khi nộp.
- Thống kê điểm yếu, xu hướng, gợi ý bộ ôn tập theo luật.
- Thống kê cho giáo viên.
- Giải thích câu sai bằng Gemini, có cache, giới hạn lượt và phản hồi của người học.
- Đóng gói Docker và triển khai tại https://luyenthitoeic-delta.vercel.app.

Về kỹ thuật, 235 test tự động đều đạt và độ phủ dòng lệnh backend đạt 94,62%.

## 6.2. Đóng góp
- Một phòng thi trực tuyến xử lý đúng các tình huống đồng thời: nộp trùng, hết giờ, mất mạng.
- Một thuật toán gợi ý đơn giản, có thể giải thích và kiểm thử được.

`[CẦN BỔ SUNG: đóng góp về mặt giáo dục sau khi có số liệu thực nghiệm]`

## 6.3. Hạn chế
- Chất lượng giải thích của AI chưa có kết quả chấm tay. `[CẦN SỐ LIỆU]`
- Hệ thống phụ thuộc vào Gemini: dịch vụ có lúc quá tải, và gói miễn phí có hạn mức theo ngày cho toàn hệ thống.
- Ngân hàng chỉ có 10 câu mẫu tự soạn.
- Chưa thử nghiệm với người dùng thật. Bản triển khai dùng gói miễn phí nên chưa phù hợp để vận hành lâu dài.
- Điểm ước lượng là tuyến tính, không tương ứng với điểm TOEIC chính thức.
- Ngưỡng của thuật toán gợi ý chưa được kiểm chứng.
- Thống kê giáo viên tính trên toàn bộ học viên vì chưa có khái niệm lớp học.
- Chưa có đăng nhập Google, quên mật khẩu, xuất báo cáo.
- Còn các vấn đề bảo mật mức trung bình nêu ở chương 5.

## 6.4. Hướng phát triển
1. Hoàn tất chấm tay bộ đánh giá AI và cải tiến prompt theo kết quả.
2. Mở rộng ngân hàng câu hỏi có giấy phép rõ ràng.
3. Thêm lớp học để giáo viên theo dõi theo nhóm.
4. Thêm khôi phục mật khẩu và thu hồi token khi đăng xuất.
5. Thêm phần Listening, cơ sở dữ liệu đã chừa sẵn trường.
6. Cải tiến gợi ý theo dữ liệu thực nghiệm.
