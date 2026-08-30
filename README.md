# USRMusic Frontend

Admin SPA for USRMusic, a DJ/entertainment business management CRM. Manages the full event lifecycle: lead capture → enquiries → confirmed events → digital contracts → invoices → payments → completed events. Internal tool for staff and admins, not a public-facing product (aside from the public contract-signing page).

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19
- **Language:** TypeScript 5 (strict mode)
- **UI:** Ant Design v6 (custom theme)
- **Styling:** Tailwind CSS v4
- **Server state:** TanStack React Query v5
- **HTTP client:** Axios
- **Forms:** Formik + Yup
- **Charts:** ApexCharts
- **Dates:** dayjs, date-fns, react-day-picker
- **Signature capture:** Canvas-based (`SignaturePad.tsx`)

## Quick Start (Local Development)

1. Create a `.env` file in the project root:
   ```bash
   NEXT_PUBLIC_BASE_URL='http://localhost:4000'
   NEXT_PUBLIC_LARAVEL_ENQUIRY_URL='https://dev.usrmusic.com/api/enquiry-form'
   ```
   Point `NEXT_PUBLIC_BASE_URL` at your running backend (see the `Backend` repo).

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the dev server:
   ```bash
   npm run dev
   # App runs on http://localhost:3000
   ```

## Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_BASE_URL` | Backend API base URL. All API calls use `${NEXT_PUBLIC_BASE_URL}/api` |
| `NEXT_PUBLIC_LARAVEL_ENQUIRY_URL` | Legacy Laravel public enquiry-form endpoint that the new `/enquiry-form` page dual-writes to alongside the new CRM. Defaults to `https://usrmusic.com/api/enquiry-form` in code if unset — swap to the production URL before this goes live for real visitors. |

Both are `NEXT_PUBLIC_*` values baked into the client bundle at build time — not secret, but must be set correctly per environment (local / staging / production).

## Scripts

```bash
npm run dev      # Next.js dev server (port 3000)
npm run build    # Production build
npm start        # Start production build
npm run lint     # ESLint
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/                 # Login page
│   ├── (authenticated)/              # Sidebar + header layout, permission-gated routes
│   │   ├── dashboard/                # KPI stats, charts, upcoming events, todos
│   │   ├── enquiry/, open-enquiry/   # Enquiry creation and management
│   │   ├── confirmed-events/         # Event detail: DJ, songs, guests, contracts, files, payments
│   │   ├── completed-events/         # Past events
│   │   ├── calendar/                 # Year-based calendar view
│   │   ├── rig-list/                 # Equipment rig list per event
│   │   ├── file-upload/, downloads/  # File and media management
│   │   ├── suppliers-report/, admin-report/  # Reporting
│   │   └── (users)/                  # Users, clients, venues, suppliers, packages, company,
│   │                                 # manage-access, email templates (tabbed CRUD section)
│   └── contract/[token]/             # Public contract signing page (no login required)
├── components/                       # Shared UI components (Button, Card, DataTable, etc.)
├── config/                           # Ant Design theme + provider setup
├── api/                              # API call functions + React Query hooks, one file per feature
├── hooks/                            # useAuth, useRole, useDebounce
├── lib/                              # Axios instance, fonts, user normalizer
└── types/                            # Shared TypeScript interfaces
```

## Auth Flow

1. `POST /api/user/auth` → returns access token (stored as a cookie) and sets an httpOnly refresh cookie.
2. Axios interceptor injects `Authorization: Bearer <token>` on every request.
3. On `401`, cookies are cleared and the user is redirected to `/login`.
4. The public contract-signing flow (`/contract/[token]`) uses a separate `PublicAxios` instance with no auth interceptor.

## State Management

No global store (no Redux/Zustand). TanStack React Query handles all server state; local UI state uses `useState`; sidebar collapse preference persists to `localStorage`; a few cross-component signals use browser `CustomEvent`s (`sidebar:toggle`, `dashboard:yearChange`).

## Permissions

Sidebar navigation and page access are gated by the same permission strings the backend enforces (e.g. `new enquiry`, `confirm event`, `user`, `admin reporting`), sourced from `authUser.permissions` via `useAuth`.

## Deployment

Deploy as a standard Next.js app (e.g. Vercel). Set `NEXT_PUBLIC_BASE_URL` to the deployed backend's URL and `NEXT_PUBLIC_LARAVEL_ENQUIRY_URL` to the production Laravel endpoint in the hosting platform's environment variable settings.
