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

### Expanded Dashboard Detailed Tracking Table Options & Logbook Fixes
*   **Problem 1:** Font rendering in paper preview broke Vietnamese diacritics (adding unwanted spaces like `Tuầ ` n`, `đế ` n`).
*   **Fix 1:** Removed Tailwind `font-serif` and `tracking-*` classes from Vietnamese text. Added explicit inline font style `fontFamily: '"Times New Roman", Times, serif'`, `letterSpacing: 'normal'`, and CSS rule `.vn-paper-font` for 100% clean Vietnamese diacritics font rendering.
*   **Problem 2:** Logbook modal only fetched from `reports` table, missing group meeting days when no individual report was filed. Also, users could not split logbooks by Internship Phases (Đợt 1: June-July vs Đợt 2: August-October).
*   **Fix 2:** Updated `InternshipLogbookModal.tsx` to query both `reports` and `group_meetings` simultaneously across the entire internship history, merging virtual meeting reports, shifting Sunday meetings to Monday, and adding **Phase Filter controls**:
    *   `🌟 Tất cả (Toàn bộ quá trình)`
    *   `📅 Đợt 1 (Tháng 6 - Tháng 7)`
    *   `📅 Đợt 2 (Tháng 8 - Tháng 10)`
    *   `🎯 Tùy chỉnh (Từ ngày... đến ngày...)`
    *   Selecting any phase dynamically filters reports and re-indexes `Tuần 1, Tuần 2...` from the first week of that phase.
*   **Problem 3:** Date formats in certain chart labels or dropdowns displayed in `MM/DD/YYYY` or `MM/DD` format depending on browser locale settings.
*   **Fix 3:** Enforced deterministic `DD/MM/YYYY` (Ngày/Tháng/Năm) and `DD-MM` (Ngày-Tháng) formatting across all logbook tables, CSV export headers, bar chart labels, and dropdown menus.
*   **Problem 4:** Default / placeholder mentor name was previously set to `ThS. Nguyễn Văn Phụng`.
*   **Fix 4:** Updated default mentor name state and fallback value in `InternshipLogbookModal.tsx` to **`Nguyễn Minh Phụng`**.
*   **Problem 5:** Default topic name placeholder needed to be updated to the official company topic name.
*   **Fix 5:** Set default topic name in `InternshipLogbookModal.tsx` to **`NGHIÊN CỨU VÀ TRIỂN KHAI HỆ SINH THÁI GIẢI PHÁP SỐ DOANH NGHIỆP TẠI CÔNG TY TNHH GIẢI PHÁP ETI`**.
*   **Problem 6:** Users had to close the logbook modal and click a different member card to view another member's logbook.
*   **Fix 6:** Added a **Member Switcher dropdown** (`👥 Nhật ký của: [Tên thành viên]`) directly inside `InternshipLogbookModal.tsx`. Selecting any member from the dropdown automatically fetches that member's historical reports, updates the student name, and re-aggregates weekly logbook data in real time.

---

## 📅 Log: August 21, 2026

### High-Fidelity WebP 2K Upload & Interactive Pro ImageViewer
*   **Problem:** Uploaded images (screenshots of documents, mindmaps, code) were blurred and squeezed due to 1200px JPEG 75% canvas compression and static `max-h-[80vh]` lightbox without zoom/pan controls.
*   **Fix:**
    *   **Created [image-utils.ts](file:///r:/_Projects/Eurus_Workspace/Report_intern/src/lib/image-utils.ts):** Implemented `compressImageToWebP` providing 2048px (2K) resolution, 85% WebP quality, and `imageSmoothingQuality = 'high'`. Keeps text razor sharp while producing lightweight files (~120KB - 180KB).
    *   **Created [ImageViewerModal.tsx](file:///r:/_Projects/Eurus_Workspace/Report_intern/src/components/ImageViewerModal.tsx):** Built a dedicated lightbox viewer with interactive Zoom In/Out (100% - 500%), Mouse Wheel Zoom, Click & Drag Pan, Double-Click Zoom Toggle, 90° Rotate, Open in New Tab (Full Size), and Native Download.
    *   **Integrated:** Replaced basic lightboxes and updated upload pipelines in [ReportForm.tsx](file:///r:/_Projects/Eurus_Workspace/Report_intern/src/components/ReportForm.tsx), [group/new/page.tsx](file:///r:/_Projects/Eurus_Workspace/Report_intern/src/app/report/group/new/page.tsx), [history/page.tsx](file:///r:/_Projects/Eurus_Workspace/Report_intern/src/app/report/history/page.tsx), [group/page.tsx](file:///r:/_Projects/Eurus_Workspace/Report_intern/src/app/report/group/page.tsx), and [dashboard/page.tsx](file:///r:/_Projects/Eurus_Workspace/Report_intern/src/app/dashboard/page.tsx).

---

## 📋 Next Steps
- Test uploading and zooming high-resolution mindmaps on `http://localhost:3000`.
