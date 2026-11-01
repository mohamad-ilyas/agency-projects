/** US-1 Name: AC-1.1 .. AC-1.3 */
import { describe, expect, it } from 'vitest'
import { validateName } from '../lib/name'
import { MemoryBroker } from '../lib/transport'
import { enterName, mount } from './helpers'

describe('US-1 Name', () => {
  it('AC-1.1 empty or whitespace-only name is blocked with an inline error', async () => {
    const a = mount(new MemoryBroker(), 'us1-a')
    await a.user.click(a.q.getByRole('button', { name: 'Continue' }))
    expect(a.q.getByRole('alert')).toHaveTextContent('Enter your name.')
    const input = a.q.getByLabelText('Your name')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input.getAttribute('aria-describedby')).toContain(a.q.getByRole('alert').id)

    await a.user.type(input, '   \t ')
    await a.user.click(a.q.getByRole('button', { name: 'Continue' }))
    expect(a.q.getByRole('alert')).toHaveTextContent('Enter your name.')
    // Still on the name form; nothing saved.
    expect(a.q.queryByRole('button', { name: /Create game/ })).toBeNull()
    expect(localStorage.getItem('us1-a:name')).toBeNull()
    expect(validateName('   ')).toEqual({ ok: false, error: 'empty' })
  })

  it('AC-1.2 a name longer than 20 characters after trimming is blocked; 1-20 trimmed chars are accepted', async () => {
    expect(validateName('x'.repeat(21))).toEqual({ ok: false, error: 'tooLong' })
    expect(validateName(`  ${'x'.repeat(20)}  `)).toEqual({ ok: true, name: 'x'.repeat(20) })
    expect(validateName('a')).toEqual({ ok: true, name: 'a' })
    // Counted in characters (code points), so a 20-letter Arabic name is allowed.
    expect(validateName('م'.repeat(20)).ok).toBe(true)
    expect(validateName('م'.repeat(21)).ok).toBe(false)

    const a = mount(new MemoryBroker(), 'us1-b')
    await enterName(a, 'y'.repeat(21))
    expect(a.q.getByRole('alert')).toHaveTextContent('Use 20 characters or fewer.')
    expect(a.q.queryByRole('button', { name: /Create game/ })).toBeNull()

    await a.user.clear(a.q.getByLabelText('Your name'))
    await enterName(a, `   ${'z'.repeat(20)}   `)
    expect(await a.q.findByText('z'.repeat(20))).toBeInTheDocument()
    expect(localStorage.getItem('us1-b:name')).toBe('z'.repeat(20))
  })

  it('AC-1.3 a saved name is prefilled on revisit and can be changed', async () => {
    const broker = new MemoryBroker()
    const a = mount(broker, 'us1-c')
    await enterName(a, 'Alice')
    expect(await a.q.findByText('Alice')).toBeInTheDocument()
    a.unmount()

    const again = mount(broker, 'us1-c')
    // Revisit goes straight to the lobby with the saved name …
    expect(await again.q.findByText('Alice')).toBeInTheDocument()
    await again.user.click(again.q.getByRole('button', { name: 'Change name' }))
    // … and the form is prefilled.
    const input = again.q.getByLabelText('Your name')
    expect(input).toHaveValue('Alice')
    await again.user.clear(input)
    await enterName(again, 'Alicia')
    expect(await again.q.findByText('Alicia')).toBeInTheDocument()
    again.unmount()

    const third = mount(broker, 'us1-c')
    expect(await third.q.findByText('Alicia')).toBeInTheDocument()
  })
})
