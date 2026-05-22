# 🩺 Suthie Care

> ระบบบริหารจัดการข้อมูลคลินิกและแบบประเมินสุขภาพแบบครบวงจร  
> พัฒนาด้วยสถาปัตยกรรม Client-Server ที่แยก Frontend และ Backend ออกจากกันอย่างชัดเจน

---

## 📁 โครงสร้างโปรเจกต์

```
suth-suthiecare/
├── app/                          # 🖥️ Frontend (React)
│   ├── src/
│   │   ├── components/           # UI Components ที่ใช้ซ้ำได้
│   │   │   ├── appointment/      #   ├─ Modal & ตารางนัดหมาย
│   │   │   ├── case/             #   ├─ รายละเอียดเคส, Export Excel, กราฟ PHQ
│   │   │   ├── dashboard/        #   ├─ Widget สถิติระบบ
│   │   │   ├── layout/           #   ├─ Layout หลัก
│   │   │   ├── Sidebar.jsx       #   ├─ เมนูด้านข้าง
│   │   │   └── Navbar.jsx        #   └─ แถบนำทาง
│   │   ├── pages/
│   │   │   ├── admin/            #   ├─ หน้า Admin (Dashboard, Forms, Cases, ...)
│   │   │   ├── assessment/       #   ├─ หน้ากรอกแบบประเมิน
│   │   │   ├── login/            #   ├─ หน้าเข้าสู่ระบบ
│   │   │   ├── result/           #   ├─ หน้าแสดงผลการประเมิน
│   │   │   └── sutlanding/       #   └─ หน้า Landing Page
│   │   ├── services/
│   │   │   ├── api.js            #   ├─ Axios instance & API functions
│   │   │   └── cache.js          #   └─ Client-side caching
│   │   └── App.js                # Routing & Protected Routes
│   └── package.json
│
├── server/                       # ⚙️ Backend (Express.js)
│   ├── config/
│   │   └── db.js                 #   └─ MySQL Connection Pool
│   ├── middleware/
│   │   └── authMiddleware.js     #   └─ JWT Token & Role Verification
│   ├── routes/
│   │   ├── authRoutes.js         #   ├─ เข้าสู่ระบบ / ยืนยันตัวตน
│   │   ├── formRoutes.js         #   ├─ จัดการฟอร์ม & คำตอบ
│   │   ├── caseRoutes.js         #   ├─ จัดการเคส, นัดหมาย, ประวัติ
│   │   ├── userRoutes.js         #   ├─ จัดการผู้ใช้
│   │   ├── roleRoutes.js         #   ├─ จัดการสิทธิ์
│   │   ├── clinicRoutes.js       #   ├─ จัดการคลินิก
│   │   ├── staffRoutes.js        #   ├─ จัดการเจ้าหน้าที่
│   │   ├── bannerRoutes.js       #   ├─ จัดการแบนเนอร์
│   │   └── dashboardRoutes.js    #   └─ ข้อมูลสถิติ Dashboard
│   ├── utils/
│   │   ├── encryption.js         #   ├─ AES-256-GCM เข้ารหัส/ถอดรหัสข้อมูล
│   │   ├── telegram.js           #   ├─ แจ้งเตือนผ่าน Telegram Bot
│   │   └── cache.js              #   └─ Server-side caching
│   ├── index.js                  # Entry point ของเซิร์ฟเวอร์
│   └── package.json
│
├── LICENSE                       # Apache License 2.0
└── README.md
```

---

## 💻 เทคโนโลยีที่ใช้ (Tech Stack)

### Frontend — `app/`

| หมวด | เทคโนโลยี |
|---|---|
| **Framework** | React 19 (Create React App) |
| **Routing** | React Router DOM v7 |
| **Animation** | Framer Motion |
| **UI Components** | SweetAlert2, React Icons, FontAwesome |
| **Data Viz** | Recharts |
| **Calendar** | FullCalendar, React Datepicker, React Calendar |
| **Drag & Drop** | dnd-kit (core, sortable, modifiers) |
| **Image Crop** | React Easy Crop |
| **Color Picker** | React Color |
| **Export** | ExcelJS, FileSaver |
| **API / Real-time** | Axios, Socket.io Client |
| **CAPTCHA** | hCaptcha |
| **Testing** | Jest, React Testing Library |

### Backend — `server/`

| หมวด | เทคโนโลยี |
|---|---|
| **Runtime** | Node.js |
| **Framework** | Express.js 5 |
| **Database** | MySQL (mysql2 — connection pool) |
| **Caching** | Redis (ioredis), Node-Cache |
| **Real-time** | Socket.io |
| **Auth** | JWT (jsonwebtoken), Bcrypt.js |
| **Encryption** | AES-256-GCM (crypto), HMAC-SHA256, CryptoJS |
| **Security** | CORS, Express Rate Limit, Helmet-style trust proxy |
| **Notification** | Telegram Bot API |
| **HTTP Client** | Axios |
| **Compression** | compression |

---

## 🛠 ฟีเจอร์หลัก

### 🌐 ส่วนสาธารณะ (Public)
- **Landing Page** — หน้าแรกของระบบพร้อมข้อมูลคลินิกและแบนเนอร์
- **แบบประเมินออนไลน์** — กรอกแบบประเมินสุขภาพผ่านลิงก์ที่เข้ารหัสอย่างปลอดภัย
- **ผลการประเมิน** — ดูผลลัพธ์หลังส่งแบบประเมินเสร็จ
- **ค้นหาประวัติ** — ค้นหาและตรวจสอบประวัติการประเมินของตนเอง

### 🔒 ส่วน Admin (ต้องเข้าสู่ระบบ)
- **Dashboard** — แดชบอร์ดสถิติภาพรวม พร้อม widget กราฟที่ปรับแต่งได้ (Recharts)
- **จัดการฟอร์ม** — สร้าง/แก้ไข/ทำซ้ำแบบประเมินด้วย Form Builder แบบ Drag & Drop
- **จัดการเคส** — ระบบติดตามเคสผู้ป่วยแบบต่อเนื่อง, บันทึกข้อมูล, ดูกราฟ PHQ, Export Excel
- **จัดการกลุ่มเสี่ยง** — ติดตามกรณีที่มีความเสี่ยง แยกดูเฉพาะเคสที่ต้องดูแลพิเศษ
- **นัดหมาย** — ระบบนัดหมายพร้อมปฏิทิน (FullCalendar) แสดงเป็นรายเดือน/รายสัปดาห์
- **จัดการผู้ใช้** — เพิ่ม/แก้ไข/ลบบัญชีผู้ใช้ในระบบ
- **Roles & Permissions** — กำหนดสิทธิ์การใช้งานตาม Role (Admin, Staff, ...)
- **จัดการคลินิก** — เพิ่ม/แก้ไข/จัดเรียงลำดับคลินิก
- **จัดการเจ้าหน้าที่** — บันทึกข้อมูลเจ้าหน้าที่ประจำคลินิก
- **จัดการแบนเนอร์** — อัปโหลดรูปแบนเนอร์ หน้า Landing พร้อม Drag & Drop จัดเรียงลำดับ
- **Template บันทึกข้อมูล** — สร้าง/แก้ไข template สำหรับบันทึกข้อมูลตามประเภทคลินิก

### 🔐 ระบบความปลอดภัย
- **การเข้ารหัสข้อมูล** — ข้อมูลส่วนบุคคลเข้ารหัสด้วย AES-256-GCM พร้อม HMAC สำหรับค้นหา
- **การปกปิดข้อมูล** — ระบบ masking ชื่อ, เบอร์โทร, เลขบัตรประชาชน
- **ตรวจสอบข้อมูลไทย** — Validate เลขบัตรประชาชน 13 หลัก และเบอร์โทรศัพท์ไทย
- **JWT Authentication** — ยืนยันตัวตนด้วย Token พร้อม Session Sync ข้ามแท็บ
- **Rate Limiting** — ป้องกัน Brute-force และ DDoS
- **CAPTCHA** — ป้องกัน Bot ด้วย hCaptcha
- **แจ้งเตือนผ่าน Telegram** — แจ้งเตือนเหตุผิดปกติหรือข้อมูลสำคัญผ่าน Telegram Bot

---

## 🚀 การติดตั้งและเปิดใช้งาน

### ข้อกำหนดเบื้องต้น (Prerequisites)

- **Node.js** >= 18
- **MySQL** (ฐานข้อมูลที่สร้างไว้แล้ว)
- **Redis** (ไม่บังคับ แต่แนะนำสำหรับ caching)

### 1. Clone โปรเจกต์

```bash
git clone https://github.com/pathompuam/suth-suthiecare.git
cd suth-suthiecare
```

### 2. ตั้งค่า Backend

```bash
cd server
npm install
```

สร้างไฟล์ `.env` ในโฟลเดอร์ `server/`:

```env
# Database
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# Auth
JWT_SECRET=your_jwt_secret_key

# Encryption
AES_KEY=your_64_char_hex_key_here
AES_SEARCH_KEY=your_search_key_min_32_chars

# Telegram Notification
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Server
PORT=5000
```

เริ่มต้นเซิร์ฟเวอร์:

```bash
node index.js
# 🚀 Server started on port 5000
```

### 3. ตั้งค่า Frontend

```bash
cd app
npm install
```

สร้างไฟล์ `.env` ในโฟลเดอร์ `app/`:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

เริ่มต้นแอป:

```bash
npm start
# เปิดเบราว์เซอร์ที่ http://localhost:3000
```

---

## 🗂️ API Routes

| Prefix | Route File | คำอธิบาย |
|---|---|---|
| `/api` | `authRoutes.js` | เข้าสู่ระบบ, ยืนยัน Token |
| `/api` | `formRoutes.js` | CRUD ฟอร์ม, ส่งคำตอบ, ดูผลลัพธ์ |
| `/api` | `caseRoutes.js` | จัดการเคส, นัดหมาย, บันทึกประวัติ |
| `/api` | `userRoutes.js` | CRUD ผู้ใช้ |
| `/api` | `roleRoutes.js` | CRUD Role & Permissions |
| `/api` | `bannerRoutes.js` | CRUD แบนเนอร์ |
| `/api` | `dashboardRoutes.js` | สถิติ, กราฟ, Dashboard settings |
| `/api/clinics` | `clinicRoutes.js` | CRUD คลินิก |
| `/api/staffs` | `staffRoutes.js` | CRUD เจ้าหน้าที่ |

---

## 📄 License

โปรเจกต์นี้อยู่ภายใต้สัญญาอนุญาต **Apache License 2.0** — ดูรายละเอียดที่ไฟล์ [LICENSE](./LICENSE)