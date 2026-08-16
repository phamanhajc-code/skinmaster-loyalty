# Skinmaster Loyalty

Hệ thống quản lý Thẻ thành viên & Chương trình Giới thiệu khách hàng cho Skinmaster Medical and Academy — dựng theo đặc tả `Skinmaster_Loyalty_Dac_Ta_Chi_Tiet.docx` và 2 prototype `admin.html` / `user.html`.

## Kiến trúc

- **backend/** — NestJS + Prisma + PostgreSQL. REST API tại `/api`, JWT auth (OTP cho khách hàng, email/mật khẩu + RBAC 2 cấp cho admin), cron job hết hạn voucher hằng ngày.
- **frontend/** — Next.js (App Router). Hai khu vực: cổng thành viên (`/login`, `/home`, `/referral`, `/vouchers`, `/history`) và cổng quản trị (`/admin/*`), dựng lại đúng thiết kế đen-trắng-ghi xám từ 2 prototype nhưng nối API thật.

## Chạy local

### 1. Backend

```bash
cd backend
cp .env.example .env   # rồi chỉnh DATABASE_URL cho đúng máy bạn
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev       # http://localhost:3001/api
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev              # http://localhost:3000
```

## Tài khoản demo (sau khi seed)

- **Admin (toàn quyền):** `admin@skinmaster.edu.vn` / `Admin@123`
- **Admin (vận hành):** `cskh@skinmaster.edu.vn` / `Operator@123`
- **Khách hàng (OTP):** SĐT `0912345678` — ở dev, mã OTP được in ra log server backend (`OTP_PROVIDER=console`), chưa nối SMS/Zalo ZNS thật.

## Ghi chú triển khai thật

- OTP hiện dùng provider giả lập (`ConsoleOtpProvider`) — cắm nhà cung cấp SMS Brandname/Zalo ZNS thật vào `backend/src/auth/otp/otp-provider.interface.ts`.
- Cần cấu hình `JWT_SECRET` ngẫu nhiên, mạnh khi lên production — giá trị trong `.env` chỉ dùng cho dev.
