/** UI checks for review findings F-05, F-06, F-09 (docs/review.md). */
import { fireEvent, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LOBBY_IDLE_MS } from '../lib/room'
import { MemoryBroker } from '../lib/transport'
import { advance, createGame, enterName, mount, press, settle, startGame, typeName, useFakeClock } from './helpers'

afterEach(() => {
  vi.useRealTimers()
})

describe('review fixes (UI)', () => {
  it('F-05 a waiting host who stays online is still listed after more than 10 minutes', async () => {
    useFakeClock()
    const broker = new MemoryBroker()
    const host = mount(broker, 'rf-a-host')
    await settle()
    await typeName(host, 'Hana')
    await press(host.q.getAllByRole('button', { name: /Create game/ })[0])
    const viewer = mount(broker, 'rf-a-viewer')
    await settle()
    await typeName(viewer, 'Zed')
    await advance(LOBBY_IDLE_MS + 5 * 60_000)
    expect(viewer.q.getByTestId('lobby-list')).toHaveTextContent('Hana’s game')
    host.unmount() // host gone → refreshes stop → idle after 10 min
    await advance(LOBBY_IDLE_MS + 60_000)
    expect(viewer.q.getByTestId('lobby-empty')).toBeInTheDocument()
  })

  it('F-06 names are isolated with <bdi> in lobby titles, the turn heading and the live region', async () => {
    const broker = new MemoryBroker()
    const host = mount(broker, 'rf-b-host')
    await enterName(host, 'Alice')
    await createGame(host)
    const viewer = mount(broker, 'rf-b-viewer')
    await enterName(viewer, 'Zed')
    const title = (await viewer.q.findByTestId('lobby-list')).querySelector('.game-item__title')!
    expect(title).toHaveTextContent('Alice’s game')
    expect([...title.querySelectorAll('bdi')].map((b) => b.textContent)).toEqual(['Alice'])

    const { host: h2, guest } = await startGame(broker, 'rf-b2')
    await waitFor(() => expect(guest.q.getByTestId('turn')).toHaveTextContent('Alice’s turn'))
    expect([...guest.q.getByTestId('turn').querySelectorAll('bdi')].map((b) => b.textContent)).toEqual(['Alice'])
    await waitFor(() => expect(h2.q.getByTestId('live-region')).toHaveTextContent('Bob joined.'))
    expect(h2.q.getByTestId('live-region').querySelector('bdi')).toHaveTextContent('Bob')
    expect(h2.q.getByTestId('live-region').textContent).not.toMatch(/[⁦-⁩]/)
  })

  it('F-06 bidi control characters typed into the name are removed before saving', async () => {
    const broker = new MemoryBroker()
    const a = mount(broker, 'rf-c')
    fireEvent.change(a.q.getByLabelText('Your name'), { target: { value: '‮Sam‬⁦' } })
    fireEvent.click(a.q.getByRole('button', { name: 'Continue' }))
    expect(await a.q.findByText('Sam', { selector: 'bdi' })).toBeInTheDocument()
  })

  it('F-09 the name screen and the footer say a free public server is used (EN and AR)', async () => {
    const broker = new MemoryBroker()
    const a = mount(broker, 'rf-d')
    expect(a.q.getByTestId('privacy-note')).toHaveTextContent(/free public server.*Do not enter personal information/)
    expect(a.q.queryByTestId('privacy-footer')).toBeNull()
    await a.user.click(a.q.getByRole('button', { name: 'Language: العربية' }))
    expect(a.q.getByTestId('privacy-note')).toHaveTextContent(/خادم عام مجاني.*لا تُدخل أي معلومات شخصية/)
    await enterName(a, 'Bob', 'اسمك', 'متابعة')
    await a.q.findByRole('heading', { name: 'العب إكس أو عبر الإنترنت' })
    expect(within(a.host).getByTestId('privacy-footer')).toHaveTextContent('خادم عام مجاني')
    await a.user.click(a.q.getByRole('button', { name: 'اللغة: English' }))
    expect(a.q.getByTestId('privacy-footer')).toHaveTextContent('free public server')
  })
})
