# Project History Log — Eurus Magic Tracker

This document records the chronological history of completed requests, fixes, and updates applied to the project. Read this file to understand the current state and what has been done.

---

## 📅 Log: June 09, 2026

### 1. Fix Infinite Rendering Loop (429 Rate Limit)
*   **Problem:** The app had an infinite loop of re-renders and was hitting Supabase's request rate limits, resulting in `429 over_request_rate_limit` errors.
*   **Cause:** The Supabase client was instantiated inline or added to the dependency arrays of `useEffect`/`useCallback` hooks in multiple pages and components.
*   **Fix:** Moved `createClient()` instantiation into a stable `useRef` hook and removed `supabase` from all hook dependency arrays in 8 key files:
    - `src/context/AuthContext.tsx`
    - `src/app/dashboard/page.tsx`
    - `src/components/ReportForm.tsx`
    - `src/app/report/history/page.tsx`
    - `src/app/report/group/page.tsx`
    - `src/app/report/group/new/page.tsx`
    - `src/app/magic/page.tsx`
    - `src/app/magic/day/[dayNum]/page.tsx`

---

### 2. Extend Daily Submission Deadline to 22h00
*   **Problem:** The daily submission deadline of 17h00 (5:00 PM) was too early for interns to complete their daily reports.
*   **Fix:** Extended the deadline to **22h00 (10:00 PM)**. Updated checks in `ReportForm.tsx`, `dashboard/page.tsx`, and `history/page.tsx`. All visual copy texts were updated accordingly.

---

### 3. Automate Individual Reports from Group Meetings (Database & Virtual Fallbacks)
*   **Problem:** Non-admin members had to submit both group meeting notes and individual reports on the same day, creating duplicate entries.
*   **Fixes:**
    - **Database Trigger:** Modifed `group/new/page.tsx` to automatically insert or update reports in the `reports` table for all non-admin participants when a group meeting is recorded.
    - **Virtual Report Overlay:** Created a robust fallback on the Dashboard and History feeds. If a member participated in a group meeting but has no manual report record for that date in the DB, the system dynamically generates a virtual report card on the fly, marking them as "Đã nộp" (Submitted) and assigning them a purple `👥 Báo cáo nhóm` badge.
    - **Auto-prefilling:** If a member opens the individual report form today and they have a group meeting recorded, the form pre-loads with the group meeting details as a template.
    - **Security:** Created `supabase/update_reports_rls_policies.sql` to permit group meeting creators to insert reports for other participants.

---

### 4. YouTube Embed in Gratitude Journal
*   **Problem:** Members needed to watch the specific day's gratitude instructions before writing their 10 blessings.
*   **Fix:** Mapped each of the 28 days of practice to the exact YouTube video ID from MC Quỳnh Hương's "Những điều kỳ diệu" playlist. Embedded a premium responsive player on the day detail page (`magic/day/[dayNum]/page.tsx`) right above the submission form.

---

## 📋 Next Steps
- Continue checking local dev dashboard.
- Execute SQL policies in production Supabase console.
