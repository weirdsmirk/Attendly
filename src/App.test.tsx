import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { store, __resetStoreForTests } from './lib/store'
import { __resetSettingsForTests, INITIAL_SETTINGS_FOR_TEST } from './lib/settings'
import { ToastProvider } from './components/Toast'
import { todayInput } from './lib/attendance'

function renderApp() {
  return render(
    <ToastProvider>
      <App />
    </ToastProvider>,
  )
}

beforeEach(() => {
  __resetStoreForTests()
  __resetSettingsForTests(INITIAL_SETTINGS_FOR_TEST)
  window.location.hash = ''
  localStorage.clear()
})

describe('app shell', () => {
  it('renders the overview with real store data', async () => {
    store.addSubject({ name: 'Database Systems', code: 'CS302', teacher: 'Dr. Priya Nair', credits: 4 })
    renderApp()
    expect(await screen.findByText('Overall attendance')).toBeInTheDocument()
    expect(screen.getByText('Classes attended')).toBeInTheDocument()
    expect(screen.getByText('Current streak')).toBeInTheDocument()
    expect(screen.getByText('Subject overview')).toBeInTheDocument()
    expect(screen.getByText('1 subjects')).toBeInTheDocument()
  })

  it('navigates between all four views from the sidebar', async () => {
    const user = userEvent.setup()
    renderApp()
    await screen.findByText('Subject overview')

    await user.click(screen.getByRole('button', { name: 'Subjects' }))
    expect(await screen.findByRole('heading', { name: 'Subjects' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Timetable' }))
    expect(await screen.findByRole('heading', { name: 'Timetable' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Attendance log' }))
    expect(await screen.findByRole('heading', { name: 'Attendance log' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Overview' }))
    expect(await screen.findByText('Subject overview')).toBeInTheDocument()
  })

  it('filters subjects from the header search and shows the result count', async () => {
    const user = userEvent.setup()
    store.addSubject({ name: 'Database Systems', code: 'CS302' })
    store.addSubject({ name: 'Computer Networks', code: 'CS304' })
    renderApp()
    await screen.findByText('Subject overview')

    await user.type(screen.getByRole('searchbox', { name: 'Search subjects' }), 'Networks')
    expect(await screen.findByRole('heading', { name: 'Subjects' })).toBeInTheDocument()
    expect(screen.getByText(/1 result for/)).toBeInTheDocument()
    expect(screen.getByText('Computer Networks')).toBeInTheDocument()
  })
})

describe('attendance marking', () => {
  it('marks once per subject per day no matter how many times it is tapped', async () => {
    const user = userEvent.setup()
    const created = store.addSubject({ name: 'Database Systems', code: 'CS302' })
    renderApp()
    await screen.findByText('Subject overview')
    await user.click(screen.getByRole('button', { name: 'Subjects' }))
    await screen.findByRole('heading', { name: 'Subjects' })

    const add = screen.getByRole('button', { name: 'Mark present' })
    await user.click(add)

    // The button now reports the day as done and refuses further taps.
    const done = screen.getByRole('button', { name: 'Present today' })
    expect(done).toBeDisabled()
    await user.click(done)

    const records = store.exportSnapshot().records.filter((r) => r.subject_id === created.id)
    expect(records).toHaveLength(1)
    expect(records[0].date).toBe(todayInput())
    expect(records[0].status).toBe('Attended')
  })
})

describe('settings', () => {
  it('switches the timetable between weekdays and the full week', async () => {
    const user = userEvent.setup()
    store.addSubject({ name: 'Database Systems', code: 'CS302' })
    renderApp()
    await screen.findByText('Subject overview')

    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await user.click(await screen.findByRole('button', { name: 'Weekdays (Mon–Fri)' }))
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Timetable' }))
    await screen.findByRole('heading', { name: 'Timetable' })

    expect(screen.queryByRole('heading', { name: 'Saturday' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Monday' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Friday' })).toBeInTheDocument()
  })

  it('exports a backup from settings', async () => {
    const user = userEvent.setup()
    store.addSubject({ name: 'Database Systems', code: 'CS302' })
    renderApp()
    await screen.findByText('Subject overview')

    await user.click(screen.getByRole('button', { name: 'Settings' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/1 subjects · 0 classes · 0 records/)).toBeInTheDocument()
  })
})

describe('profile and theme', () => {
  it('edits the profile from the top bar and greets the new name', async () => {
    const user = userEvent.setup()
    renderApp()
    await screen.findByText('Subject overview')

    await user.click(screen.getByRole('button', { name: 'Open profile' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Edit Profile' }))
    const input = within(dialog).getByLabelText('Name *')
    await user.clear(input)
    await user.type(input, 'Sam Okoye')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/, Sam$/)
    expect(screen.getByRole('button', { name: 'Open profile' })).toHaveTextContent('SO')
  })

  it('toggles dark mode on the document element', async () => {
    const user = userEvent.setup()
    renderApp()
    await screen.findByText('Subject overview')

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }))
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})

describe('subject management', () => {
  it('creates a subject through the modal and it appears on the page', async () => {
    const user = userEvent.setup()
    renderApp()
    await screen.findByText('Subject overview')
    await user.click(screen.getByRole('button', { name: 'Subjects' }))
    await screen.findByRole('heading', { name: 'Subjects' })

    await user.click(screen.getByRole('button', { name: 'Add subject' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Subject Name *'), 'Applied Mathematics')
    await user.type(within(dialog).getByLabelText('Code *'), 'MA201')
    await user.click(within(dialog).getByRole('button', { name: 'Add Subject' }))

    expect(await screen.findByText('Applied Mathematics')).toBeInTheDocument()
    expect(store.exportSnapshot().subjects).toHaveLength(1)
  })

  it('shows a validation error instead of saving a blank code', async () => {
    const user = userEvent.setup()
    renderApp()
    await screen.findByText('Subject overview')
    await user.click(screen.getByRole('button', { name: 'Subjects' }))
    await screen.findByRole('heading', { name: 'Subjects' })
    await user.click(screen.getByRole('button', { name: 'Add subject' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Subject Name *'), 'No Code')
    // Whitespace satisfies the native `required` attribute, so the stricter
    // trim check in the store is what must reject it.
    await user.type(within(dialog).getByLabelText('Code *'), '   ')
    await user.click(within(dialog).getByRole('button', { name: 'Add Subject' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/code is required/i)
    expect(store.exportSnapshot().subjects).toHaveLength(0)
  })

  it('opens details from the card menu and can add a record', async () => {
    const user = userEvent.setup()
    store.addSubject({ name: 'Database Systems', code: 'CS302' })
    renderApp()
    await screen.findByText('Subject overview')
    await user.click(screen.getByRole('button', { name: 'Subjects' }))
    await screen.findByRole('heading', { name: 'Subjects' })

    await user.click(screen.getByRole('button', { name: 'Options for Database Systems' }))
    await user.click(await screen.findByRole('menuitem', { name: 'View details' }))
    const dialog = await screen.findByRole('dialog')
    await user.selectOptions(within(dialog).getByLabelText('Record status'), 'Skipped')
    await user.click(within(dialog).getByRole('button', { name: /Add/ }))

    const records = store.exportSnapshot().records
    expect(records).toHaveLength(1)
    expect(records[0].status).toBe('Skipped')
  })
})

describe('dialog accessibility', () => {
  it('closes on Escape and returns focus to the opener', async () => {
    const user = userEvent.setup()
    renderApp()
    await screen.findByText('Subject overview')
    await user.click(screen.getByRole('button', { name: 'Subjects' }))
    await screen.findByRole('heading', { name: 'Subjects' })
    const addButton = screen.getByRole('button', { name: 'Add subject' })
    await user.click(addButton)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(addButton).toHaveFocus()
  })
})
