import { expect, test } from '@playwright/test'

const answer = { answer: 'Dhruv leads MedChron at Omnis AI, as product lead and senior engineer.', sources: ['MedChron', 'Experience'] }

test.describe('DhruvBot', () => {
  test('opens, asks a starter, types the answer, shows sources, and a source scrolls the 2D page', async ({ page }) => {
    await page.route('**/api/ask', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(answer) }))
    await page.goto('/')
    const open = page.getByRole('button', { name: 'Ask DhruvBot' })
    await expect(open).toBeVisible()
    await open.click()
    const dialog = page.getByRole('dialog', { name: 'DhruvBot' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText("Answers from Dhruv's record only")).toBeVisible()
    await dialog.getByRole('button', { name: 'How does MedChron work?' }).click()
    await expect(dialog.getByTestId('dbot-msg-user').first()).toHaveText('How does MedChron work?')
    await expect(dialog.getByTestId('dbot-msg-bot').first()).toContainText('product lead and senior engineer', { timeout: 10_000 })
    const chip = dialog.getByRole('button', { name: 'Source: Experience' })
    await expect(chip).toBeVisible()
    await chip.click()
    await expect(dialog).toBeHidden()
    await expect.poll(() => page.evaluate(() => Math.abs(document.querySelector('#experience')!.getBoundingClientRect().top) < 300)).toBe(true)
  })

  test('shows the resting line on 503, and Escape closes with focus back on the button', async ({ page }) => {
    await page.route('**/api/ask', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'DhruvBot is resting. Email Dhruv at dhruvgopani8@gmail.com.' }) }))
    await page.goto('/drive?scene=off')
    await page.getByRole('button', { name: 'Ask DhruvBot' }).click()
    const dialog = page.getByRole('dialog', { name: 'DhruvBot' })
    await dialog.getByRole('textbox').fill('Is he open to relocation?')
    await dialog.getByRole('textbox').press('Enter')
    await expect(dialog.getByTestId('dbot-msg-bot').first()).toContainText('DhruvBot is resting')
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('button', { name: 'Ask DhruvBot' })).toBeFocused()
  })

  test('refuses a link before sending', async ({ page }) => {
    let called = false
    await page.route('**/api/ask', (route) => {
      called = true
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(answer) })
    })
    await page.goto('/resume')
    await page.getByRole('button', { name: 'Ask DhruvBot' }).click()
    const dialog = page.getByRole('dialog', { name: 'DhruvBot' })
    await dialog.getByRole('textbox').fill('look at https://example.com')
    await dialog.getByRole('textbox').press('Enter')
    await expect(dialog.getByText('no links')).toBeVisible()
    expect(called).toBe(false)
  })

  test('phone: the panel is a sheet and nothing overflows sideways', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'phone', 'phone layout only')
    await page.route('**/api/ask', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(answer) }))
    await page.goto('/')
    await page.getByRole('button', { name: 'Ask DhruvBot' }).click()
    const box = (await page.getByRole('dialog', { name: 'DhruvBot' }).boundingBox())!
    expect(box.width).toBeGreaterThan(380)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)
  })
})
