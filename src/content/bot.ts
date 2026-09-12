import { identity } from './profile'

// Every string a visitor can read in the assistant. Covered by the banned-word test like the rest of the site.
export const bot = {
  name: 'DhruvBot',
  button: 'Ask DhruvBot',
  tagline: "Answers from Dhruv's record only. Every answer cites its source.",
  placeholder: 'Ask about Dhruv or his work',
  starters: ['How does MedChron work?', 'Why hire Dhruv?', 'What has he shipped on his own?', 'Is he open to relocation?'],
  lines: {
    resting: `DhruvBot is resting. Email Dhruv at ${identity.email}.`,
    origin: 'DhruvBot only answers from the portfolio page.',
    invalid: 'That message could not be sent. Keep it short, plain text, no links.',
    tooFast: 'One question at a time. Try again in a moment.',
    quota: `That is the limit for now. Email Dhruv at ${identity.email} to continue the conversation.`,
    unverified: `I could not verify part of that against Dhruv's record. Email Dhruv at ${identity.email} for the exact figure.`,
    decline: `I can only answer from Dhruv's record. Email Dhruv at ${identity.email} for anything else.`,
    unknown: `I do not have that in Dhruv's record. Email Dhruv at ${identity.email}.`,
    failed: 'DhruvBot could not answer just now. Try again in a moment.',
    noSources: 'No source given',
  },
} as const
