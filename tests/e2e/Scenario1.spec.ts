import { test, expect } from '@playwright/test'
import { STUDENT } from './helpers'
import { applyMocks, setAuthState } from './mocks'

// NOTE: email verification is a backend flow — test confirms redirect to /pending-verification
// and then simulates the verified state by navigating to /verified directly (dev/test env only)

test('Scenario 1: student registers, verifies email, fills profile, submits Program A', async ({ page }) => {
    await applyMocks(page)
// --- Register ---
    await page.goto('/auth/register')

    await page.locator('input[placeholder="John"]').fill(STUDENT.firstName)
    await page.locator('input[placeholder="Pork"]').fill(STUDENT.lastName)
    await page.locator('input[type="email"]').fill(STUDENT.email)
    await page.locator('input[type="password"]').first().fill(STUDENT.password)
    await page.locator('input[type="password"]').nth(1).fill(STUDENT.password)

// role select — default is 'student', confirm it
    const roleSelect = page.locator('select').first()
    await expect(roleSelect).toHaveValue('student')

    await page.locator('#terms').check()
    await page.locator('#gdpr').check()
    await page.locator('button[type="submit"]').click()

    await page.waitForURL('/pending-verification')
    await expect(page).toHaveURL('/pending-verification')

// --- Simulate email verification (backend sends link to /verified) ---
    await page.goto('/verified')
    await setAuthState(page, 'student')

// --- Fill student profile ---
    await page.goto('/profile/complete')

    await page.locator('input[placeholder*="Applied Informatics"]').fill('Applied Informatics')

    const yearSelect = page.locator('select').first()
    await yearSelect.selectOption('1')

    await page.locator('input[placeholder*="UKF"]').fill('UKF Nitra')

    const academicCheckbox = page.locator('input[type="checkbox"]').first()
    await academicCheckbox.check()

    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/dashboard/)

// --- Navigate to Program A form ---
    await page.goto('/programs/a/upload')

// Step 1: pick team, project title, category, and academic declaration
    const teamSelect = page.locator('select').first()
    await teamSelect.selectOption({ index: 1 })

    await page.locator('input[type="text"]').first().fill('E2E Test Project Title')

    const categorySelect = page.locator('select').nth(1)
    await categorySelect.selectOption({ index: 1 })

    await page.locator('input[type="checkbox"]').first().check()

    await page.locator('button', { hasText: /Continue|Next/ }).click()

// Step 2: upload at least one required document
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles({
        name: 'executive_summary.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 test template content data'),
    })

    await page.locator('button[type="submit"]').click()

// Step 3: Success page validation
    await page.waitForSelector('text=🎉', { timeout: 5000 })
})