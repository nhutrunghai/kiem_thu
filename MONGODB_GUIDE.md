
# Hướng dẫn Thiết kế Cơ sở dữ liệu MongoDB - UniFlow

Tài liệu này hướng dẫn cách cấu trúc dữ liệu cho UniFlow bằng **MongoDB**. Vì MongoDB là NoSQL, chúng ta sẽ quản lý dữ liệu dưới dạng các **Collections** chứa các tài liệu **JSON (BSON)**.

## 1. Cấu trúc các Collections

Hệ thống UniFlow sẽ bao gồm 4 Collections chính:
1. `users`: Quản lý thông tin tài khoản.
2. `events`: Quản lý thời khóa biểu (lịch học/thi).
3. `tasks`: Quản lý bài tập và nhiệm vụ.
4. `notes`: Quản lý ghi chú nội dung bài học.

---

## 2. Chi tiết định dạng dữ liệu (Schema)

### 2.1. Collection: `users`
Lưu trữ thông tin định danh và cá nhân của sinh viên.

```json
{
  "_id": "ObjectId", 
  "email": "string (unique)",
  "password": "string (hashed)",
  "fullName": "string",
  "major": "string",
  "avatar": "string (Lưu URL ảnh mặc định được chọn từ hệ thống)",
  "settings": {
    "language": "string (en|vi)",
    "darkMode": "boolean"
  },
  "createdAt": "date"
}
```

### 2.2. Collection: `events`
Lưu trữ các tiết học trong thời khóa biểu. 

*Lưu ý: `userId` dùng để liên kết với collection `users`.*

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (Reference users)",
  "title": "string",
  "code": "string",
  "instructor": "string",
  "room": "string",
  "link": "string (nếu là học online)",
  "type": "string (REGULAR | ONLINE | EXAM)",
  "dayOfWeek": "number (0: CN, 1: T2, ..., 6: T7)",
  "startTime": "string (HH:mm)",
  "endTime": "string (HH:mm)",
  "startDate": "date",
  "endDate": "date",
  "color": "string (hex code)",
  "notes": "string",
  "reminderMinutes": "number",
  "createdAt": "date"
}
```

### 2.3. Collection: `tasks`
Quản lý các bài tập, nhiệm vụ cần làm.

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (Reference users)",
  "relatedEventId": "ObjectId (Optional - Reference events)",
  "title": "string",
  "description": "string",
  "dueDate": "date",
  "status": "string (TODO | IN_PROGRESS | COMPLETED)",
  "priority": "string (low | medium | high)",
  "createdAt": "date"
}
```

### 2.4. Collection: `notes`
Lưu trữ nội dung ghi chú cho từng môn học.

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (Reference users)",
  "eventId": "ObjectId (Reference events)",
  "content": "string (Markdown or Rich Text)",
  "updatedAt": "date"
}
```

---

## 3. Gợi ý đánh Index (Indexing) để tăng tốc độ

Để ứng dụng chạy nhanh, bạn nên tạo các Index sau trong MongoDB:

- **Users**: `db.users.createIndex({ "email": 1 }, { unique: true })`
- **Events**: `db.events.createIndex({ "userId": 1, "dayOfWeek": 1 })`
- **Tasks**: `db.tasks.createIndex({ "userId": 1, "dueDate": 1 })`
- **Notes**: `db.notes.createIndex({ "userId": 1, "eventId": 1 })`

---

## 4. Công cụ kết nối gợi ý (Backend)

Nếu bạn dùng **Node.js**, tôi khuyên bạn nên dùng thư viện **Mongoose**. Mongoose giúp bạn định nghĩa các Schema này trong code một cách chặt chẽ:

```javascript
// Ví dụ Mongoose Schema cho User
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: String,
  major: String,
  avatar: String // Chỉ lưu URL ảnh từ bộ chọn có sẵn
});
```

---
*Tài liệu này loại bỏ phần xử lý file attachments để tối giản hóa yêu cầu Backend.*
