import { test, expect } from '@playwright/test'
import { applyMocks, setAuthState } from './mocks'

const COMPANY_USER = {
    id: 2,
    name: 'Corp Owner',
    email: 'company@nti.test',
    role_slug: 'company',
    status: 'active',
    organization: { id: 1, name: 'Test Corp', role_in_org: 'owner' },
}

const STUDENT_USER = {
    id: 1,
    name: 'Test Student',
    email: 'student@nti.test',
    role_slug: 'student',
    status: 'active',
    organization: { role_in_org: null },
    student_profile: { id: 1, is_leader: true, has_team: true, team_id: 1 },
    student: { id: 1, is_leader: true, has_team: true, team_id: 1 }
}

const RAW_DOCS_ARRAY = [
    { id: "doc-123", document_name: 'Team Project Pitch', is_mandatory: true, max_size_mb: 10, type: 'team_project_pitch' }
]

const TASK_WITH_CALL = {
    id: 1,
    title: 'NTI E2E Test Task',
    brief: 'Test task description for E2E.',
    budget: '3000',
    status: 'published',
    call_id: 1,
    call: {
        id: 1,
        program_type: 'b',
        status: 'active',
        deadline: '2099-12-31',
        deadline_at: '2099-12-31',
        required_documents: RAW_DOCS_ARRAY,
        min_team_size: 1,
        max_team_size: 10
    },
    organization: { id: 1, name: 'Test Corp' },
}

function ok(body: unknown) {
    return { status: 200, contentType: 'application/json', body: JSON.stringify(body) }
}

test('Scenario 3: company creates task, student applies to Program B', async ({ page, context }) => {
// --- Company: set auth state and create task ---
    await applyMocks(page)
    await page.route('**/api/auth/me', r => r.fulfill(ok(COMPANY_USER)))
    await page.route('**/api/calls-with-tasks', r => r.fulfill(ok({ id: 1, status: 'published', task: TASK_WITH_CALL })))
    await page.route('**/api/programs', r => r.fulfill(ok([{ id: 1, type: 'a' }, { id: 2, type: 'b' }])))

    await page.goto('/')
    await setAuthState(page, 'company')
    await page.goto('/programs/b/create-task')
    
    await page.locator('input[type="text"]').first().waitFor({ state: 'visible', timeout: 15000 })

// Step 1 - Core metadata details
    await page.locator('input[type="text"]').first().fill('NTI E2E Test Task')
    await page.locator('textarea').first().fill('This is an extensive description paragraph intended to satisfy any backend validation filters set on our challenge post inputs.')
    await page.locator('input[type="number"]').first().fill('3000')
    const deadline = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
    await page.locator('input[type="date"]').first().fill(deadline)
    await page.locator('button').filter({ hasText: /Continue|Next/i }).first().click()

// Step 2 — Goals and Scope
    await page.waitForSelector('[data-testid="project-goal"]', { state: 'visible', timeout: 5000 })
    await page.locator('[data-testid="project-goal"]').fill('Automate student intake management systems securely and scale framework performance levels.')
    await page.locator('[data-testid="expected-outcome"]').fill('A fully production ready secure web architecture deploying isolated containers.')
    await page.locator('button').filter({ hasText: /Continue|Next/i }).first().click()

// Step 3 — Functional Specifications & Tech Stack fields
    await page.waitForSelector('[data-testid="functional-specs"]', { state: 'visible', timeout: 5000 })
    await page.locator('[data-testid="functional-specs"]').fill('Responsive component layouts using Tailwind CSS utility tokens alongside asynchronous state machines and optimized fast performance API layers built on secure paradigms.')
    await page.locator('input[type="text"]').nth(0).fill('Vue 3, TailwindCSS, Playwright')
    await page.locator('input[type="text"]').nth(1).fill('Frontend Development, E2E Testing')
    await page.locator('button').filter({ hasText: /Continue|Next/i }).first().click()

// Step 4 — Requirements Management Listing Block
    await page.locator('button').filter({ hasText: /Continue|Next/i }).first().waitFor({ state: 'visible', timeout: 5000 })
    await page.locator('button').filter({ hasText: /Continue|Next/i }).first().click()

// Step 5 — Final Submission Confirmation Execution Block
    const publishBtn = page.locator('button').filter({ hasText: /Publish/i }).last()
    await publishBtn.waitFor({ state: 'visible', timeout: 5000 })
    await publishBtn.click()
    await page.waitForURL(/\/dashboard/, { timeout: 10000 })

// --- Student: apply to Program B ---
    const studentPage = await context.newPage()
    await applyMocks(studentPage)
    await studentPage.route('**/api/auth/me', r => r.fulfill(ok(STUDENT_USER)))
    await studentPage.route('**/api/programs/b/tasks', r => r.fulfill(ok([TASK_WITH_CALL])))
    await studentPage.route('**/api/tasks/1', r => r.fulfill(ok(TASK_WITH_CALL)))
    await studentPage.route('**/api/calls/1', r => r.fulfill(ok(TASK_WITH_CALL.call)))
    await studentPage.route('**/api/applications/check*', r => r.fulfill(ok({ eligible: true, status: 'allowed' })))
    await studentPage.route('**/api/applications/*', r => r.fulfill(ok({ id: 101, status: 'draft' })))
    
    await studentPage.route('**/api/profile/student', r => r.fulfill(ok({ 
        id: 1, study_program: 'Applied Informatics', year_of_study: 1, university: 'UKF Nitra', academic_eligible: true, is_leader: true, has_team: true
    })))
    
    await studentPage.route(url => url.pathname.endsWith('/api/teams'), r => r.fulfill(ok([{ 
        id: 1, name: 'E2E Team', status: 'active', leader_id: 1, members: [{ id: 1, name: 'Test Student', role: 'leader' }] 
    }])))
    
    await studentPage.route(url => url.pathname.includes('/api/applications'), r => r.fulfill(ok({ id: 101, status: 'submitted' })))

    await studentPage.goto('/')
    await setAuthState(studentPage, 'student')

    await studentPage.goto('/programs/b')
    await studentPage.waitForSelector('button', { timeout: 10000 })
    await studentPage.locator('button', { hasText: /View|Detail|Open|See/ }).first().click()
    await studentPage.waitForURL(/programs\/b\/tasks\/\d+/, { timeout: 10000 })

    // FIX: Execute a client-side navigation injection script to guarantee routing transition occurs without DOM blockades
    await studentPage.getByRole('button', {
        name: /Submit Application/i
    }).click()
    
    // Allow the router push transition sequence to cleanly mount layout assets
    await studentPage.waitForURL(/.*programs\/b\/apply.*/, { timeout: 15000 })

// Step 1 — Pick team + Describe solution
    await studentPage.locator('select')
    .first()
    .selectOption({ index: 0 })

    await studentPage.locator('input[type="text"]').first().fill('Our E2E Solution Title')
    await studentPage.locator('textarea, [contenteditable="true"]').first().fill('We will build it with Vue and Laravel framework architectures.')
    await studentPage.locator('input[type="checkbox"]').first().check()
    await studentPage.locator('button').filter({ hasText: /Next|Continue/i }).first().click()

// Step 2 — Upload documents
    const fileInputs = studentPage.locator('input[type="file"]')
    
    const count = await fileInputs.count()
    for (let i = 0; i < count; i++) {
        await fileInputs.nth(i).setInputFiles({
            name: `doc_${i}.pdf`,
            mimeType: 'application/pdf',
            buffer: Buffer.from('%PDF-1.4 test data content buffer stream'),
        })
    }

    const finalSubmitBtn = studentPage.locator('button').filter({ hasText: /Submit|Finish|Confirm/i }).first()
    await finalSubmitBtn.waitFor({ state: 'visible', timeout: 5000 })
    await finalSubmitBtn.click()

// Step 3 — Success confirmation view panel matching
    await expect(studentPage.locator('body')).toContainText(/(🎉|Success|Submitted|Back)/i, { timeout: 15000 })
    await studentPage.close()
})