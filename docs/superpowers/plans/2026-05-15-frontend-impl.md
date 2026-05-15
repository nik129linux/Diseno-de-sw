# DataShield AI Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a WCAG 2.1 AA compliant React frontend for DataShield AI with a "deep blue/shield" aesthetic, providing chat and administration interfaces.

**Architecture:** 
- React 18 + Vite for build tool.
- Axios with a singleton instance for API communication and JWT interceptors.
- Protected Route wrappers for Role-Based Access Control (RBAC).
- Use of Radix UI primitives for accessible components.

**Tech Stack:** React, TypeScript, Tailwind CSS, Vite, Axios, Recharts, Radix UI, React Router.

---

## 📁 File Structure Map

### `/frontend`
- `src/api/`
  - `apiClient.ts`: Axios instance and interceptors.
  - `authApi.ts`: Auth endpoints helper.
  - `promptApi.ts`: Sanitization/LLM endpoints helper.
  - `adminApi.ts`: Audit and Policy endpoints helper.
- `src/context/`
  - `AuthContext.tsx`: User session and JWT management.
- `src/components/`
  - `layout/`
    - `MainLayout.tsx`: Wrapper with Sidebar and Header.
    - `ProtectedRoute.tsx`: RBAC route wrapper.
- `src/components/ui/` (Radix primitives)
  - `Button.tsx`, `Input.tsx`, `Card.tsx`, `Toast.tsx`, `Modal.tsx`.
- `src/pages/`
  - `Login.tsx`: Auth entry point.
  - `Chat.tsx`: Workspace for prompt/response.
  - `Audit.tsx`: Admin audit table.
  - `Policies.tsx`: Admin regex config + live playground.
  - `Dashboard.tsx`: Admin analytics.
- `src/hooks/`
  - `useAuth.ts`: Hook helper for AuthContext.
- `src/styles/`
  - `index.css`: Tailwind imports + `@media print` styles.
- `src/App.tsx`: Route definitions.
- `src/main.tsx`: Entry point.

---

## 🛠️ Implementation Tasks

### Task 1: Project Scaffolding & Base Setup
- [ ] **Step 1.1: Initialize Vite project**
  Run: `npm create vite@latest frontend -- --template react-ts`
  Run: `cd frontend && npm install`
- [ ] **Step 1.2: Install dependencies**
  Run: `npm install axios react-router-dom lucide-react recharts @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-toast`
  Run: `npm install -D tailwindcss postcss autoprefixer`
  Run: `npx tailwindcss init -p`
- [ ] **Step 1.3: Configure Tailwind CSS**
  Setup `tailwind.config.js` with deep blue palette (`#001f3f`, `#003366`).
- [ ] **Step 1.4: Global Styles & Printing**
  Create `src/styles/index.css` with custom scrollbars and the `@media print` block to hide `nav`, `.sidebar`, and `.no-print` elements.
- [ ] **Step 1.5: Commit**
  `git add frontend/ && git commit -m "feat(frontend): scaffold project and install dependencies"`

### Task 2: API Client & Auth Logic
- [ ] **Step 2.1: Implement `apiClient.ts`**
  Set up Axios instance with `baseURL` and request interceptor to attach Bearer token from state.
- [ ] **Step 2.2: Implement Response Interceptor (401 handling)**
  Add logic to call `/api/v1/auth/refresh` and retry original request on 401.
- [ ] **Step 2.3: Create `AuthContext.tsx`**
  Implement state for `user` and `token`. Store refresh token in a secure cookie (or sessionStorage if fallback).
- [ ] **Step 2.4: Create `ProtectedRoute.tsx`**
  Implement wrapper that checks `token` and `role`. Redirects to `/login` if unauthenticated.
- [ ] **Step 2.5: Commit**
  `git commit -m "feat(frontend): setup api client and auth context"`

### Task 3: Login Page & Basic Routing
- [ ] **Step 3.1: Create `Login.tsx`**
  Build a centered card with email/password fields.
- [ ] **Step 3.2: Connect Login to `authApi.ts`**
  Handle successful login $\to$ set context $\to$ redirect based on `role` (Employee $\to$ /chat, Admin $\to$ /dashboard).
- [ ] **Step 3.3: Setup `App.tsx` routes**
  Define paths for `/login`, `/chat`, `/audit`, `/policies`, `/dashboard`.
- [ ] **Step 3.4: Commit**
  `git commit -m "feat(frontend): implement login and basic routing"`

### Task 4: Chat Workspace (The Core Experience)
- [ ] **Step 4.1: Create `Chat.tsx` layout**
  Implement side-by-side workspace.
- [ ] **Step 4.2: Implement Prompt Input & Loading State**
  Add `lucide-react` loading spinner and skeleton for output.
- [ ] **Step 4.3: Implement Blocked Prompt UI**
  Design clear alert banner for `blocked: true` responses with a list of reasons.
- [ ] **Step 4.4: Implement Response Rendering**
  Map `sanitizedPrompt` and `llmResponse` to the output pane.
- [ ] **Step 4.5: Commit**
  `git commit -m "feat(frontend): implement chat workspace with blocked state and loading indicators"`

### Task 5: Admin Audit Panel
- [ ] **Step 5.1: Create `Audit.tsx` table**
  Fetch and render paginated interactions from `/api/v1/audit`.
- [ ] **Step 5.2: Implement Filters**
  Add date and keyword filter inputs.
- [ ] **Step 5.3: Implement PDF Export**
  Add a button that triggers `window.print()` and relies on the pre-configured `@media print` styles.
- [ ] **Step 5.4: Commit**
  `git commit -m "feat(frontend): implement admin audit panel with pdf export"`

### Task 6: Policy Configuration & Live Playground
- [ ] la **Step 6.1: Create `Policies.tsx` CRUD**
  Table/List of policies and a Radix UI Dialog for creating/editing patterns.
- [ ] **Step 6.2: Implement the "Live Playground" pane**
  Add a text area on the right. As the user types, call a (new/dedicated) test endpoint or simulate the logic to show real-time masking.
- [ ] **Step 6.3: Commit**
  `git commit -m "feat(frontend): implement policy config and live playground"`

### Task 7: Admin Dashboard
- [ ] **Step 7.1: Create `Dashboard.tsx`**
  Implement 3 KPI cards.
- [ ] **Step 7.2: Implement Detection Trends Chart**
  Use Recharts `BarChart` or `LineChart` to plot interactions over time.
- [ ] **Step 7.3: Implement PII Distribution Chart**
  Use Recharts `PieChart` to see which patterns are most active.
- [ ] **Step 7.4: Commit**
  `git commit -m "feat(frontend): implement admin dashboard with recharts"`

### Task 8: Final Polish & WCAG Audit
- [ ] **Step 8.1: Accessibility Check**
  Verify contrast and keyboard navigation (Tab order). Ensure all inputs have associated `<label>`.
- [ ] **Step 8.2: Final UI Polish**
  Check "deep blue" theme consistency across all screens.
- [ ] **Step 8.3: Commit**
  `git commit -m "feat(frontend): final accessibility and theme polish"`
