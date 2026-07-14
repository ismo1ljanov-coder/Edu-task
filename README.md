# EduTask MVP

O'zbekistondagi o'quv markazlari uchun uy vazifalarini boshqaruvchi EdTech platforma.

**Asosiy jarayon:** O'qituvchi → Vazifa yaratadi → O'quvchi bajaradi (So'zdon orqali) → Administrator nazorat qiladi.

## Texnologiyalar

| Qism | Texnologiya |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (access + refresh), bcrypt password hashing |
| API docs | Swagger / OpenAPI (`/api/docs`) |

## Loyiha tuzilishi

```
edutask/
├── backend/     # Express + TypeScript + Prisma REST API
└── frontend/    # React + TypeScript + Vite + Tailwind SPA
```

## Ishga tushirish

### 1. Talablar

- Node.js 18+
- PostgreSQL 14+ (mahalliy yoki bulutda — Railway, Supabase, Neon va h.k.)

### 2. Backend

```bash
cd backend
cp .env.example .env
# .env faylida DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET qiymatlarini o'zgartiring

npm install
npm run prisma:migrate     # migration yaratadi va bazaga qo'llaydi
npm run prisma:seed        # demo Super Admin / Filial Admin / O'qituvchi / O'quvchi yaratadi
npm run dev                 # http://localhost:4000
```

Swagger hujjati: **http://localhost:4000/api/docs**

Demo login ma'lumotlari (`npm run prisma:seed` dan keyin):

| Rol | Telefon | Parol |
|---|---|---|
| Super Admin | +998900000001 | Password123! |
| Filial Admin | +998900000002 | Password123! |
| O'qituvchi | +998900000003 | Password123! |
| O'quvchi | +998900000004 | Password123! |

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_BASE_URL backend manzilingizga mos kelishini tekshiring
# VITE_SOZDON_URL — So'zdon (sozdon.uz) manzili, kerak bo'lsa o'zgartiring

npm install
npm run dev                 # http://localhost:5173
```

### 4. Production build

```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build   # dist/ papkasini istalgan static hosting'ga joylang
```

## So'zdon (Word-Box-Game) integratsiyasi

O'quvchi homework sahifasidagi **"So'zdon orqali bajarish"** tugmasi:

1. Backend'dagi mock `/api/sozdon/start` endpointiga so'rov yuboradi (session yozuvi uchun, hozircha placeholder javob qaytaradi).
2. Keyin haqiqiy **sozdon.uz** saytini yangi tabda ochadi, `?homeworkId=...` parametri bilan.

So'zdon tomonida haqiqiy API tayyor bo'lganda, quyidagi fayllarni yangilash kifoya:

- `backend/src/routes/sozdon.routes.ts` — mock javoblarni haqiqiy So'zdon API chaqiruvlariga almashtiring.
- `frontend/src/pages/student/StudentHomeworkPage.tsx` — kerak bo'lsa `handleOpenSozdon` funksiyasini yangilang (masalan, session token qo'shish).

## Rollar va ruxsatlar (RBAC)

| Rol | Asosiy imkoniyatlar |
|---|---|
| Super Admin | Filial yaratish/tahrirlash, Filial Admin tayinlash, statistika, PDF eksport |
| Filial Admin | O'qituvchi/o'quvchi qo'shish, guruh yaratish/boshqarish, to'lov holati, o'qituvchi faoliyati |
| O'qituvchi | Guruhlarni ko'rish, uy vazifasi yaratish (fayl yuklash bilan), vazifa statistikasi |
| O'quvchi | Dashboard (XP, streak, progress), vazifalar ro'yxati, So'zdon orqali bajarish |

## MVP chegarasi

Quyidagilar **qasddan** kiritilmagan: chat, video darslar, Zoom, AI, Telegram bot, SMS/Email, test tizimi, onlayn to'lov, attendance, CRM, accounting, marketing analytics, ko'p tillilik, dark mode.

## Xavfsizlik

- JWT access/refresh token
- bcrypt bilan parol hash
- Role Based Access Control (RBAC) — har bir endpoint rol bo'yicha himoyalangan
- express-validator bilan server-side validatsiya
- `xss` kutubxonasi bilan so'rov tanasini tozalash (XSS himoyasi)
- Prisma parametrlashtirilgan so'rovlari (SQL Injection himoyasi)
- `helmet`, `hpp`, CORS whitelist
- `express-rate-limit` — umumiy va login uchun alohida chegaralar

## Muhim eslatma

Bu — **MVP darajasidagi** boshlang'ich kod bazasi. Production'ga chiqarishdan oldin:

- Barcha `.env` sirlarini xavfsiz saqlang (Vault, Doppler va h.k.)
- Haqiqiy PostgreSQL bazasida `npm run prisma:migrate:deploy` orqali migratsiyalarni qo'llang
- CSRF himoyasi uchun (agar cookie-based sessiyalarga o'tsangiz) `csurf` yoki SameSite cookie siyosatini qo'shing — hozirgi JWT Bearer arxitekturasida CSRF xavfi tabiiy ravishda past
- Fayl yuklash uchun S3/GCS kabi tashqi storage'ga o'tishni ko'rib chiqing (hozir vaqtinchalik memory storage)
