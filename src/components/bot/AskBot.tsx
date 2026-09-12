'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { bot } from '@/content/bot'
import { identity } from '@/content/profile'
import { useReducedMotion } from '@/lib/useReducedMotion'

type Msg = { role: 'user' | 'bot'; text: string; sources?: string[]; sig?: string; error?: boolean }
type Turn = { role: 'user' | 'assistant'; content: string; sig?: string }
type Props = { page: 'track' | 'other' }

// Section titles that map to a checkpoint on the 2D page.
const ANCHORS: Record<string, string> = {
  About: 'top',
  'Why hire me': 'why',
  Experience: 'experience',
  MedChron: 'medchron',
  'How MedChron works': 'medchron',
  'How I would improve MedChron next': 'medchron',
  'Numbers on the site': 'medchron',
  Projects: 'projects',
  Platforms: 'platforms',
  Skills: 'skills',
  'How I work': 'skills',
  'Achievements and education': 'achievements',
  Contact: 'contact',
  'Questions recruiters ask': 'contact',
}
const STORE = 'dhruvbot-thread'
const MAX_CHARS = 600
const MAX_ASSISTANT_CHARS = 1200
const CHARS_PER_SECOND = 40
const REQUEST_TIMEOUT_MS = 20_000
const URL_RE = /https?:\/\/|www\./i

function loadThread(): Msg[] {
  try {
    const raw = sessionStorage.getItem(STORE)
    return raw ? (JSON.parse(raw) as Msg[]) : []
  } catch {
    return []
  }
}

function saveThread(msgs: Msg[]) {
  try {
    sessionStorage.setItem(STORE, JSON.stringify(msgs.slice(-24)))
  } catch {
    // storage blocked: the thread lives for this page only
  }
}

// The turns the endpoint sees: complete question-and-answer pairs (failed replies dropped with their
// question, so roles keep alternating), each answer with the signature the server gave it, then the
// new question. Two pairs at most.
export function historyFor(msgs: Msg[], question: string): Turn[] {
  const pairs: Turn[] = []
  for (let i = 0; i < msgs.length - 1; i++) {
    const m = msgs[i]
    const n = msgs[i + 1]
    if (m.role === 'user' && n.role === 'bot' && !n.error && n.sig) {
      pairs.push({ role: 'user', content: m.text }, { role: 'assistant', content: n.text.slice(0, MAX_ASSISTANT_CHARS), sig: n.sig })
    }
  }
  return [...pairs.slice(-4), { role: 'user', content: question }]
}

// Reveals text at a steady pace. Screen readers get the whole text through the hidden copy.
function Typed({ text, done }: { text: string; done: boolean }) {
  const [n, setN] = useState(done ? text.length : 0)
  useEffect(() => {
    if (done || n >= text.length) return
    const t = setTimeout(() => setN((k) => Math.min(text.length, k + 1)), 1000 / CHARS_PER_SECOND)
    return () => clearTimeout(t)
  }, [n, text, done])
  const shown = done ? text.length : n
  return (
    <>
      <span aria-hidden="true">
        {text.slice(0, shown)}
        {shown < text.length && <i className="dbot-caret" />}
      </span>
      <span className="sr-only">{text}</span>
    </>
  )
}

export function AskBot({ page }: Props) {
  const reduced = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set())
  const button = useRef<HTMLButtonElement>(null)
  const field = useRef<HTMLTextAreaElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const dialog = useRef<HTMLDivElement>(null)

  // A thread saved earlier in this tab comes back fully revealed.
  useEffect(() => {
    const t = loadThread()
    if (!t.length) return
    queueMicrotask(() => {
      setMsgs(t)
      setRevealed(new Set(t.map((_, i) => i)))
    })
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    button.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    field.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key !== 'Tab' || !dialog.current) return
      const focusables = [...dialog.current.querySelectorAll<HTMLElement>('button:not([disabled]), textarea:not([disabled]), a[href]')]
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [open, close])

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight })
  }, [msgs, open, busy])

  // The field grows with the question, up to the height the stylesheet allows.
  const grow = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  const send = useCallback(
    async (text: string) => {
      const q = text.trim()
      if (!q || busy) return
      if (URL_RE.test(q)) {
        setHint(bot.lines.invalid)
        return
      }
      setHint(null)
      const asked: Msg[] = [...msgs, { role: 'user', text: q }]
      setMsgs(asked)
      setInput('')
      if (field.current) field.current.style.height = 'auto'
      setBusy(true)
      let reply: Msg
      try {
        const res = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-dhruvbot': '1' },
          body: JSON.stringify({ messages: historyFor(msgs, q) }),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        })
        const json = (await res.json()) as { answer?: string; sources?: string[]; sig?: string; error?: string }
        reply = res.ok && json.answer ? { role: 'bot', text: json.answer, sources: json.sources ?? [], sig: json.sig } : { role: 'bot', text: json.error ?? bot.lines.failed, error: true }
      } catch {
        reply = { role: 'bot', text: bot.lines.failed, error: true }
      }
      const withReply = [...asked, reply]
      setMsgs(withReply)
      saveThread(withReply)
      setBusy(false)
    },
    [busy, msgs],
  )

  const onSource = (title: string) => {
    const id = ANCHORS[title]
    if (page !== 'track' || !id) return
    document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
    close()
  }

  return (
    <>
      <button ref={button} type="button" className="dbot-open" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} aria-label={bot.button}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.4 3.3A.75.75 0 0 1 4.4 18.7V16A2.5 2.5 0 0 1 4 13.5v-8Z" fill="currentColor" />
        </svg>
        <span className="dbot-open-label">{bot.button}</span>
      </button>
      {open && (
        <div ref={dialog} className="dbot" role="dialog" aria-modal="true" aria-labelledby="dbot-title" data-testid="dbot">
          <header className="dbot-head">
            <div>
              <b id="dbot-title">{bot.name}</b>
              <span>{bot.tagline}</span>
            </div>
            <button type="button" className="dbot-close" onClick={close} aria-label="Close">
              <span aria-hidden="true">×</span>
            </button>
          </header>
          <div ref={list} className="dbot-list" aria-live="polite">
            {msgs.length === 0 && (
              <div className="dbot-starters">
                {bot.starters.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`dbot-msg ${m.role}${m.error ? ' error' : ''}`} data-testid={`dbot-msg-${m.role}`} onClick={() => setRevealed((r) => new Set(r).add(i))}>
                <p>{m.role === 'bot' && !m.error ? <Typed text={m.text} done={reduced || revealed.has(i)} /> : m.text}</p>
                {m.role === 'bot' && !m.error && (
                  <div className="dbot-sources">
                    {m.sources && m.sources.length > 0 ? (
                      m.sources.map((s) =>
                        page === 'track' && ANCHORS[s] ? (
                          <button key={s} type="button" className="dbot-chip" onClick={() => onSource(s)} aria-label={`Source: ${s}`}>
                            {s}
                          </button>
                        ) : (
                          <span key={s} className="dbot-chip plain">
                            {s}
                          </span>
                        ),
                      )
                    ) : (
                      <span className="dbot-chip muted">{bot.lines.noSources}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <div className="dbot-msg bot" role="status" aria-label="Thinking">
                <p className="dbot-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </p>
              </div>
            )}
          </div>
          <form
            className="dbot-form"
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
          >
            <textarea
              ref={field}
              value={input}
              onChange={(e) => {
                setInput(e.target.value.slice(0, MAX_CHARS))
                grow(e.target)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send(input)
                }
              }}
              rows={1}
              placeholder={bot.placeholder}
              aria-label="Your question"
              disabled={busy}
            />
            <button type="submit" className="dbot-send" disabled={busy || !input.trim()} aria-label="Send">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M3 11.5 20 4l-4.5 16-4-7.5L3 11.5Z" fill="currentColor" />
              </svg>
            </button>
          </form>
          <p className="dbot-foot">
            {hint ? (
              hint
            ) : input.length > 500 ? (
              `${input.length} of ${MAX_CHARS}`
            ) : (
              <>
                Or email <a href={`mailto:${identity.email}`}>{identity.email}</a>
              </>
            )}
          </p>
        </div>
      )}
    </>
  )
}
