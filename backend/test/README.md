# Backend Unit Tests (Simplified Version)

Bộ test này tập trung vào các chức năng Đăng ký và Đăng nhập của backend UniFlow.

## Cài đặt

```bash
npm install
```

## Các lệnh chạy test

| Lệnh | Mô tả |
|------|-------|
| `npm run test:ci` | **Chạy test và hiển thị bảng Coverage** (Dành cho CI) |
| `npm test` | Chạy tất cả tests và tạo report coverage |
| `npm run test:unit` | Chỉ chạy unit tests (Controllers, Middleware, Utils) |
| `npm run test:integration` | Chỉ chạy integration tests (Routes) |
| `npm run test:watch` | Chạy test ở chế độ quan sát thay đổi |

## Cấu trúc thư mục

```
test/
├── setup.js                          # Cấu hình môi trường test
├── helpers/
│   └── mockData.js                   # Dữ liệu mock
├── controllers/
│   └── authController.test.js        # Test cho Register/Login/Me
├── middleware/
│   └── auth.test.js                  # Test cho JWT Validation
├── utils/
│   ├── validators.test.js            # Test cho email/objectId
│   └── auth.test.js                  # Test cho các hằng số auth
└── routes/
    └── authRoutes.test.js            # Integration tests cho API routes
```

## Các chức năng được kiểm tra

### 1. Đăng ký (Register)
- Thành công với thông tin hợp lệ.
- Chuẩn hóa email (lowercase, trim).
- Kiểm tra độ dài mật khẩu (min 8).
- Kiểm tra tên đầy đủ (required).
- Kiểm tra trùng lặp email.

### 2. Đăng nhập (Login)
- Thành công với email/mật khẩu đúng.
- Xử lý thông tin đăng nhập sai hoặc thiếu.
- Xử lý các lỗi server.

### 3. Xác thực (Authorization)
- Kiểm tra Token hợp lệ.
- Xử lý Token hết hạn hoặc sai định dạng.
- Trả về thông tin người dùng hiện tại (`/me`).

---
*Lưu ý: Các chức năng Quên mật khẩu và Reset mật khẩu không nằm trong phạm vi của bộ test này.*
