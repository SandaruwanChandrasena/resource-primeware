<div align="center">

# 📅 Resource Reservation Management System

**Book shared rooms, equipment and vehicles — with no double bookings.**

<br>

![Next.js](https://img.shields.io/badge/Next.js_16-App_Router-000000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7.10-2D3748?logo=prisma&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)

<br>

[🎬 **Demo video**](https://drive.google.com/file/d/1d930d1UAscOiKN15ULzrXxrrWMiNooWK/view?usp=drive_link)
&nbsp;·&nbsp;
[🗂️ **ER diagram**](https://drive.google.com/file/d/13wLU576ODD3AEtIN-_ZrpBCSP4KHazTq/view?usp=sharing)
&nbsp;·&nbsp;
[📁 **Shared Google Drive folder**](https://drive.google.com/drive/folders/1ASYh8nzYBCpyhTcFzv3vBHLu-BTy6gaD?usp=sharing)
&nbsp;·&nbsp;
[🚀 **Setup and run**](#setup)

</div>

<br>

---

## 📖 Table of contents

1. [The business problem](#problem)
2. [Features](#features)
3. [Tech stack and why](#stack)
4. [Setup and run (local)](#setup)
5. [Database design](#database)
6. [Key technical decisions](#decisions)
7. [API (testable in Postman)](#api)
8. [Project structure](#structure)
9. [Known limits and future improvements](#future)

<br>

---

<a id="problem"></a>

## 🧩 1. The business problem

An organization shares **rooms, equipment and vehicles** between many people and teams.

Bookings were made with **informal messages and manual records**. This caused:

- ❌ **Overlapping reservations** — two teams arrive for the same room.
- ❌ **Scheduling confusion** — nobody knows who booked what.
- ❌ **No clear view of availability** — people must ask around.

<br>

**This app gives one central place** to manage resources and reservations, and to see **usage** and **availability**.

> [!IMPORTANT]
> The most important rule — **no overlapping bookings** — is enforced by the **database itself**, so the app stays reliable as daily activity grows.

<br>

---

<a id="features"></a>

## ✨ 2. Features

### 👤 Member

- **Home page**
  - Cards: upcoming bookings, next booking, and "waiting for".
  - A **shared booking calendar** (month and week view, resource filter).

- **Resources page**
  - Search, type filter, sort, grid or list view, and photos.

- **Book a resource**
  - Form → **review page** → confirm.
  - A clear **clash message** if the time is taken (time and department only, **no names**).

- **"Notify me"**
  - On a clash, join a **waiting list**.
  - When the **whole** wanted time becomes free, you get a **bell notification** with a link to the filled-in booking form.

- **My bookings**
  - **Upcoming**, **Past** and **Cancelled** tabs.
  - Cancel your own future bookings.

- **Profile**
  - Your details, your own photo, and change password.

<br>

### 🛡️ Admin

- **Dashboard**
  - Summary cards and today's bookings.
  - **Most booked resources** chart (by booked **hours**).
  - **Most cancelled resources** chart (count, **cancel rate**, and member/admin split).

- **Calendar**
  - The same shared booking calendar.

- **Resources**
  - Add, edit, upload a photo, deactivate or activate.
  - Admins can also **book** a resource.

- **Bookings**
  - See **all** bookings, search and filter, and cancel any booking.
  - Cancelling someone else's booking needs a **reason**. The owner gets a bell notification with the reason.
  - **"Keep this time blocked for admin use"** (ticked by default): in **one transaction**, the booking is cancelled and the same time is booked in the admin's name, so the time is **never free** for others.

- **Users**
  - Add, edit, deactivate or activate accounts.
  - There is **no self-registration**.
  - An admin **can't deactivate themselves** or remove their own admin role.

<br>

---

<a id="stack"></a>

## 🛠️ 3. Tech stack and why

| Part | Choice | Why |
|---|---|---|
| **Framework** | Next.js 16 (App Router) + TypeScript | Required. Server Components for pages, Server Actions for forms. |
| **Database** | PostgreSQL 17 | Required. Supports **exclusion constraints** for the no-overlap rule. |
| **ORM** | Prisma 7.10.0 (+ `@prisma/adapter-pg`) | Type-safe queries and migrations. |
| **Validation** | Zod 4 | Every form and API input is checked on the server. |
| **Login** | bcryptjs + jose | Hashed passwords and an encrypted httpOnly session cookie. Small and simple; no extra auth service. |
| **Styling** | Tailwind CSS 4 | No UI library. Charts are plain CSS bars (no chart library). |

<br>

---

<a id="setup"></a>

## 🚀 4. Setup and run (local)

### ✅ Requirements

- **Node.js 22** and **npm**
- **PostgreSQL 17** running on your machine

<br>

### 🔧 Steps

**1. Install packages**

```bash
npm install
```

**2. Create the database**

In pgAdmin (or `psql`), create an empty database named **`resource_booking`**.

**3. Create the `.env` file**

Copy `.env.example` to `.env` and set your values:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/resource_booking"
SESSION_SECRET="a-long-random-string"
DEMO_DELAY_MS=0
```

Make a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**4. Create the tables** (runs all 4 migrations, including the overlap rule)

```bash
npx prisma migrate dev
```

**5. Generate the Prisma client** (Prisma 7 does not do this inside `migrate dev`)

```bash
npx prisma generate
```

**6. Add demo data**

```bash
npx prisma db seed
```

**7. Start the app**

```bash
npm run dev
```

Then open **http://localhost:3000** 🎉

<br>

### 🔑 Demo logins (from the seed)

| Role | Email | Password | Department |
|---|---|---|---|
| **Admin** | admin@primewave.lk | `Admin@123` | IT |
| **Member** | nimal@primewave.lk | `Member@123` | Marketing |
| **Member** | ayesha@primewave.lk | `Member@123` | Finance |
| **Member** | kasun@primewave.lk | `Member@123` | Engineering |

**Demo resources:** Meeting Room A, Board Room, Training Hall, Projector 1, Projector 2, Company Van.
They have no photos — upload them as admin.

<br>

### 💡 Good to know

- **`DEMO_DELAY_MS`**
  - A fake wait (in ms) in every button action, so loaders can be seen in the demo video.
  - It also waits between the code clash check and the database insert, so the **database overlap guard** can be shown with two browsers.
  - Set it to **0** for normal speed.

- **Photos**
  - Saved on disk in `uploads/` (created automatically, **not in git**).

- **Time zone**
  - Times are stored in **UTC** and shown in **Sri Lanka time** (Asia/Colombo).
  - The database connection always uses a UTC session, so the app works with **any** PostgreSQL time zone setting.

- **Booking settings** (in `lib/config/booking-settings.ts`)
  - 07:00 to 20:00, 30-minute steps, same-day bookings, up to 30 days ahead.

<br>

### ♻️ Reset to a clean start

> [!TIP]
> Close pgAdmin connections first, or the reset can hang.

```bash
npx prisma migrate reset
npx prisma db seed
```

On Windows PowerShell, also delete old photos and the Next.js cache:

```powershell
Remove-Item -Recurse -Force uploads
Remove-Item -Recurse -Force .next
```

<br>

---

<a id="database"></a>

## 🗂️ 5. Database design

### 📊 ER diagram

![ER diagram](docs/resource-reservation-er-diagram.png)

- 🖼️ **Picture:** [`docs/resource-reservation-er-diagram.png`](docs/resource-reservation-er-diagram.png)
- ✏️ **Editable draw.io file:** [`docs/resource-reservation-er-diagram.drawio`](docs/resource-reservation-er-diagram.drawio)
- 🖼️ **ER diagram picture (Google Drive, public):** [open the picture](https://drive.google.com/file/d/13wLU576ODD3AEtIN-_ZrpBCSP4KHazTq/view?usp=sharing)
- ✏️ **ER diagram draw.io file (Google Drive, public):** [open the file](https://drive.google.com/file/d/1ho_VGxDP5oPM2ZlGwEn5Aovbvwo066Y0/view?usp=sharing)
- 📁 **Shared Google Drive folder (public):** [open the folder](https://drive.google.com/drive/folders/1ASYh8nzYBCpyhTcFzv3vBHLu-BTy6gaD?usp=sharing)
- 🌐 **Open online (public, no login):** [view in diagrams.net](https://viewer.diagrams.net/?nav=1#Uhttps%3A%2F%2Fraw.githubusercontent.com%2FSandaruwanChandrasena%2Fresource-primeware%2Fmain%2Fdocs%2Fresource-reservation-er-diagram.drawio)

<br>

**The diagram uses Chen notation:**

| Symbol | Meaning |
|---|---|
| Rectangle | Entity |
| Oval | Attribute |
| <u>Underlined</u> | Key |
| Diamond | Relationship |
| Double line | Total participation |

<br>

### 🔗 Relationships (all 1 : N)

| Relationship | Meaning |
|---|---|
| User **makes** Reservation | One user owns many bookings. Every booking has exactly one owner. |
| User **cancels** Reservation | One user (the owner or an admin) can cancel many bookings. A booking has zero or one canceller. |
| Resource **has** Reservation | One resource has many bookings. Every booking is for exactly one resource. |
| User **joins** WaitlistEntry | One user can wait for many time slots. |
| Resource **for** WaitlistEntry | Many people can wait for one resource. |
| User **receives** Notification | One user gets many bell notifications. |

<br>

### 📋 Relational schema

Primary keys are **bold**; foreign keys are _italic_.

- **users** (**id**, name, email, phone, password, role, department, image_name, is_active, created_at)
- **resources** (**id**, name, type, location, capacity, description, image_name, is_active, created_at, updated_at)
- **reservations** (**id**, _resource_id_, _user_id_, start_time, end_time, purpose, status, cancelled_at, _cancelled_by_id_, cancel_reason, created_at)
- **waitlist_entries** (**id**, _user_id_, _resource_id_, start_time, end_time, status, created_at)
- **notifications** (**id**, _user_id_, message, link, is_read, created_at)

<br>

**Foreign keys:**

- `reservations.resource_id → resources.id`
- `reservations.user_id → users.id`
- `reservations.cancelled_by_id → users.id` (NULL if never cancelled)
- `waitlist_entries.user_id → users.id`
- `waitlist_entries.resource_id → resources.id`
- `notifications.user_id → users.id`

<br>

### 🔒 Database rules

**1. No overlapping bookings** (PostgreSQL exclusion constraint, migration `overlap_rule`):

```sql
EXCLUDE USING gist (
  resource_id WITH =,
  tstzrange(start_time, end_time, '[)') WITH &&
) WHERE (status = 'CONFIRMED');
```

- 10:00–11:00 and 11:00–12:00 are **both allowed** (`[)` range).
- **Cancelled** bookings are ignored.

**2. Other rules**

- `CHECK (end_time > start_time)` on reservations and waitlist entries.
- **Unique:** `users.email`, `resources.name`, and `waitlist_entries (user_id, resource_id, start_time, end_time)`.
- **Enums:**
  - role — ADMIN, MEMBER
  - resource type — ROOM, EQUIPMENT, VEHICLE, OTHER
  - reservation status — CONFIRMED, CANCELLED
  - waitlist status — WAITING, NOTIFIED
- **Nothing is deleted:** bookings are cancelled; users and resources are set to `is_active = false`. There is **no cascade delete**, so history and statistics stay correct.
- All ids are **uuid**; all times are **timestamptz**.

<br>

---

<a id="decisions"></a>

## 🧠 6. Key technical decisions

**1. Overlaps are blocked by the database, not only by code.**
A code check alone can fail when two requests arrive in the same second. The app checks first (to show a friendly clash message), and the **database is the final guard**. If the database blocks a same-second booking, the user sees the same clash message, not an error page.

**2. Review page before confirming.**
The form → review → confirm flow saves nothing until "Confirm". Refresh or Back **never books twice**.

**3. The booking owner comes from the session**, never from the form.

**4. Cancel is one transaction.**
Cancel the booking, update the waiting list, and create notifications — **all or nothing**.

**5. The waiting list is honest.**
A waiting user is told only when their **whole** wanted time is free.

**6. Admin "keep blocked" cancel.**
The cancel and the new admin booking happen in **one transaction**, so the time is never free, not even for a second.

**7. The clash message shows limited details** (time and department, not the person's name) for **privacy**.
The shared calendar shows names for planning, but **never the booking purpose**.

**8. Security**

- Passwords are hashed with **bcrypt** and never sent to the browser.
- The session token is **encrypted** (JWE) in an **httpOnly** cookie (8 hours).
- **Two layers of protection:** `proxy.ts` (fast redirects) and a **database check on every page and action**, so a deactivated user is blocked at once.
- The **same error** is shown for a wrong email or a wrong password.
- **Zod** validation on every action.

**9. Safe photo uploads**

- Max **2 MB**.
- Type checked by the **first bytes** of the file (JPG, PNG, WebP).
- A new **random file name**.
- Served only to **logged-in** users.

**10. Scales with data.**
Server-side **pagination** (the database sends only one page). Search, filters, sort and page live in the **URL**, so refresh and Back keep them.

**11. Dashboard charts** use one safe, parameterized SQL query each (`$queryRaw` tagged template), because Prisma `groupBy` can't sum time differences.

**12. Code layout by job**

- `lib/security`, `lib/services` (business rules), `lib/config`, `lib/utils`
- `components/layout`, `ui`, `forms`, `list-tools`, `booking`

<br>

---

<a id="api"></a>

## 🔌 7. API (testable in Postman)

Most features use **Server Actions** (browser only). One **JSON API** exists for the notification bell, which polls it **every 30 seconds**.

<br>

### 🍪 How to send the login cookie

1. Log in in Chrome.
2. Open **F12 → Application → Cookies → `localhost:3000`**.
3. Copy the value of **`session`**.
4. In Postman, add the header: `Cookie: session=<value>`

<br>

### 📡 Endpoints

| Method | URL | Body (raw JSON) | Result |
|---|---|---|---|
| `GET` | `http://localhost:3000/api/notifications` | none | `200 { "unreadCount": 1, "items": [...] }` |
| `PATCH` | `http://localhost:3000/api/notifications` | `{ "id": "<notification uuid>" }` | `200 { "updated": 1 }` (0 if not yours or already read) |
| `PATCH` | `http://localhost:3000/api/notifications` | `{ "all": true }` | `200 { "updated": <count> }` |
| `PATCH` | `http://localhost:3000/api/notifications` | `{ "id": "abc" }` | `400` |
| any | same URL, no cookie or a changed cookie | — | `401 { "error": "Not logged in" }` |

**Photo routes** (logged-in only):

- `GET /api/resource-images/<name>`
- `GET /api/user-images/<name>`

<br>

---

<a id="structure"></a>

## 📁 8. Project structure

```
app/            pages (admin/, member/, login/) and API routes (api/)
actions/        Server Actions (auth, resources, users, bookings, profile)
components/     layout/, ui/, forms/, list-tools/, booking/
lib/            db.ts, validation.ts, security/, services/, config/, utils/
prisma/         schema.prisma, migrations/ (4), seed.ts
docs/           ER diagram (PNG + draw.io)
proxy.ts        fast login redirects
```

<br>

---

<a id="future"></a>

## 🔭 9. Known limits and future improvements

- 🔐 Ask for the **current password** when changing a password.
- 📧 **Email** notifications (now in-app only).
- ⚖️ A **fair waiting-list queue** (now everyone waiting is told; first to book wins).
- 🔁 **Recurring** and **multi-day** bookings.
- 🗓️ Calendar **day view** and drag-to-book.
- 📈 Charts with a custom date range, and **CSV export**.
- 🖼️ Photos in the admin Users table (now initials only).
- ☁️ **Deployment** with cloud photo storage.
- 🌙 Dark mode, bulk actions, and case-insensitive unique names.

<br>

---

<div align="center">

Made by **Sandaruwan Chandrasena**.

</div>