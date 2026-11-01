# PRD: Hệ thống luyện thi TOEIC Reading

> **Bản suy ra từ 11 màn hình trong `/design`**, không phải tài liệu do chủ dự án viết. Nếu có khác biệt với ý định của chủ dự án, ý định đó được ưu tiên.

## 1. Mục tiêu
Giúp người học Việt Nam luyện TOEIC Reading (Part 5, 6, 7) trong điều kiện bấm giờ, biết mình yếu ở đâu và được gợi ý ôn đúng chỗ. Giúp giáo viên quản lý câu hỏi, tạo đề và theo dõi kết quả học viên.

## 2. Người dùng
| Vai trò | Nhu cầu chính |
|---|---|
| Học viên | Làm đề, xem kết quả, biết điểm yếu, ôn tập theo gợi ý |
| Giáo viên | Quản lý ngân hàng câu hỏi, tạo đề, xem thống kê học viên |

## 3. Chức năng theo màn hình
| Màn hình (thư mục `/design`) | Vai trò | Chức năng trong phạm vi |
|---|---|---|
| `dang-nhap-dang-ky` | Mọi người | Đăng nhập, đăng ký học viên |
| `trang-chu-hoc-vien` | Học viên | Điểm ước lượng, số đề đã làm, độ chính xác, chủ đề cần ôn, đề gần đây |
| `danh-sach-de-thi-toeic` | Học viên | Danh sách đề, lọc theo part và mức độ, trạng thái đã làm |
| `phong-thi-truc-tuyen` | Học viên | Làm bài, đếm giờ phía máy chủ, tự lưu, đánh dấu câu, bảng câu hỏi, nộp bài |
| `ket-qua-bai-thi-toeic` | Học viên | Điểm ước lượng, độ chính xác, kết quả theo part và chủ đề, xem lại từng câu |
| `thong-ke-diem-yeu-va-on-tap-goi-y` | Học viên | Độ chính xác theo chủ đề, xu hướng 5 lần gần nhất, bộ ôn tập gợi ý |
| `giai-thich-ai-panel-phan-tich-cau-sai` | Học viên | **Hoãn**: hiện giải thích có sẵn của câu hỏi và trạng thái AI chưa khả dụng |
| `ngan-hang-cau-hoi-giao-vien` | Giáo viên | Thêm, sửa, xóa, lọc câu hỏi và đoạn văn |
| `tao-de-thi-moi-giao-vien` | Giáo viên | Tạo đề chọn tay hoặc ngẫu nhiên, xem trước, xuất bản |
| `thong-ke-lop-hoc-va-ket-qua-dao-tao-giao-vien` | Giáo viên | Điểm trung bình theo chủ đề, câu hay sai nhất, học viên cần hỗ trợ |

## 4. Quy tắc nghiệp vụ
- Đăng ký công khai chỉ tạo tài khoản học viên; tài khoản giáo viên do hệ thống cấp.
- Thời gian làm bài do máy chủ quyết định. Hết giờ thì bài được chấm theo các câu đã lưu.
- Đáp án đúng và giải thích chỉ trả về sau khi bài đã nộp.
- Mỗi lượt làm bài chỉ nộp được một lần; mỗi học viên chỉ có một lượt đang làm trên một đề.
- Điểm hiển thị là **điểm ước lượng** theo tỷ lệ đúng tuyến tính trên thang 495, không phải điểm TOEIC chính thức.

## 5. Ngoài phạm vi
| Mục trong thiết kế | Lý do |
|---|---|
| Giải thích bằng AI (B7), bộ đánh giá AI (B10) | Hoãn theo yêu cầu, làm sau |
| Lớp học, gửi thông báo lớp | Không có trong danh sách bảng dữ liệu |
| Hỏi đáp, thông báo, tài liệu giảng dạy | Không có trong kế hoạch phát triển |
| Quên mật khẩu, đăng nhập Google | Không có trong kế hoạch phát triển |
| Xuất PDF/Excel, nhập file trên giao diện | Không có trong kế hoạch; nạp dữ liệu bằng script |
| Chuỗi ngày học, xếp hạng so với học viên khác | Không có trong kế hoạch phát triển |
| Đề và nhãn ETS, Hacker TOEIC | Dữ liệu có bản quyền; chỉ dùng câu hỏi tự soạn |
| Listening | Chỉ chừa trường `audio_url`, `transcript` |

## 6. Yêu cầu phi chức năng
- **Bảo mật:** băm mật khẩu, phân quyền ở backend trên từng endpoint, khóa bí mật chỉ nằm trong biến môi trường.
- **Độ tin cậy:** mất mạng tạm thời không làm mất bài; tối đa mất các thay đổi trong vài giây gần nhất.
- **Giao diện:** tiếng Việt, theo `design/DESIGN.md`, dùng được trên màn hình điện thoại.
