'use client'

import dynamic from 'next/dynamic'
import { useCallback, useRef, useState } from 'react'
import { bot } from '@/content/bot'

type Props = { page: 'track' | 'other' }

// The launcher renders with the page; the dialog's code loads when a visitor is about to open it
// (hover, focus or touch) and mounts on the click. Pages that never open the assistant do not
// hydrate it.
const preload = () => {
  void import('./AskBotPanel')
}

const Panel = dynamic(() => import('./AskBotPanel').then((m) => m.AskBotPanel), {
  ssr: false,
  loading: () => (
    <div className="dbot" role="dialog" aria-modal="true" aria-label={bot.name} aria-busy="true">
      <header className="dbot-head">
        <div>
          <b>{bot.name}</b>
          <span>{bot.tagline}</span>
        </div>
      </header>
      <div className="dbot-list" />
    </div>
  ),
})

export function AskBot({ page }: Props) {
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    button.current?.focus()
  }, [])

  return (
    <>
      <button
        ref={button}
        type="button"
        className="dbot-open"
        onClick={() => setOpen(true)}
        onPointerEnter={preload}
        onFocus={preload}
        onTouchStart={preload}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={bot.button}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.4 3.3A.75.75 0 0 1 4.4 18.7V16A2.5 2.5 0 0 1 4 13.5v-8Z" fill="currentColor" />
        </svg>
        <span className="dbot-open-label">{bot.button}</span>
      </button>
      {open && <Panel page={page} onClose={close} />}
    </>
  )
}
