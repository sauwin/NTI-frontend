# NTI Frontend

Single-page web application for the **NTI platform** — a system for managing student and company applications, programme calls, evaluations, mentorships and public content. Users register, complete a profile, apply to a programme call, and follow their application through evaluation and onboarding. Administrators manage calls, users, organisations and reports.

The frontend talks to the Laravel REST API in the **BE_NTI** repository.

## About

NTI Frontend is a Vue 3 SPA written in TypeScript. Code is organised by feature (auth, applications, admin, company, …) rather than by file type, so each feature owns its API calls, components, pages, stores, types and translations. Authentication uses a Bearer token issued by the backend and stored in a Pinia store; route guards handle login and role checks.

## Features

- Registration, login, email verification, forgot / reset password
- Role-based dashboards and route guards (7 roles)
- Student profile with a mandatory "complete your profile" step
- **Programme A** — application with document upload (students)
- **Programme B** — companies publish tasks, students apply to them
- Application detail, editing, revision requests and status tracking
- Evaluations with criteria, plus a final verdict panel for admins
- Mentorships and milestones
- Admin panel: calls, evaluators, evaluation criteria, users, organisations, bulk notifications, audit logs, dashboard statistics
- Articles with a rich-text editor (Tiptap) and public article pages
- FAQ and partners pages
- Export of data to Excel / PDF / Word (xlsx, jsPDF, docx)
- English and Slovak interface (vue-i18n)
- SEO helpers, `sitemap.xml` and `robots.txt`
- End-to-end tests with Playwright (including responsive checks)

## Roles

| Role           | Slug             | Main access                       |
| -------------- | ---------------- | --------------------------------- |
| Student        | `student`        | Applications, profile, milestones |
| Company        | `company`        | Company tasks and dashboard       |
| Mentor         | `mentor`         | Mentorships                       |
| Evaluator      | `evaluator`      | Application evaluations           |
| Content Editor | `content_editor` | Articles                          |
| NTI Admin      | `nti_admin`      | Administration                    |
| Super Admin    | `super_admin`    | Administration, admin accounts    |

## Tech Stack

| Layer            | Technology                              |
| ---------------- | --------------------------------------- |
| Framework        | Vue 3 (Composition API)                 |
| Language         | TypeScript                              |
| Build tool       | Vite                                    |
| Styling          | Tailwind CSS v4                         |
| State management | Pinia                                   |
| Routing          | Vue Router                              |
| HTTP client      | Axios                                   |
| i18n             | vue-i18n (EN / SK)                      |
| Rich text        | Tiptap                                  |
| Documents        | docx, jsPDF + autotable, xlsx           |
| Head / SEO       | unhead, @vueuse/head                    |
| E2E testing      | Playwright                              |
| Containerisation | Docker (Node 22)                        |

## Project Structure

```text
FE_NTI/
├── public/                  # favicon, logo, robots.txt, sitemap.xml
├── src/
│   ├── app/
│   │   ├── layouts/         # MainLayout, FormLayout
│   │   ├── pages/           # Home, Dashboard, NotFound
│   │   ├── plugins/         # i18n setup
│   │   ├── router/          # router, guards, routes split by area
│   │   ├── styles/          # global Tailwind styles
│   │   └── main.ts          # application entry point
│   ├── features/
│   │   ├── about/  admin/  applications/  articles/  auth/
│   │   ├── company/  evaluation/  faq/  mentor/  milestones/
│   │   ├── partners/  program_a/  program_b/  student/  tasks/
│   │   └── <name>/          # api/ components/ locales/ pages/ stores/ types/
│   └── shared/
│       ├── api/             # axios instance, calls, documents, notifications
│       ├── components/      # Navbar, Footer, Pagination, ConfirmDialog, …
│       ├── composables/     # useConfirm
│       ├── locales/         # shared en.json / sk.json
│       ├── seo/             # SEO map and useSeo composable
│       ├── types/
│       └── ui/              # PageHero, PageSection
├── tests/e2e/               # Playwright scenarios and responsive tests
├── Dockerfile
├── docker-compose.yml
├── playwright.config.ts
├── vite.config.ts
└── package.json
```

## Getting Started

### Prerequisites

- Node.js `^20.19.0` or `>=22.12.0`
- npm
- The **BE_NTI** backend running on `http://localhost:8000` (see its README)

### Setup

```sh
git clone https://github.com/your-username/FE_NTI.git
cd FE_NTI
npm install
npm run dev
```

The app is available at `http://localhost:5173`.

### Configuration

The API base URL is currently hard-coded in `src/shared/api/axios.ts`:

```ts
const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    withCredentials: true,
})
```

Change `baseURL` there if the backend runs elsewhere. The backend must also allow the frontend origin (`CORS_ALLOWED_ORIGINS` and `SANCTUM_STATEFUL_DOMAINS` in the BE `.env`).

### Scripts

| Command              | Description                                   |
| -------------------- | --------------------------------------------- |
| `npm run dev`        | Start the Vite dev server                     |
| `npm run build`      | Type-check (`vue-tsc`) and build to `dist/`   |
| `npm run build-only` | Build without type-checking                   |
| `npm run type-check` | Type-check only                               |
| `npm run preview`    | Serve the production build locally            |

### Docker

```sh
docker compose up
```

The dev server is exposed on port `5173`.

## Authentication Flow

1. The user registers and is redirected to `/pending-verification` until the email is confirmed.
2. After login the backend returns a token, which is kept in the auth store (`features/auth/stores/auth.ts`).
3. An Axios request interceptor adds `Authorization: Bearer <token>` to every API call.
4. Router guards (`app/router/guards.ts`) check authentication and roles:
   - unauthenticated users are redirected to `/auth/login`
   - users without the required role are redirected to `/unauthorized`
   - students with an incomplete profile are redirected to `/profile/complete`

## Routes

### Public

| Path          | Page           |
| ------------- | -------------- |
| `/`           | Home           |
| `/programs/a` | Programme A    |
| `/programs/b` | Programme B    |
| `/about`      | About          |
| `/faq`        | FAQ            |
| `/partners`   | Partners       |
| `/privacy`    | Privacy Policy |
| `/terms`      | Terms of Use   |
| `/article`, `/article/:id` | Articles |

### Authentication

| Path                    | Page                |
| ----------------------- | ------------------- |
| `/auth/login`           | Login               |
| `/auth/register`        | Register            |
| `/auth/forgot-password` | Forgot password     |
| `/auth/reset-password`  | Reset password      |
| `/pending-verification` | Email verification  |
| `/verified`             | Verification result |

### Authenticated

| Path                                              | Access  | Page                    |
| ------------------------------------------------- | ------- | ----------------------- |
| `/dashboard`                                      | All     | Dashboard               |
| `/profile`, `/profile/complete`                   | Student | Profile and setup       |
| `/mentor-profile`                                 | Mentor  | Mentor profile          |
| `/programs/a/upload`                              | Student | Programme A application |
| `/programs/b/apply/:id`                           | Student | Programme B application |
| `/programs/b/create-task`                         | Company | Create task             |
| `/programs/b/tasks/:id`                           | All     | Task details            |
| `/applications/:id`, `/applications/:id/edit`     | All     | Application view / edit |
| `/evaluations/application/:applicationId`         | Evaluator | Evaluation form       |
| `/evaluations/application/:applicationId/final-verdict` | Admin | Final verdict     |
| `/article/create`, `/article/edit/:id`            | Editor  | Article editor          |

## Internationalisation

The interface supports English and Slovak. The selected locale is stored in `localStorage` under the `locale` key.

Translations live next to the code they belong to:

```text
features/<name>/locales/
├── en.json
└── sk.json
```

Shared strings are in `src/shared/locales/`. All files are merged in `src/app/plugins/i18n.ts`.

## Testing

End-to-end tests use Playwright and mock the API, so the backend is not required:

```sh
npx playwright install webkit chromium
npx playwright test                 # functional scenarios (WebKit)
RESPONSIVE=1 npx playwright test    # mobile / tablet / desktop checks
```

Playwright builds the app and starts `npm run preview` on port 5173 automatically. Scenarios cover student registration and Programme A submission, plus responsive views for the student, company and admin dashboards.

## Related Repositories

- **BE_NTI** — Laravel REST API used by this frontend
