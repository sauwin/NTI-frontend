import type { Page, BrowserContext } from '@playwright/test'

const STUDENT_USER = {
    id: 1,
    name: 'Test Student',
    email: 'student@nti.test',
    role_slug: 'student',
    status: 'active',
    organization: { role_in_org: null },
}

const COMPANY_USER = {
    id: 2,
    name: 'Corp Owner',
    email: 'company@nti.test',
    role_slug: 'company',
    status: 'active',
    organization: { id: 1, name: 'Test Corp', role_in_org: 'owner' },
}

const ADMIN_USER = {
    id: 3,
    name: 'Admin',
    email: 'admin@nti.test',
    role_slug: 'nti_admin',
    status: 'active',
    organization: { role_in_org: null },
}

const TOKEN = 'fake-token-for-e2e'

const STUDENT_PROFILE = {
    id: 1,
    study_program: 'Applied Informatics',
    year_of_study: 1,
    university: 'UKF Nitra',
    academic_eligible: true,
}

const TEAM = {
    id: 1,
    name: 'E2E Team',
    leader_id: 1,
    members: [
        { id: 2, pivot: { status: 'accepted' } },
        { id: 3, pivot: { status: 'accepted' } },
        { id: 4, pivot: { status: 'accepted' } },
    ],
}

const ACTIVE_CALL = {
    id: 1,
    program_type: 'a',
    status: 'active',
    deadline: '2099-12-31',
    required_documents: [
        { document_name: 'Executive Summary', is_mandatory: true, max_size_mb: 10 },
    ],
    task: null,
}

const APPLICATION = {
    id: 1,
    status: 'submitted',
    team_id: 1,
    call_id: 1,
    score: null,
}

const ROBUST_APPLICATION = {
    id: 1,
    status: 'approved', // Must be approved for mentorship assignment visibility eligibility rules
    applicant_type: 'team',
    team_id: 1,
    call_id: 1,
    call_name: 'Spring Call 2026',
    program_type: 'a',
    team: { name: 'E2E Team' },
    student_profile: {
        user: { first_name: 'John', last_name: 'Pork', email: 'student@nti.test' }
    }
}

const MENTORS = [
    { id: 10, name: 'Mentor One', email: 'mentor@nti.test', role_slug: 'mentor', roles: [{ slug: 'mentor' }] },
]

const APPLICATIONS_LIST = [
    {
        id: 1,
        status: 'submitted', 
        applicant_type: 'team', 
        team: { name: 'E2E Team' },
        student_profile: {
            user: { first_name: 'John', last_name: 'Pork', email: 'student@nti.test' }
        },
        call_name: 'Spring Call 2026',
        program_type: 'a',
        call: { id: 1, program_type: 'a' },
    },
]

const DASHBOARD_STATS = {
    total_applications: 1,
    active_calls: 1,
    approved: 0,
    pending: 1,
}

const TASK_WITH_CALL = {
    id: 1,
    title: 'NTI E2E Test Task',
    brief: 'Test task',
    budget: '3000',
    status: 'published',
    call: ACTIVE_CALL,
    organization: { id: 1, name: 'Test Corp' },
}

function ok(body: unknown) {
    return {
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
    }
}

function resolveUserByEmail(email: string) {
    if (email.includes('admin')) return ADMIN_USER
    if (email.includes('company')) return COMPANY_USER
    return STUDENT_USER
}

export async function applyMocks(page: Page) {
// auth
    await page.route('**/api/auth/register', r => r.fulfill(ok({ message: 'ok', token: TOKEN, user: COMPANY_USER })))

    await page.route('**/api/auth/logout', r => r.fulfill(ok({ message: 'ok' })))
    let loggedInUser: typeof STUDENT_USER | typeof ADMIN_USER | typeof COMPANY_USER = STUDENT_USER

    await page.route('**/api/auth/login', async r => {
        const body = JSON.parse(r.request().postData() ?? '{}')
        loggedInUser = resolveUserByEmail(body.email ?? '')
        r.fulfill(ok({ token: TOKEN, user: loggedInUser }))
    })
    await page.route('**/api/auth/me', r => r.fulfill(ok(loggedInUser)))
    await page.route('**/api/auth/role-status', r => r.fulfill(ok({ approved: true })))

// profile
    await page.route('**/api/profile/student', async r => {
        if (r.request().method() === 'POST') return r.fulfill(ok(STUDENT_PROFILE))
        return r.fulfill(ok(STUDENT_PROFILE))
    })
    await page.route('**/api/profile', async r => {
        if (r.request().method() === 'PUT') return r.fulfill(ok(STUDENT_PROFILE))
        return r.fulfill(ok(STUDENT_PROFILE))
    })

// mentor profile
    await page.route('**/api/mentor-profile', r => r.fulfill(ok({ id: 10, bio: '' })))

// company profile
    await page.route('**/api/company-profile', async r => {
        if (r.request().method() === 'PUT') return r.fulfill(ok(COMPANY_USER.organization))
        return r.fulfill(ok(COMPANY_USER.organization))
    })

// teams
    await page.route('**/api/teams', async r => {
        if (r.request().method() === 'POST') return r.fulfill(ok(TEAM))
        return r.fulfill(ok([TEAM]))
    })
    await page.route('**/api/user/invitations', r => r.fulfill(ok([])))

// calls
    await page.route('**/api/calls/active/a', r => r.fulfill(ok(ACTIVE_CALL)))
    await page.route('**/api/calls/active/b', r => r.fulfill(ok({ ...ACTIVE_CALL, program_type: 'b', task: TASK_WITH_CALL })))
    await page.route('**/api/calls/active', r => r.fulfill(ok([ACTIVE_CALL])))
    await page.route('**/api/calls/1', r => r.fulfill(ok(ACTIVE_CALL)))

// applications
    await page.route('**/api/applications', async r => {
        if (r.request().method() === 'POST') return r.fulfill(ok(APPLICATION))
        return r.fulfill(ok({
            current_page: 1,
            last_page: 1,
            total: 1,
            data: [ROBUST_APPLICATION]
        }))
    })
    await page.route('**/api/applications/1', r => r.fulfill(ok(APPLICATION)))
    await page.route('**/api/applications/1/submit', r => r.fulfill(ok({ message: 'submitted' })))
    await page.route('**/api/applications/1/status', r => r.fulfill(ok({ ...APPLICATION, status: 'approved' })))
    await page.route('**/api/applications/1/documents', r => r.fulfill(ok([])))

// documents
    await page.route('**/api/documents/upload', r => r.fulfill(ok({ id: 1, file_name: 'doc.pdf' })))

// programs
    await page.route('**/api/programs', r => r.fulfill(ok([{ id: 1, type: 'a' }, { id: 2, type: 'b' }])))
    await page.route('**/api/programs/b/tasks', r => r.fulfill(ok([TASK_WITH_CALL])))

// tasks
    await page.route('**/api/calls-with-tasks', r => r.fulfill(ok({ call: ACTIVE_CALL, task: TASK_WITH_CALL })))
    await page.route('**/api/tasks/1', r => r.fulfill(ok(TASK_WITH_CALL)))

// notifications
    await page.route('**/api/notifications', r => r.fulfill(ok([])))

// admin
    await page.route('**/api/admin/reporting/dashboard-stats', r => r.fulfill(ok(DASHBOARD_STATS)))
    await page.route('**/api/admin/applications/1', r => r.fulfill(ok(APPLICATION)))

    await page.route('**/api/admin/applications*', async r => {
        return r.fulfill(ok({
            current_page: 1,
            last_page: 1,
            total: 1,
            data: [ROBUST_APPLICATION]
        }))
    })

    await page.route('**/api/admin/users', r => r.fulfill(ok([STUDENT_USER, COMPANY_USER])))
    await page.route('**/api/admin/admin-users', r => r.fulfill(ok([ADMIN_USER])))
    await page.route('**/api/admin/mentorships', r => r.fulfill(ok([
        { id: 1, application_id: 1, mentor_id: 10 }
    ])))
    await page.route('**/api/admin/programs', r => r.fulfill(ok([{ id: 1, type: 'a' }, { id: 2, type: 'b' }])))
    await page.route('**/api/admin/calls', r => r.fulfill(ok([ACTIVE_CALL])))
    await page.route('**/api/admin/approvals', r => r.fulfill(ok([])))
    await page.route('**/api/admin/logs', r => r.fulfill(ok([])))
    await page.route('**/api/admin/documents', r => r.fulfill(ok([])))

// mentorships assign
    await page.route('**/api/mentorships/assign', r => r.fulfill(ok({ message: 'assigned', id: 1 })))
    await page.route('**/api/mentorships', r => r.fulfill(ok([
        { id: 1, application_id: 1, mentor_id: 10 }
    ])))

// users with mentor role for assign dropdown
    await page.route('**/api/admin/users*', r => r.fulfill(ok([STUDENT_USER, { ...MENTORS[0] }])))
}

export async function applyMocksToContext(context: BrowserContext) {
    await context.route('**/api/**', async r => {
        if (r.request().frame().page().isClosed()) return r.abort()
        r.fulfill(ok({ data: [], message: 'ok' }))
    })
}
export async function setAuthState(page: Page, user: 'student' | 'admin' | 'company') {
    const map = { student: STUDENT_USER, admin: ADMIN_USER, company: COMPANY_USER }
    const u = map[user]
    await page.evaluate(({ token, user }) => {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
    }, { token: TOKEN, user: u })
}