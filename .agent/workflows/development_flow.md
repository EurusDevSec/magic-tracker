# development_flow.md — Agent Development Workflow

This document details the step-by-step development, verification, and testing workflow.

---

## 🏃 Local Development
To boot the local development server:
```bash
npm run dev
```
By default, the server runs on `http://localhost:3000`. If Supabase credentials are not found in `.env.local`, the client falls back to offline mock mode automatically, writing data to `localStorage`.

---

## 🔬 Compilation & Type Safety Verification
Before concluding any task or pushing changes:
1. **Always** check for TypeScript type errors across the entire project:
```bash
npx tsc --noEmit
```
This is critical as Next.js will refuse to build in production if there are any TypeScript compilation issues.

2. **Always** perform a full Next.js production build check to ensure pages are correctly optimized and have no SSR/SSG errors:
```bash
npm run build
```

---

## 🛠️ Step-by-Step Change Process
1. **Research & Plan**: Analyze the affected files. For complex features, update the implementation plan and seek user confirmation first.
2. **Execute Changes**: Use non-contiguous replacement blocks (`multi_replace_file_content`) to modify code cleanly, preserving all comments and surrounding structure.
3. **Verify locally**: Make sure the dev server re-compiles correctly.
4. **Compile and Build Check**: Run type check and full build verification.
5. **Walkthrough & Logging**: Document the achievements and modifications in the conversation and update the project history log.
