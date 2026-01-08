
# Yêu cầu Kỹ thuật Chi tiết cho Backend (Real-world Project)

Để UniFlow vận hành ổn định và bảo mật trong thực tế, Backend cần đáp ứng các tiêu chuẩn sau:

## 1. Kiến trúc & Công nghệ
- **Ngôn ngữ**: Node.js (Express hoặc NestJS) hoặc Python (FastAPI).
- **Database**: MongoDB (Sử dụng Mongoose để quản lý Schema).
- **Xác thực**: Passport.js hoặc thư viện JWT tương đương.

## 2. Yêu cầu chi tiết cho từng Module

### A. Module Bảo mật (Security)
- **Mã hóa mật khẩu**: Bắt buộc dùng `bcrypt` để hash mật khẩu trước khi lưu vào DB (không lưu text thuần).
- **JWT**: Token phải có thời gian hết hạn (ví dụ: 7 ngày). Triển khai Refresh Token nếu cần bảo mật cao hơn.
- **CORS**: Chỉ cho phép tên miền của Frontend truy cập API.

### B. Module Thời khóa biểu (Events)
- **Validation**: Kiểm tra dữ liệu đầu vào (Ví dụ: `startTime` phải nhỏ hơn `endTime`).
- **Xử lý trùng lịch**: Backend nên có logic kiểm tra nếu người dùng thêm một tiết học mới trùng khung giờ với tiết học đã có thì phải trả về lỗi 400.
- **Trích xuất dữ liệu**: Hỗ trợ trả về dữ liệu theo tuần (truy vấn theo `dayOfWeek`).

### C. Module Nhiệm vụ (Tasks)
- **Quản lý trạng thái**: Hỗ trợ CRUD các nhiệm vụ.
- **Sorting**: API lấy danh sách nhiệm vụ phải hỗ trợ sắp xếp theo `priority` (cao -> thấp) và `dueDate`.

### D. Module Nhắc nhở (Worker/Cron Jobs)
- **Hẹn giờ thông báo**: Backend cần chạy một tiến trình ngầm (dùng `node-cron` hoặc `BullMQ`).
- **Logic**: Quét các Task hoặc Event sắp diễn ra trong 15-30 phút tới và gửi thông báo (Push Notification qua Firebase hoặc gửi Email qua SendGrid).

### E. Module Dashboard Analytics
- **Aggregation**: Sử dụng `Aggregate` của MongoDB để tính toán dữ liệu thống kê (ví dụ: `$group` theo ngày để tính tổng giờ học). Đừng lấy toàn bộ dữ liệu về Frontend rồi mới tính, sẽ rất chậm nếu dữ liệu lớn.

## 3. Quản lý Lỗi & Log
- **Error Handling**: Trả về mã lỗi chuẩn RESTful (400: Bad Request, 401: Unauthorized, 403: Forbidden, 404: Not Found, 500: Server Error).
- **Logging**: Sử dụng `Winston` hoặc `Morgan` để ghi lại lịch sử các request và lỗi để dễ dàng debug.

## 4. Tài liệu hóa (Documentation)
- Bắt buộc có **Swagger** (OpenAPI) để Frontend có thể xem danh sách API và test trực tiếp mà không cần hỏi Backend.

---
*Lưu ý: Hệ thống hiện tại không sử dụng tính năng upload ảnh trực tiếp để tối ưu hóa tài nguyên server.*
