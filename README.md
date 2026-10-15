# Resource Reservation Management System

A web app for booking shared resources (meeting rooms, equipment and vehicles) with **no double bookings**.

Built for the **PrimeWave Lab (Pvt) Ltd** Software Engineering Internship assessment.

### Quick links

- **Shared Google Drive folder** (ER diagram and other project files, public): [open the folder](https://drive.google.com/drive/folders/1ASYh8nzYBCpyhTcFzv3vBHLu-BTy6gaD?usp=sharing)
- **ER diagram** in this repo: [section 5](#5-database-design)

---

## 1. The business problem

An organization shares rooms, equipment and vehicles between many people and teams.
Bookings were made with informal messages and manual records. This caused:

- **Overlapping reservations** (two teams arrive for the same room).
- **Scheduling confusion** (nobody knows who booked what).
- **No clear view of availability** (people must ask around).

This app gives **one central place** to manage resources and reservations, and to see usage and availability.
The most important rule (no overlaps) is enforced by the **database itself**, so it stays reliable as daily activity grows.

---

## 2. Features

### Member

- **Home page:** cards (upcoming bookings, next booking, waiting for) and a **shared booking calendar** (month and week view, resource filter).
- **Resources page:** search, type filter, sort, grid or list view, photos.
- **Book a resource:** form, then a **review page**, then confirm. A clear **clash message** appears if the time is taken (time and department only, no names).
- **"Notify me":** on a clash, join a waiting list. When the **whole** wanted time becomes free, you get a **bell notification** with a link to the filled-in booking form.
- **My bookings:** Upcoming, Past and Cancelled tabs. Cancel your own future bookings.
- **Profile:** your details, your own photo, change password.

### Admin

- **Dashboard:** summary cards, today's bookings, and two charts:
  - **Most booked resources** (by booked **hours**).
  - **Most cancelled resources** (count, **cancel rate**, and member/admin split).
- **Calendar:** the same shared booking calendar.
- **Resources:** add, edit, upload a photo, deactivate or activate. Admins can also **book** a resource.
- **Bookings:** see **all** bookings, search and filter, and cancel any booking.
  - Cancelling someone else's booking needs a **reason**. The owner gets a bell notification with the reason.
  - **"Keep this time blocked for admin use"** (ticked by default): in one transaction, the booking is cancelled and the same time is booked in the admin's name, so the time is never free for others.
- **Users:** add, edit, deactivate or activate accounts. There is no self-registration. An admin can't deactivate themselves or remove their own admin role.

---

## 3. Tech stack and why

| Part       | Choice                                       | Why                                                                                                 |
| ---------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Framework  | **Next.js 16 (App Router)** + **TypeScript** | Required. Server Components for pages, Server Actions for forms.                                    |
| Database   | **PostgreSQL 17**                            | Required. Supports **exclusion constraints** for the no-overlap rule.                               |
| ORM        | **Prisma 7.10.0** (+ `@prisma/adapter-pg`)   | Type-safe queries and migrations.                                                                   |
| Validation | **Zod 4**                                    | Every form and API input is checked on the server.                                                  |
| Login      | **bcryptjs** + **jose**                      | Hashed passwords and an encrypted httpOnly session cookie. Small and simple; no extra auth service. |
| Styling    | **Tailwind CSS 4**                           | No UI library. Charts are plain CSS bars (no chart library).                                        |

---

## 4. Setup and run (local)

### Requirements

- **Node.js 22** and **npm**
- **PostgreSQL 17** running on your machine

### Steps

1. **Install packages**
   ```bash
   npm install
   ```
2. **Create the database.** In pgAdmin (or `psql`), create an empty database named `resource_booking`.
3. **Create the `.env` file.** Copy `.env.example` to `.env` and set your values:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/resource_booking"
   SESSION_SECRET="a-long-random-string"
   DEMO_DELAY_MS=0
   ```
   Make a secret with:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
4. **Create the tables** (runs all 4 migrations, including the overlap rule):
   ```bash
   npx prisma migrate dev
   ```
5. **Generate the Prisma client** (Prisma 7 does not do this inside `migrate dev`):
   ```bash
   npx prisma generate
   ```
6. **Add demo data:**
   ```bash
   npx prisma db seed
   ```
7. **Start the app:**
   ```bash
   npm run dev
   ```
   Open **http://localhost:3000**.

### Demo logins (from the seed)

| Role   | Email               | Password   | Department  |
| ------ | ------------------- | ---------- | ----------- |
| Admin  | admin@primewave.lk  | Admin@123  | IT          |
| Member | nimal@primewave.lk  | Member@123 | Marketing   |
| Member | ayesha@primewave.lk | Member@123 | Finance     |
| Member | kasun@primewave.lk  | Member@123 | Engineering |

Demo resources: Meeting Room A, Board Room, Training Hall, Projector 1, Projector 2, Company Van (no photos; upload them as admin).

### Good to know

- **`DEMO_DELAY_MS`**: a fake wait (in ms) in every button action, so loaders can be seen in the demo video. It also waits between the code clash check and the database insert, so the **database overlap guard** can be shown with two browsers. Set it to **0** for normal speed.
- **Photos** are saved on disk in `uploads/` (created automatically, **not in git**).
- **Time zone:** times are stored in **UTC** and shown in **Sri Lanka time** (Asia/Colombo). The database connection always uses a UTC session, so the app works with any PostgreSQL time zone setting.
- **Booking settings** (in `lib/config/booking-settings.ts`): 07:00 to 20:00, 30-minute steps, same-day bookings, up to 30 days ahead.

### Reset to a clean start

Close pgAdmin connections first, then:

```bash
npx prisma migrate reset
npx prisma db seed
```

On Windows PowerShell, also delete old photos and the Next.js cache:

```powershell
Remove-Item -Recurse -Force uploads
Remove-Item -Recurse -Force .next
```

---

## 5. Database design

### ER diagram

![ER diagram](docs/resource-reservation-er-diagram.png)

- Picture: [`docs/resource-reservation-er-diagram.png`](docs/resource-reservation-er-diagram.png)
- Editable draw.io file: [`docs/resource-reservation-er-diagram.drawio`](docs/resource-reservation-er-diagram.drawio)
- Shared Google Drive folder (public): [open the folder](https://drive.google.com/drive/folders/1ASYh8nzYBCpyhTcFzv3vBHLu-BTy6gaD?usp=sharing)
- Open online (public, no login): [view in diagrams.net](https://viewer.diagrams.net/?nav=1#Uhttps%3A%2F%2Fraw.githubusercontent.com%2FSandaruwanChandrasena%2Fresource-primeware%2Fmain%2Fdocs%2Fresource-reservation-er-diagram.drawio)

The diagram uses **Chen notation**: rectangle = entity, oval = attribute, underlined = key, diamond = relationship, double line = total participation.

### Relationships (all 1 : N)

| Relationship                   | Meaning                                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| User **makes** Reservation     | One user owns many bookings. Every booking has exactly one owner.                               |
| User **cancels** Reservation   | One user (the owner or an admin) can cancel many bookings. A booking has zero or one canceller. |
| Resource **has** Reservation   | One resource has many bookings. Every booking is for exactly one resource.                      |
| User **joins** WaitlistEntry   | One user can wait for many time slots.                                                          |
| Resource **for** WaitlistEntry | Many people can wait for one resource.                                                          |
| User **receives** Notification | One user gets many bell notifications.                                                          |

### Relational schema

Primary keys are **bold**; foreign keys are _italic_.

- **users** (**id**, name, email, phone, password, role, department, image_name, is_active, created_at)
- **resources** (**id**, name, type, location, capacity, description, image_name, is_active, created_at, updated_at)
- **reservations** (**id**, _resource_id_, _user_id_, start_time, end_time, purpose, status, cancelled_at, _cancelled_by_id_, cancel_reason, created_at)
- **waitlist_entries** (**id**, _user_id_, _resource_id_, start_time, end_time, status, created_at)
- **notifications** (**id**, _user_id_, message, link, is_read, created_at)

Foreign keys:

- `reservations.resource_id → resources.id`
- `reservations.user_id → users.id`
- `reservations.cancelled_by_id → users.id` (NULL if never cancelled)
- `waitlist_entries.user_id → users.id`
- `waitlist_entries.resource_id → resources.id`
- `notifications.user_id → users.id`

### Database rules

- **No overlapping bookings** (PostgreSQL exclusion constraint, migration `overlap_rule`):
  ```sql
  EXCLUDE USING gist (
    resource_id WITH =,
    tstzrange(start_time, end_time, '[)') WITH &&
  ) WHERE (status = 'CONFIRMED');
  ```
  10:00–11:00 and 11:00–12:00 are both allowed (`[)` range). Cancelled bookings are ignored.
- `CHECK (end_time > start_time)` on reservations and waitlist entries.
- **Unique:** `users.email`, `resources.name`, and `waitlist_entries (user_id, resource_id, start_time, end_time)`.
- **Enums:** role (ADMIN, MEMBER), resource type (ROOM, EQUIPMENT, VEHICLE, OTHER), reservation status (CONFIRMED, CANCELLED), waitlist status (WAITING, NOTIFIED).
- **Nothing is deleted:** bookings are cancelled; users and resources are set to `is_active = false`. There is no cascade delete, so history and statistics stay correct.
- All ids are **uuid**; all times are **timestamptz**.

---

## 6. Key technical decisions

1. **Overlaps are blocked by the database, not only by code.** A code check alone can fail when two requests arrive in the same second. The app checks first (to show a friendly clash message), and the database is the final guard. If the database blocks a same-second booking, the user sees the same clash message, not an error page.
2. **Review page before confirming.** The form → review → confirm flow saves nothing until "Confirm". Refresh or Back never books twice.
3. **Booking owner comes from the session**, never from the form.
4. **Cancel is one transaction:** cancel the booking, update the waiting list, and create notifications (all or nothing).
5. **Waiting list is honest:** a waiting user is told only when their **whole** wanted time is free.
6. **Admin "keep blocked" cancel:** the cancel and the new admin booking happen in one transaction, so the time is never free, not even for a second.
7. **Clash message shows limited details** (time and department, not the person's name) for privacy. The shared calendar shows names for planning, but never the booking purpose.
8. **Security:**
   - Passwords are hashed with bcrypt and never sent to the browser.
   - The session token is **encrypted** (JWE) in an **httpOnly** cookie (8 hours).
   - Two layers of protection: `proxy.ts` (fast redirects) and a **database check on every page and action**, so a deactivated user is blocked at once.
   - The same error is shown for a wrong email or a wrong password.
   - Zod validation on every action.
9. **Safe photo uploads:** max 2 MB; type checked by the **first bytes** of the file (JPG, PNG, WebP); a new random file name; served only to logged-in users.
10. **Scales with data:** server-side pagination (the database sends only one page). Search, filters, sort and page live in the **URL**, so refresh and Back keep them.
11. **Dashboard charts** use one safe parameterized SQL query each (`$queryRaw` tagged template), because Prisma `groupBy` can't sum time differences.
12. **Code layout by job:** `lib/security`, `lib/services` (business rules), `lib/config`, `lib/utils`; `components/layout`, `ui`, `forms`, `list-tools`, `booking`.

---

## 7. API (testable in Postman)

Most features use Server Actions (browser only). One JSON API exists for the notification bell, which polls it every 30 seconds.

**Login cookie:** log in in Chrome, then open F12 → Application → Cookies → `localhost:3000` and copy the value of `session`.
In Postman, add the header `Cookie: session=<value>`.

| Method | URL                                       | Body (raw JSON)                   | Result                                                  |
| ------ | ----------------------------------------- | --------------------------------- | ------------------------------------------------------- |
| GET    | `http://localhost:3000/api/notifications` | none                              | `200 { "unreadCount": 1, "items": [...] }`              |
| PATCH  | `http://localhost:3000/api/notifications` | `{ "id": "<notification uuid>" }` | `200 { "updated": 1 }` (0 if not yours or already read) |
| PATCH  | `http://localhost:3000/api/notifications` | `{ "all": true }`                 | `200 { "updated": <count> }`                            |
| PATCH  | `http://localhost:3000/api/notifications` | `{ "id": "abc" }`                 | `400`                                                   |
| any    | same URL, no cookie or a changed cookie   |                                   | `401 { "error": "Not logged in" }`                      |

Photo routes (logged-in only): `GET /api/resource-images/<name>` and `GET /api/user-images/<name>`.

---

## 8. Project structure

```
app/            pages (admin/, member/, login/) and API routes (api/)
actions/        Server Actions (auth, resources, users, bookings, profile)
components/     layout/, ui/, forms/, list-tools/, booking/
lib/            db.ts, validation.ts, security/, services/, config/, utils/
prisma/         schema.prisma, migrations/ (4), seed.ts
docs/           ER diagram (PNG + draw.io)
proxy.ts        fast login redirects
```

---

## 9. Known limits and future improvements

- Ask for the **current password** when changing a password.
- **Email** notifications (now in-app only) and a **fair waiting-list queue** (now everyone waiting is told; first to book wins).
- **Recurring** and **multi-day** bookings.
- Calendar **day view** and drag-to-book.
- Charts with a custom date range, and **CSV export**.
- Photos in the admin Users table (now initials only).
- **Deployment** with cloud photo storage (the assessment asks for local running).
- Dark mode, bulk actions, and case-insensitive unique names.
