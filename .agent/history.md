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

## 📅 Log: June 15, 2026

### Shift Sunday Group Meetings to Monday Reports
*   **Problem:** Sundays are hidden on the tracker/dashboard. When a group meeting was held on a Sunday, individual reports were not populated for Monday, showing members as "Chưa nộp" (Not submitted) for Monday.
*   **Fixes:**
    *   **Group Meeting Creation:** Modified `src/app/report/group/new/page.tsx` to shift the target report date to Monday if the selected group meeting date is Sunday.
    *   **Dashboard Feed:** Modified `src/app/dashboard/page.tsx` to shift Sunday meeting dates to Monday, ensuring virtual reports are correctly generated for Monday.
    *   **History Feed:** Modified `src/app/report/history/page.tsx` to shift Sunday meeting dates to Monday for virtual reports.
    *   **Report Form Pre-fill:** Modified `src/components/ReportForm.tsx` to look for Sunday group meetings when a user opens the report form on Monday.

---

## 📅 Log: June 25, 2026

### Past-Date Report Submissions and Late Check Fixes
*   **Problem:** The individual report form was hardcoded to submit for the current date (`todayStr`), preventing users from backfilling reports they forgot to submit on previous days. Additionally, reports submitted for a past date would incorrectly be marked as "On time" if they were submitted before 22h00 of the creation day.
*   **Fixes:**
    *   **Date Selector:** Added a date input selector at the top of [ReportForm.tsx](file:///r:/_Projects/Eurus_Workspace/Report_intern/src/components/ReportForm.tsx) to allow selecting past dates (up to today).
    *   **Data Fetching & Prefill:** Modified `ReportForm.tsx` to refetch existing report data or load virtual group report templates automatically whenever the selected date changes.
    *   **Late Submission Logic:** Rewrote `isReportLate` in both `dashboard/page.tsx` and `history/page.tsx` to check if a report's creation date is on a later day than its corresponding `report_date` (marking all backfilled reports as "Nộp muộn").

---

## 📅 Log: July 09, 2026

### Group Report Editing & Stepper Resetting Fixes
*   **Problem 1 (Member Editing):** Members could not edit group meetings because the edit condition strictly checked for `meeting.created_by === user.id`. The team wanted all members to be able to edit any group meeting.
*   **Fix 1:** Created [update_group_meetings_rls_policies.sql](file:///r:/_Projects/Eurus_Workspace/Report_intern/supabase/update_group_meetings_rls_policies.sql) allowing updates for all authenticated users. Updated [page.tsx](file:///r:/_Projects/Eurus_Workspace/Report_intern/src/app/report/group/page.tsx) and [new/page.tsx](file:///r:/_Projects/Eurus_Workspace/Report_intern/src/app/report/group/new/page.tsx) to render the "Chỉnh sửa" link and allow editing for any logged-in user.
*   **Problem 2 (Selected Members Lost on Step Back):** Moving backward in the group meeting creation stepper (e.g. from step 3 to step 2 or 1) reset the selected participants checklists to just the current user. This was caused by the profile fetching effect trigger refetching and rewriting state on every context user reference change.
*   **Fix 2:** Refactored the `useEffect` inside `group/new/page.tsx` to:
    *   Only execute `fetchProfiles()` on mount if the `profiles` array is empty.
    *   Only auto-select the current user on initial creation if the `selectedParticipants` array is completely empty (`prev.length === 0`).

---

## 📅 Log: July 25, 2026

### Expanded Dashboard Detailed Tracking Table Options
*   **Problem:** The detailed tracking table (`Bảng Theo Dõi Chi Tiết`) was limited to 7, 14, and 30 days, making it impossible to view or export the full internship log process over 2+ months.
*   **Fix:**
    *   **Expanded Range Filters:** Updated [dashboard/page.tsx](file:///r:/_Projects/Eurus_Workspace/Report_intern/src/app/dashboard/page.tsx) to provide preset options for **7 ngày**, **14 ngày**, **30 ngày**, **60 ngày (2 tháng)**, **90 ngày (3 tháng)**, **120 ngày (4 tháng)**, and **Tất cả (180 ngày)**.
    *   **Chart & Table Scaling:** Adjusted `dailyBarData` chart XAxis tick intervals dynamically so ticks don't overlap when viewing 60, 90, or 180 days.
    *   **Full Exporting:** Selecting 60, 90, or 180 days automatically loads all historical reports for those periods into both the interactive grid (with smooth horizontal scroll and sticky member names) and the CSV Export feature.

---

## 📋 Next Steps
- Continue checking local dev dashboard.
- Execute SQL policies in production Supabase console.
