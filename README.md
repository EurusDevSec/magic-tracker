# 📊 ETI Tracker & Gratitude Journal

Ứng dụng theo dõi tiến độ báo cáo công việc hàng ngày và nhật ký thực hành 28 ngày biết ơn (The Magic) dành cho thực tập sinh ETI. Được phát triển bằng **Next.js App Router (Turbopack)**, **Tailwind CSS** và **Supabase**.

---

## 🚀 Hướng dẫn khởi động nhanh (Dành cho Teammate)

Dự án hỗ trợ **chế độ Mock Offline tự động**. Bạn **không cần** xin quyền cơ sở dữ liệu Supabase hay tạo file cấu hình `.env` vẫn có thể chạy và phát triển tính năng bình thường.

### Bước 1: Tải mã nguồn về máy
```bash
git clone <url-repository>
cd Report_intern
```

### Bước 2: Cài đặt các thư viện phụ thuộc
```bash
npm install
```

### Bước 3: Chạy server phát triển cục bộ
```bash
npm run dev
```

Mở trình duyệt truy cập vào [http://localhost:3000](http://localhost:3000) để trải nghiệm.

---

## 💡 Chế độ Mock Offline (Phát triển không cần cấu hình)

Khi ứng dụng phát hiện thiếu biến môi trường cấu hình Supabase (URL/Key), nó sẽ tự động kích hoạt chế độ **Giả lập Ngoại tuyến** và lưu trữ dữ liệu trực tiếp trong `localStorage` trên trình duyệt của bạn.

### 🔑 Các tài khoản mẫu dùng thử có sẵn:
Bạn có thể đăng nhập ngay lập tức bằng các thông tin tài khoản mẫu dưới đây:

*   **Tài khoản Thành viên (Intern) để test nộp báo cáo, thực hành biết ơn**:
    *   **Email**: `tiendv@company.com`
    *   **Mật khẩu**: `password123`
*   **Tài khoản Quản trị (Admin) để test xem tổng quan biểu đồ, bảng tin**:
    *   **Email**: `admin@eurus.dev`
    *   **Mật khẩu**: `password123`

*(Hệ thống đã tự động tạo sẵn dữ liệu báo cáo trong 7 ngày gần nhất cho các thành viên để các biểu đồ hiển thị sống động nhất).*

---

## ⚙️ Cấu hình Production (Kết nối Supabase thật)

Khi cần kết nối với hệ thống cơ sở dữ liệu Supabase thật (hoặc khi đưa lên môi trường Production như Vercel/VPS), bạn tạo tệp `.env.local` ở thư mục gốc của dự án và khai báo các khóa sau:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

*Hệ thống sẽ tự động tắt chế độ Mock và chuyển đổi liền mạch sang cơ sở dữ liệu Supabase thật mà không cần sửa đổi bất kỳ dòng mã nguồn nào.*

---

## 🛠️ Công nghệ sử dụng
- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS
- **Database/Auth (Production)**: Supabase
- **Charts**: Recharts (Modern gradients, rounded corners)
- **Icons**: Lucide React