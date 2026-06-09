# CODING_STANDARDS.md — Coding Guidelines & Best Practices

To ensure maximum performance and maintainability, follow these standards when writing code in this repository:

---

## ⚡ Supabase Client Initialization in React
**Crucial Rule for React Hooks & Effects:**
- To prevent infinite loops caused by Fast Refresh and React component re-rendering, **never** instantiate `createClient()` inline inside `useEffect` or callbacks.
- **Never** place the `supabase` instance inside the dependency array of `useEffect`, `useCallback`, or `useMemo`.
- **Always** instantiate the client using `useRef` to guarantee a single, stable instance:
```tsx
const supabaseRef = useRef(createClient())
const supabase = supabaseRef.current
```

---

## 🕒 Timezone & Deadline Settings
- The workspace enforces a daily report submission deadline of **22h00 (10:00 PM)**.
- Any reports submitted after 22:00 must be marked as **"Nộp muộn"** (Late).
- Always use Vietnam Time (UTC+7) calculations when verifying deadlines:
```ts
const isReportLate = (reportTimeUtc: string) => {
  const date = new Date(reportTimeUtc)
  const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000)
  const vnTime = new Date(utcTime + (3600000 * 7)) // Vietnam UTC+7
  return vnTime.getHours() >= 22
}
```

---

## 👥 Group Meeting Progress Reports
- Individual progress reports that are auto-created or dynamically rendered from group meetings must have their `today_tasks` field prefixed with:
  `[Báo cáo nhóm]`
- Banners and history timelines will check for this prefix to display the purple `👥 Báo cáo nhóm` badge.
- If editing a group meeting, only overwrite the participants' individual reports if they start with `[Báo cáo nhóm]` (do not touch manual/custom reports).

---

## 📅 Sunday Report Exclusion
- There is **no requirement** to submit progress reports on **Sundays**.
- The dashboard, calendar overview, and history pages should skip Sunday validations and not count Sundays as missing reports.

---

## 🌐 Language & Localization
- All user-facing UI copy, labels, tooltips, error warnings, and notifications must be written in friendly, natural **Vietnamese**.
- Formal terms like **"Biên bản"** (Minutes) should be replaced with everyday friendly terms like **"Ghi chép họp nhóm"** (Group meeting notes).
- Gratitude practices should use terms like **"Hòn đá nhiệm màu"** (Magic Stone) and **"Cảm thấy mình thật Hạnh phúc"** (Count your blessings) bám sát sách *The Magic*.
