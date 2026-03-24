const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  me,
} = require("../../src/controllers/authController");
const User = require("../../src/models/User");
const {
  mockUser,
  validRegistrationData,
  validLoginData,
} = require("../helpers/mockData");

// Mock dependencies
jest.mock("../../src/models/User");
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
// Mocking mailer and crypto just in case they are used in imports or other functions
jest.mock("../../src/config/mailer", () => ({
  transporter: { sendMail: jest.fn() },
  isMailerReady: jest.fn().mockReturnValue(true),
}));
jest.mock("crypto", () => ({
  randomBytes: jest
    .fn()
    .mockReturnValue({ toString: jest.fn().mockReturnValue("mocked-token") }),
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue("mocked-hash"),
  }),
}));

describe("Bộ điều khiển Auth - Đăng ký", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe("Đăng ký thành công", () => {
    it("nên đăng ký một người dùng mới thành công", async () => {
      req.body = { ...validRegistrationData };

      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashedPassword123");

      const savedUser = {
        _id: "user123",
        email: validRegistrationData.email.toLowerCase(),
        fullName: validRegistrationData.fullName,
        avatar: validRegistrationData.avatar,
        notificationChannels: ["EMAIL"],
        save: jest.fn().mockResolvedValue(true),
      };

      User.mockImplementation(() => savedUser);
      jwt.sign.mockReturnValue("mock-jwt-token");

      await register(req, res);

      expect(User.findOne).toHaveBeenCalledWith({
        email: validRegistrationData.email.toLowerCase(),
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(
        validRegistrationData.password,
        10,
      );
      expect(savedUser.save).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: savedUser._id },
        expect.any(String),
        { expiresIn: "7d" },
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        token: "mock-jwt-token",
        user: {
          id: savedUser._id,
          email: savedUser.email,
          fullName: savedUser.fullName,
          avatar: savedUser.avatar,
          notificationChannels: savedUser.notificationChannels,
        },
      });
    });

    it("nên chuẩn hóa email thành chữ thường", async () => {
      req.body = {
        email: "TEST@EXAMPLE.COM",
        password: "SecurePass123",
        fullName: "Test User",
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashedPassword");

      const savedUser = {
        _id: "user123",
        email: "test@example.com",
        fullName: "Test User",
        notificationChannels: ["EMAIL"],
        save: jest.fn().mockResolvedValue(true),
      };

      User.mockImplementation(() => savedUser);
      jwt.sign.mockReturnValue("token");

      await register(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
    });

    it("nên cắt khoảng trắng fullName", async () => {
      req.body = {
        email: "test@example.com",
        password: "SecurePass123",
        fullName: "  Test User  ",
      };

      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashedPassword");

      const savedUser = {
        _id: "user123",
        email: "test@example.com",
        fullName: "Test User",
        notificationChannels: ["EMAIL"],
        save: jest.fn().mockResolvedValue(true),
      };

      User.mockImplementation((data) => {
        expect(data.fullName).toBe("Test User");
        return savedUser;
      });
      jwt.sign.mockReturnValue("token");

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });
  });
  describe("Validation nâng cao", () => {
    it("nên trả về 400 nếu fullName chỉ chứa khoảng trắng", async () => {
      req.body = {
        email: "test@example.com",
        password: "SecurePass123",
        fullName: "     ", // Chỉ có khoảng trắng
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      // Tùy vào thông báo lỗi bạn set trong controller
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringMatching(/full name/i),
        }),
      );
    });

    it("nên trả về 400 nếu email thiếu ký tự @ hoặc domain", async () => {
      req.body = {
        email: "testexample.com", // Thiếu @
        password: "SecurePass123",
        fullName: "Test User",
      };

      await register(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
  describe("Lỗi khi lưu người dùng", () => {
    it("nên trả về 500 nếu phương thức save() thất bại", async () => {
      req.body = { ...validRegistrationData };

      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashedPassword");

      const savedUser = {
        save: jest.fn().mockRejectedValue(new Error("Save failed")),
      };
      User.mockImplementation(() => savedUser);

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
    });
  });
  describe("Lỗi kiểm tra dữ liệu", () => {
    it("nên trả về 400 nếu email không hợp lệ", async () => {
      req.body = {
        email: "invalid-email",
        password: "SecurePass123",
        fullName: "Test User",
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid email" });
    });

    it("nên trả về 400 nếu mật khẩu quá ngắn", async () => {
      req.body = {
        email: "test@example.com",
        password: "short",
        fullName: "Test User",
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Password must be at least 8 characters",
      });
    });

    it("nên trả về 400 nếu thiếu fullName", async () => {
      req.body = {
        email: "test@example.com",
        password: "SecurePass123",
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Full name is required",
      });
    });
  });

  describe("Người dùng đã tồn tại", () => {
    it("nên trả về 400 nếu người dùng đã tồn tại", async () => {
      req.body = { ...validRegistrationData };

      User.findOne.mockResolvedValue(mockUser);

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "User already exists" });
    });
  });

  describe("Lỗi máy chủ", () => {
    it("nên trả về 500 khi cơ sở dữ liệu lỗi", async () => {
      req.body = { ...validRegistrationData };

      User.findOne.mockRejectedValue(new Error("Database error"));

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
    });
  });
});

describe("2. Chức năng Đăng nhập (Login) - Kiểm thử chi tiết", () => {
  let req, res; // Khai báo biến ở đây để các hàm it bên dưới đều dùng được

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe("Trường hợp thành công", () => {
    it("TC-LI-01: nên đăng nhập thành công với Email và Password đúng", async () => {
      req.body = { ...validLoginData };
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("mock-token");

      await login(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ token: "mock-token" }),
      );
    });

    it("TC-LI-02: nên đăng nhập thành công khi Email nhập chữ HOA (hệ thống tự chuyển thường)", async () => {
      req.body = { email: "AN@GMAIL.COM", password: "Password123" };
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      await login(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ email: "an@gmail.com" });
    });
  });

  describe("Trường hợp thất bại do dữ liệu nhập (Validation)", () => {
    it("TC-LI-03: nên trả về 400 nếu để trống Email", async () => {
      req.body = { email: "", password: "Password123" };
      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("TC-LI-04: nên trả về 400 nếu để trống Mật khẩu", async () => {
      req.body = { email: "an@gmail.com", password: "" };
      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("TC-LI-05: nên trả về 400 nếu Email sai định dạng (thiếu @)", async () => {
      req.body = { email: "an-sai-dinh-dang", password: "Password123" };
      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
    });
  });

  describe("Trường hợp thất bại do Sai lệch thông tin", () => {
    it("TC-LI-06: nên trả về 400 khi Email không tồn tại trong hệ thống", async () => {
      req.body = { email: "chuadangky@gmail.com", password: "Password123" };
      User.findOne.mockResolvedValue(null);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
    });

    it("TC-LI-07: nên trả về 400 khi Mật khẩu nhập sai", async () => {
      req.body = { email: "an@gmail.com", password: "SaiMatKhau123" };
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid credentials" });
    });
  });

  describe("Trường hợp lỗi hệ thống và bảo mật", () => {
    it("TC-LI-08: nên trả về 500 khi kết nối Database bị ngắt quãng", async () => {
      req.body = { ...validLoginData };
      User.findOne.mockRejectedValue(new Error("Mất kết nối DB"));

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
    });

    it("TC-LI-09: nên trả về 500 khi lỗi tạo Token JWT", async () => {
      req.body = { ...validLoginData };
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockImplementation(() => {
        throw new Error("JWT Error");
      });

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("TC-LI-10: không nên trả về Password của user trong phản hồi JSON", async () => {
      req.body = { ...validLoginData };
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      await login(req, res);

      // Lấy dữ liệu phản hồi từ lần gọi res.json đầu tiên
      const responseData = res.json.mock.calls[0][0];

      // Kiểm tra an toàn: Nếu có object user thì password phải undefined
      if (responseData && responseData.user) {
        expect(responseData.user.password).toBeUndefined();
      } else {
        // Nếu không có object user, kiểm tra xem password có nằm ngoài cùng không
        expect(responseData.password).toBeUndefined();
      }
    });
  });
});

describe("Bộ điều khiển Auth - Thông tin cá nhân", () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: null,
    };
    res = {
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it("nên trả về thông tin người dùng hiện tại", async () => {
    req.user = mockUser;

    await me(req, res);

    expect(res.json).toHaveBeenCalledWith({
      id: mockUser._id,
      email: mockUser.email,
      fullName: mockUser.fullName,
      avatar: mockUser.avatar,
      notificationChannels: mockUser.notificationChannels,
    });
  });
});

describe("Bộ điều khiển Auth - Quên mật khẩu ", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();

    // Mock crypto cho việc tạo token
    crypto.randomBytes.mockReturnValue({
      toString: jest.fn().mockReturnValue("mocked-token"),
    });
    crypto.createHash.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue("mocked-hash"),
    });
  });

  describe("1. Kiểm tra dữ liệu đầu vào & Bảo mật (Validation & Privacy)", () => {
    it("TC-FP-01: nên trả về thông báo chung khi để trống email (Bảo mật)", async () => {
      req.body = { email: "" };
      await forgotPassword(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("If the email exists"),
        }),
      );
    });

    it("TC-FP-02: nên trả về thông báo chung khi email sai định dạng", async () => {
      req.body = { email: "an-sai-dinh-dang" };
      await forgotPassword(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("If the email exists"),
        }),
      );
    });

    it("TC-FP-03: nên xử lý tốt email có khoảng trắng (trim)", async () => {
      req.body = { email: "  test@example.com  " };
      User.findOne.mockResolvedValue(null);
      await forgotPassword(req, res);
      expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
    });

    it("TC-FP-04: không nên tiết lộ email có tồn tại hay không", async () => {
      req.body = { email: "khongco@gmail.com" };
      User.findOne.mockResolvedValue(null);
      await forgotPassword(req, res);
      expect(res.json).toHaveBeenCalledWith({
        message: "If the email exists, you will receive a reset link shortly.",
      });
    });
  });

  describe("2. Luồng xử lý thành công (Success Flow)", () => {
    it("TC-FP-05: nên tạo hash token và thời gian hết hạn chính xác", async () => {
      req.body = { email: "test@example.com" };
      const user = { ...mockUser, save: jest.fn().mockResolvedValue(true) };
      User.findOne.mockResolvedValue(user);

      await forgotPassword(req, res);

      expect(user.resetTokenHash).toBe("mocked-hash");
      expect(user.resetTokenExpiresAt).toBeInstanceOf(Date);
    });

    it("TC-FP-06: nên lưu thời điểm yêu cầu reset (resetRequestedAt)", async () => {
      req.body = { email: "test@example.com" };
      const user = { ...mockUser, save: jest.fn().mockResolvedValue(true) };
      User.findOne.mockResolvedValue(user);

      await forgotPassword(req, res);

      expect(user.resetRequestedAt).toBeInstanceOf(Date);
    });

    it("TC-FP-07: nên gửi email chứa đường dẫn reset mật khẩu đúng định dạng", async () => {
      req.body = { email: "test@example.com" };
      User.findOne.mockResolvedValue({ ...mockUser, save: jest.fn() });

      await forgotPassword(req, res);

      const mailer = require("../../src/config/mailer");
      expect(mailer.transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "test@example.com",
          subject: "[UniFlow] Reset your password",
        }),
      );
    });
  });

  describe("3. Xử lý lỗi hệ thống (System Failures)", () => {
    it("TC-FP-08: nên trả về 500 nếu Database bị sập khi tìm User", async () => {
      req.body = { email: "test@example.com" };
      User.findOne.mockRejectedValue(new Error("DB Error"));

      await forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
    });

    it("TC-FP-09: nên trả về 500 nếu lỗi khi đang lưu token vào User", async () => {
      req.body = { email: "test@example.com" };
      const user = {
        ...mockUser,
        save: jest.fn().mockRejectedValue(new Error("Save Error")),
      };
      User.findOne.mockResolvedValue(user);

      await forgotPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("TC-FP-10: nên trả về 500 nếu dịch vụ Mailer chưa sẵn sàng", async () => {
      const mailer = require("../../src/config/mailer");
      mailer.isMailerReady.mockReturnValue(false);

      req.body = { email: "test@example.com" };
      User.findOne.mockResolvedValue(mockUser);

      await forgotPassword(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("TC-FP-11: nên xử lý an toàn khi quá trình gửi mail thực tế thất bại", async () => {
      req.body = { email: "test@example.com" };
      User.findOne.mockResolvedValue({ ...mockUser, save: jest.fn() });

      const mailer = require("../../src/config/mailer");
      mailer.transporter.sendMail.mockRejectedValue(new Error("SMTP Error"));

      await forgotPassword(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("If the email exists"),
        }),
      );
    });
  });
});

describe("Bộ điều khiển Auth - Đặt lại mật khẩu", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
    crypto.createHash.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue("mocked-hash"),
    });
  });

  it("nên trả về 400 khi thiếu token", async () => {
    req.body = { password: "NewPass123" };

    await resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid or expired reset token",
    });
  });

  it("nên trả về 400 cho mật khẩu quá ngắn", async () => {
    req.body = { token: "token", password: "short" };

    await resetPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Password must be at least 8 characters",
    });
  });

  it("nên trả về 400 khi không tìm thấy token", async () => {
    req.body = { token: "token", password: "NewPass123" };
    User.findOne.mockResolvedValue(null);

    await resetPassword(req, res);

    expect(User.findOne).toHaveBeenCalledWith({
      resetTokenHash: "mocked-hash",
      resetTokenExpiresAt: { $gt: expect.any(Date) },
    });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid or expired reset token",
    });
  });

  it("nên đặt lại mật khẩu thành công", async () => {
    req.body = { token: "token", password: "NewPass123" };
    const user = {
      _id: "user123",
      password: "old",
      resetTokenHash: "mocked-hash",
      resetTokenExpiresAt: new Date(Date.now() + 1000),
      resetRequestedAt: new Date(),
      resetUsedAt: null,
      save: jest.fn().mockResolvedValue(true),
    };
    User.findOne.mockResolvedValue(user);
    bcrypt.hash.mockResolvedValue("hashed-new-password");

    await resetPassword(req, res);

    expect(user.password).toBe("hashed-new-password");
    expect(user.resetTokenHash).toBeNull();
    expect(user.resetTokenExpiresAt).toBeNull();
    expect(user.resetRequestedAt).toBeNull();
    expect(user.resetUsedAt).toBeInstanceOf(Date);
    expect(user.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      message: "Password reset successful",
    });
  });
});