# Bản nháp báo cáo đồ án tốt nghiệp

**Đề tài:** Hệ thống luyện thi TOEIC Reading có AI giải thích và gợi ý ôn tập

Bản nháp này viết theo cấu trúc đồ án phổ biến vì `/report` chưa có mẫu của trường. Khi có mẫu, cần chuyển nội dung sang đúng định dạng và thứ tự chương của trường.

## Danh sách chương
Tệp tổng hợp được gộp từ các tệp chương. Khi sửa chương, cần sửa ở cả tệp tổng hợp hoặc gộp lại.

| Tệp | Nội dung |
|---|---|
| [bao-cao-do-an.md](bao-cao-do-an.md) | Toàn bộ báo cáo trong một tệp, kèm bảng việc còn thiếu |
| [chuong-1-tong-quan.md](chuong-1-tong-quan.md) | Lý do chọn đề tài, mục tiêu, phạm vi |
| [chuong-2-co-so-ly-thuyet.md](chuong-2-co-so-ly-thuyet.md) | Bài thi TOEIC Reading, công nghệ sử dụng |
| [chuong-3-phan-tich-thiet-ke.md](chuong-3-phan-tich-thiet-ke.md) | Yêu cầu, kiến trúc, dữ liệu, API |
| [chuong-4-cai-dat.md](chuong-4-cai-dat.md) | Cài đặt các chức năng chính |
| [chuong-5-kiem-thu.md](chuong-5-kiem-thu.md) | Kiểm thử, bảo mật, phần thực nghiệm AI |
| [chuong-6-ket-luan.md](chuong-6-ket-luan.md) | Kết quả, hạn chế, hướng phát triển |
| [tai-lieu-tham-khao.md](tai-lieu-tham-khao.md) | Danh sách nguồn cần tìm |

## Ý nghĩa các nhãn đánh dấu
| Nhãn | Việc cần làm |
|---|---|
| `[CẦN SỐ LIỆU]` | Cần kết quả thực nghiệm hoặc khảo sát thật |
| `[CHƯA TRIỂN KHAI]` | Tính năng chưa có trong hệ thống, viết sau khi làm xong |
| `[CẦN TRÍCH DẪN]` | Cần tìm nguồn thật và trích dẫn |
| `[CẦN BỔ SUNG]` | Thông tin chỉ tác giả mới biết |

## Điểm cần lưu ý trước khi nộp
- **Tên đề tài có "AI giải thích" nhưng B7 và B10 chưa làm.** Phần cốt lõi về AI của đề tài vẫn đang để trống. Nên hoàn thành trước khi bảo vệ, hoặc trao đổi với giảng viên hướng dẫn về phạm vi.
- **Ngân hàng câu hỏi hiện chỉ có 10 câu mẫu**, nên chưa đủ để thực nghiệm hay đánh giá thuật toán gợi ý.
- **Đã deploy tại https://luyenthitoeic-delta.vercel.app** nhưng chưa có người dùng thật, nên chưa có số liệu sử dụng hay hiệu năng.
- Số liệu kiểm thử trong chương 5 đo ngày 2026-11-01. Cần đo lại nếu mã nguồn thay đổi.
- Tài liệu tham khảo cố ý để trống, không có nguồn nào được tự tạo.
