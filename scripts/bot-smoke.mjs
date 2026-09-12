// Three real questions against a running server. Prints the answers and sources for the owner to
// judge grounding. usage: node scripts/bot-smoke.mjs [baseUrl]
const base = process.argv[2] ?? 'http://localhost:3778'
const questions = ['How does the MedChron pipeline work?', 'Is Dhruv open to relocation, and what time zones does he cover?', 'What did Dhruv study at Harvard?']
let cookie = ''
for (const q of questions) {
  const t0 = Date.now()
  const res = await fetch(`${base}/api/ask`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: base, 'x-dhruvbot': '1', ...(cookie ? { cookie } : {}) },
    body: JSON.stringify({ messages: [{ role: 'user', content: q }] }),
  })
  cookie = res.headers.get('set-cookie')?.split(';')[0] ?? cookie
  const json = await res.json()
  console.log(`\nQ: ${q}\n${res.status} in ${Date.now() - t0} ms: ${json.answer ?? json.error}\nSources: ${(json.sources ?? []).join(', ') || 'none'}`)
  await new Promise((r) => setTimeout(r, 2200))
}
