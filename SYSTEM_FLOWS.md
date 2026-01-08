# Tài liệu Luồng Nghiệp vụ Hệ thống UniFlow

Tài liệu này giải thích cách các tính năng hoạt động và cách dữ liệu di chuyển trong ứng dụng.

## 1. Luồng Xác thực (Authentication Flow)
- **Bước 1**: Người dùng nhập Email/Password.
- **Bước 2**: Frontend gửi yêu cầu đến Backend (`/api/auth/login`).
- **Bước 3**: Backend kiểm tra thông tin, nếu đúng sẽ trả về **JWT Token** và thông tin User.
- **Bước 4**: Frontend lưu Token vào `localStorage` và chuyển hướng vào Dashboard.
- **Bước 5**: Các yêu cầu API sau đó sẽ đính kèm Token này ở Header để xác thực.

## 2. Luồng Quét Thời khóa biểu bằng AI (AI Timetable Scan Flow)
Đây là tính năng "đinh" của ứng dụng:
- **Bước 1**: Người dùng tải ảnh chụp màn hình TKB lên.
- **Bước 2**: Frontend chuyển ảnh sang Base64 và gọi trực tiếp **Google Gemini API**.
- **Bước 3**: Gemini phân tích ảnh và trả về mảng JSON chứa các môn học (Title, Day, Period, Room...).
- **Bước 4**: Frontend hiển thị dữ liệu đã trích xuất để người dùng kiểm tra lại.
- **Bước 5**: Khi người dùng nhấn "Lưu", Frontend gọi API `POST /api/events` để lưu hàng loạt môn học vào Database.

## 3. Luồng Quản lý Nhiệm vụ & Deadline (Task Flow)
- **Bước 1**: Người dùng tạo nhiệm vụ, có thể chọn liên kết với một Môn học cụ thể.
- **Bước 2**: Dữ liệu lưu vào DB.
- **Bước 3**: Dashboard sẽ tự động tính toán:
    - Nhiệm vụ nào sắp đến hạn (trong 48h) -> Đưa vào mục "Cảnh báo khẩn cấp".
    - Tỷ lệ hoàn thành nhiệm vụ -> Vẽ biểu đồ Pie Chart.
- **Bước 4**: Khi người dùng tích chọn "Hoàn thành", trạng thái được cập nhật ngay lập tức trên Server.

## 4. Luồng Ghi chú Bài học (Smart Notes Flow)
- **Bước 1**: Trong tab Notes, người dùng chọn một môn học từ danh sách TKB hiện có.
- **Bước 2**: Hệ thống tải nội dung ghi chú cũ (nếu có) từ API.
- **Bước 3**: Người dùng soạn thảo (hỗ trợ Markdown).
- **Bước 4**: Khi nhấn "Save", nội dung được gửi lên Server kèm theo `eventId` để định danh ghi chú này thuộc môn học nào.

## 5. Luồng Thống kê (Statistics Flow)
- **Bước 1**: Backend định kỳ (hoặc khi được gọi) sẽ tính toán tổng số giờ học dựa trên TKB.
- **Bước 2**: Tổng hợp số nhiệm vụ theo trạng thái (Todo/Done).
- **Bước 3**: Trả về một object tổng hợp dữ liệu cho Dashboard để vẽ biểu đồ Recharts.
