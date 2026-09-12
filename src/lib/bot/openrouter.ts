// One call to OpenRouter's chat completions. No SDK: a fetch with the system block marked cacheable,
// which OpenRouter forwards to Anthropic as prompt caching.
import type { Turn } from './inputGuards'

export const MODEL = 'anthropic/claude-haiku-4.5'

export class UpstreamError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function askModel(opts: { apiKey: string; system: string; turns: Turn[]; site: string; model?: string }): Promise<string> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${opts.apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': opts.site, 'X-Title': 'DhruvBot' },
    body: JSON.stringify({
      model: opts.model ?? MODEL,
      max_tokens: 350,
      temperature: 0.3,
      messages: [{ role: 'system', content: [{ type: 'text', text: opts.system, cache_control: { type: 'ephemeral' } }] }, ...opts.turns],
    }),
  })
  if (!res.ok) throw new UpstreamError(res.status, `openrouter ${res.status}`)
  const json = (await res.json()) as { choices?: { message?: { content?: string | { type: string; text?: string }[] } }[] }
  const content = json.choices?.[0]?.message?.content
  const text = typeof content === 'string' ? content : Array.isArray(content) ? content.map((c) => c.text ?? '').join('') : ''
  if (!text.trim()) throw new UpstreamError(502, 'empty completion')
  return text
}
