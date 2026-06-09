# CONTEXT.md — Eurus Magic Tracker & Progress Dashboard
> Last updated: 2026-06-09 | Environment: Next.js + Supabase Remote & Offline Mock

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Core Framework | Next.js 16.2.7 (App Router), TypeScript |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Charts | Recharts (Responsive charts for dashboard statistics) |
| Database | Supabase (PostgreSQL) |
| Auth | Next.js client & middleware-based Supabase auth context |
| Offline Mode | Custom mock client (`src/lib/supabase/mock-client.ts`) utilizing `localStorage` |

---

## 📁 Key Folder Structure

```
Report_intern/
├── supabase/                    # SQL migration scripts & schema definitions
│   ├── schema.sql               # Main database table & policy definition
│   └── update_reports_rls_policies.sql
├── src/
│   ├── app/                     # App Router pages & endpoints
│   │   ├── dashboard/           # Team activity monitoring dashboard
│   │   ├── magic/               # 28-day gratitude journal
│   │   │   ├── page.tsx
│   │   │   └── day/[dayNum]/    # Specific day journal form & Quỳnh Hương video
│   │   ├── report/              # Group & Individual progress reports
│   │   │   ├── group/           # Group meeting timeline
│   │   │   │   ├── page.tsx
│   │   │   │   └── new/         # Record/Edit group meeting notes
│   │   │   └── history/         # Daily reports submission log
│   │   ├── login/
│   │   └── register/
│   ├── components/              # Shared elements: Navigation, ReportForm, Avatar
│   ├── context/                 # AuthContext (profile role checking & session)
│   └── lib/
│       ├── magic-days.ts        # Instructions & metadata for 28 gratitude days
│       └── supabase/            # Client initialization (Singleton / server / mock)
```

---

## 💾 Database Schema

The database consists of 4 main tables:

### 1. `profiles`
Stores user profile information extending standard Auth users.
- `id` (UUID, PK)
- `email` (TEXT)
- `full_name` (TEXT)
- `avatar_url` (TEXT)
- `role` (TEXT, 'admin' or 'member')

### 2. `reports`
Stores daily individual progress updates.
- `id` (UUID, PK)
- `user_id` (UUID, FK -> profiles)
- `report_date` (DATE)
- `today_tasks` (TEXT) - prefixed with `[Báo cáo nhóm]` if auto-created from a group meeting
- `lessons_learned` (TEXT)
- `problems_and_solutions` (TEXT)
- `next_day_plan` (TEXT)
- `attachments` (TEXT[], Base64 image urls as proof)
- `approval_status` (TEXT, 'pending' / 'approved' / 'rejected')

### 3. `group_meetings`
Stores logs of regular team meetings.
- `id` (UUID, PK)
- `meeting_date` (DATE)
- `meeting_time` (TIME)
- `duration_minutes` (INTEGER)
- `participants` (UUID[])
- `content` (TEXT)
- `difficulties` (TEXT)
- `solutions` (TEXT)
- `assignments` (JSONB, containing list of `{user_id, task}`)
- `attachments` (TEXT[], meeting screenshots)
- `created_by` (UUID)

### 4. `gratitude_logs`
Stores entries for the 28 Days of Magic gratitude program.
- `id` (UUID, PK)
- `user_id` (UUID, FK -> profiles)
- `day_number` (INTEGER, 1-28)
- `log_date` (DATE)
- `gratitude_list` (JSONB)
- `magic_stone_thought` (TEXT)
- `day_specific_practice` (JSONB)
