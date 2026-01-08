# Tài liệu Hướng dẫn API - UniFlow AI Features

Tài liệu này liệt kê các chức năng trong ứng dụng UniFlow yêu cầu kết nối với **Google Gemini API**.

## 1. Chức năng chính: Quét Thời Khóa Biểu bằng AI (AI Timetable Scanner)

Đây là tính năng quan trọng nhất sử dụng trí tuệ nhân tạo để xử lý hình ảnh phức tạp.

- **Vị trí**: Tab "Thời khóa biểu" (Timetable) -> Nút "Quét ảnh TKB".
- **Model sử dụng**: `gemini-3-flash-preview` (Tối ưu cho tốc độ và khả năng đọc văn bản trong ảnh).
- **Cơ chế hoạt động**:
    1. **Nhận diện hình ảnh**: AI thực hiện OCR (Nhận dạng ký tự quang học) trên ảnh chụp màn hình TKB từ cổng thông tin sinh viên.
    2. **Phân tích ngữ cảnh**: AI không chỉ đọc chữ mà còn hiểu cấu trúc bảng (Thứ mấy, Buổi sáng/chiều, Mã môn học).
    3. **Trích xuất dữ liệu**: Chuyển đổi thông tin từ ảnh thành định dạng JSON chuẩn.
    4. **Quy đổi thời gian**: Tự động bóc tách số "Tiết học" (ví dụ: 1-3, 4-5) và đối chiếu với bảng giờ học của Việt Nam để điền chính xác giờ bắt đầu/kết thúc.

## 2. Thông tin kỹ thuật (Technical Details)

### API Key
- **Nguồn**: Lấy từ biến môi trường `process.env.API_KEY`.
- **Nơi lấy key**: [Google AI Studio](https://aistudio.google.com/).
- **Cấu hình**: Ứng dụng đã được thiết lập để sử dụng Key này một cách an toàn, không để lộ trong mã nguồn công khai.

### Cấu hình AI Prompt (System Instruction)
Ứng dụng sử dụng một "System Instruction" chuyên biệt để hướng dẫn AI:
- Chỉ tập trung vào dữ liệu học thuật.
- Hiểu các thuật ngữ viết tắt tiếng Việt như: LT (Lý thuyết), TH (Thực hành), TKB (Thời khóa biểu).
- Định dạng đầu ra bắt buộc là mảng JSON để ứng dụng có thể hiển thị ngay lập tức lên lịch.

## 3. Các chức năng dự kiến (Upcoming AI Features)

Dưới đây là các chức năng có thể mở rộng sử dụng API trong tương lai:
- **Smart Note Summary**: Tóm tắt nội dung ghi chú bài học dài thành các ý chính bằng AI.
- **Assignment Helper**: Phân tích đề bài từ ảnh chụp bài tập và gợi ý các bước giải quyết.
- **Study Plan AI**: Dựa trên lịch học hiện tại để gợi ý khung giờ tự học tối ưu.

## 4. Lưu ý quan trọng
- **Bảo mật**: API Key được quản lý tự động. Bạn không cần dán Key vào code.
- **Quyền riêng tư**: Hình ảnh tải lên chỉ được gửi đến Google Gemini để xử lý trích xuất văn bản và không được lưu trữ vĩnh viễn trên máy chủ của ứng dụng.
- **Hạn mức**: Sử dụng Gemini Flash trong hạn mức miễn phí (Free Tier) là đủ cho nhu cầu cá nhân của sinh viên.
