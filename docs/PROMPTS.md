# Prompt theo thứ tự thực hiện

Bộ prompt đã điều chỉnh từ phần B ban đầu. Phần AI (B7, B10) tạm hoãn.

Áp dụng cho mọi bước: dùng phiên bản ổn định mới nhất của Node và các công nghệ; chạy lint, build, test; tóm tắt thay đổi; giải thích đoạn quan trọng bằng tiếng Việt; ghi `DEVLOG.md`; làm trên nhánh riêng rồi merge vào `master` khi test đạt.

## B1a. PRD
"Đọc 11 màn hình trong `/design` và viết `/docs/PRD.md`: mục tiêu, người dùng, chức năng theo màn hình, ngoài phạm vi, yêu cầu phi chức năng. Ghi rõ đây là bản suy ra từ thiết kế."

## B1. Thiết kế dữ liệu và API
"Đọc `/docs/PRD.md` và `/design`. Đề xuất ERD (users, topics, passages, questions, exams, exam_questions, attempts, answers, ai_explanations) và API REST theo từng màn hình. Chừa `audio_url`, `transcript` trong questions. Xuất `/docs/ARCHITECTURE.md`, `/docs/openapi.yaml`. Giải thích từng bảng và quan hệ. Chưa viết code."

## B2. Dựng khung
"Dựng khung frontend và backend theo ARCHITECTURE.md, Docker Compose chạy PostgreSQL, Prisma schema và migration đầu tiên, `.env.example`, endpoint sức khỏe, lint và một test mẫu mỗi phía. Chạy được bằng một lệnh."

## B3. Xác thực và phân quyền
"Làm đăng ký, đăng nhập, JWT, vai trò học viên và giáo viên, guard theo vai trò, trang đăng nhập theo thiết kế. Băm mật khẩu bằng bcrypt. Đăng ký công khai chỉ tạo học viên. Test: đăng nhập sai, sai quyền, token hết hạn."

## B4. Ngân hàng câu hỏi và nạp dữ liệu
"Làm CRUD câu hỏi và đoạn văn cho giáo viên, lọc theo part, chủ đề, mức độ. Viết script nạp JSON theo schema: question, options (4), correct, topic, difficulty, explanation, source, license; kiểm tra hợp lệ và báo dòng lỗi. Tạo 10 câu mẫu tự soạn."

## B5. Tạo đề và làm bài
"Làm tạo đề (chọn tay hoặc ngẫu nhiên theo part, chủ đề, mức độ) và màn hình làm bài: đếm giờ phía máy chủ, tự lưu nháp mỗi vài giây, đánh dấu câu, nộp bài. Không trả đáp án đúng trước khi nộp. Test: nộp trùng, hết giờ, truy cập đề người khác."

## B6. Chấm điểm, kết quả và thống kê
"Chấm điểm ở backend, lưu attempts và answers. Làm trang kết quả, thống kê điểm yếu theo chủ đề bằng SQL (tỷ lệ đúng, xu hướng 5 lần gần nhất). Điểm quy đổi tuyến tính và ghi rõ là ước lượng. Test cách tính điểm và thống kê với dữ liệu cụ thể."

## B8. Gợi ý ôn tập
"Làm thuật toán theo luật: lấy chủ đề có tỷ lệ sai cao nhất, chọn câu chưa làm theo mức độ phù hợp, tạo bộ 10 câu. Làm màn hình gợi ý. Giải thích thuật toán từng bước, test với dữ liệu giả. Không gọi mô hình ngôn ngữ."

## B9. Thống kê giáo viên
"Làm trang thống kê: điểm trung bình theo chủ đề, câu hay sai nhất, học viên cần hỗ trợ. Chỉ giáo viên truy cập được. Thống kê toàn bộ học viên, không theo lớp."

## B11. Kiểm thử và bảo mật
"Rà soát toàn bộ API: quyền từng endpoint, lộ đáp án, injection, giới hạn tốc độ, lộ khóa, CORS, validate đầu vào. Liệt kê lỗi theo mức độ trong `/docs/SECURITY_REVIEW.md`. Tự sửa lỗi nghiêm trọng và cao. Bổ sung test luồng chính."

## B12. Triển khai
"Viết Dockerfile và hướng dẫn triển khai lên Vercel + Render, biến môi trường, migration khi deploy, sao lưu CSDL, checklist sau deploy. Không deploy thật."

## B13. Báo cáo
"Dựa trên code thật và `/docs`, viết bản nháp các chương trong `/report` theo cấu trúc đồ án phổ biến vì chưa có mẫu trường. Chỉ mô tả những gì có trong hệ thống, không bịa số liệu. Đánh dấu [CẦN SỐ LIỆU], [CHƯA TRIỂN KHAI], [CẦN TRÍCH DẪN]. Không tự tạo tài liệu tham khảo."

## B7. AI giải thích đáp án
Đã làm với Google Gemini. Prompt nằm ở `backend/prompts`.

## B10. Bộ đánh giá phần AI
Đã làm bằng các lệnh `npm run ai-eval:generate`, `ai-eval:export`, `ai-eval:score` trong `backend/`. Điểm rubric do người chấm tay.
