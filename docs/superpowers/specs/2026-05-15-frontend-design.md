# Design Spec: DataShield AI Frontend

## 1. Overview
Implementation of the frontend for DataShield AI, a DLP middleware for LLMs. The frontend provides interfaces for employees to interact with the LLM and for administrators to manage policies and audit interactions.

## 2. Technical Stack
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (Deep Blue palette: `#001f3f`, `#003366`)
- **Charts**: Recharts
- **API Client**: Axios with interceptors for JWT injection
- **Accessibility**: WCAG 2.1 AA compliance using semantic HTML and ARIA labels
- **Routing**: React Router with protected route wrappers (`<PrivateRoute>`)
- **UI Primitives**: Radix UI (Dialog, DropdownMenu, Select, Toast)

## 3. Core Components & Architecture
### Auth Management
- **AuthContext**: Manages the JWT and user role (`ROLE_EMPLOYEE`, `ROLE_ADMIN`).
- **Token Storage**: Access token stored in memory (React state), refresh token in httpOnly cookie.
- **Refresh Flow**: Axios response interceptor handles 401 $\to$ calls `/auth/refresh` $\to$ retries original request.
- **Routing Logic**: 
  - No token $\to$ Redirect to `/login`.
  - `ROLE_EMPLOYEE` $\to$ Default to `/chat`.
  - `ROLE_ADMIN` $\to$ Default to `/dashboard`.
  - Unauthorized access to admin routes $\to$ 403 Forbidden view.

### API Layer
- Axios instance with a request interceptor to attach the `Authorization: Bearer <token>` header to all requests.

## 4. Screen Specifications

### 4.1 Login
- Single card interface for all users.
- Validation for email/password.
- Redirects based on role after successful authentication.

### 4.2 Chat Workspace (Employee)
- **Input Area**: Textarea for prompt entry.
- **Output Area**: 
  - Skeleton loading states during API calls.
  - **Blocked State**: Clear visual alert/banner when `blocked: true` is returned, detailing the reasons.
  - **Sanitized View**: Side-by-side or highlighted view of the processed prompt and the LLM response.

### 4.3 Audit Panel (Admin)
- DataTable with filtering (date, user, PII type).
- **PDF Export**: Triggered via `window.print()`.
- **Styling**: Specific `@media print` CSS to hide navigation, sidebars, and filters, rendering only the clean data table.

### 4.4 Policy Config (Admin)
- **Editor**: CRUD interface for regex patterns.
- **Live Playground**: Real-time validation pane. As the user types in the sample text box, the patterns are applied, and the UI highlights matches (Mask/Block/Warn) immediately.

### 4.5 Dashboard (Admin)
- **KPI Cards**: Total detections, block rate, average latency.
- **Visualization**: Recharts bar/line charts showing detection trends and the most frequent PII types detected.

## 5. Visual Identity
- **Theme**: "Cyber-Security" aesthetic.
- **Primary Colors**: Deep navy backgrounds, shield-blue accents, high-contrast white/grey text.
- **UX**: Maximum 3 clicks for critical flows (sending prompt, reviewing audit).
