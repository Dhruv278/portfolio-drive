import { identity } from './profile'

// Every string a visitor can read in the assistant. Covered by the banned-word test like the rest of the site.
export const bot = {
  name: 'DhruvBot',
  button: 'Ask DhruvBot',
  tagline: "Dhruv's AI. It answers as Dhruv, from his record only, and cites its source.",
  placeholder: 'Ask me about my work',
  starters: ['How does MedChron work?', 'Why should I hire you?', 'What have you shipped on your own?', 'Are you open to relocation?'],
  lines: {
    resting: `I am taking a break. Email me at ${identity.email}.`,
    origin: 'DhruvBot only answers from the portfolio page.',
    invalid: 'That message could not be sent. Keep it short, plain text, no links.',
    tooFast: 'One question at a time. Try again in a moment.',
    quota: `That is the limit for now. Email me at ${identity.email} to continue the conversation.`,
    unverified: `I could not verify part of that against my record. Email me at ${identity.email} for the exact figure.`,
    decline: `I can only answer from my record. Email me at ${identity.email} for anything else.`,
    unknown: `That is not in my record. Email me at ${identity.email}.`,
    failed: 'I could not answer just now. Try again in a moment.',
    noSources: 'No source given',
  },
} as const
