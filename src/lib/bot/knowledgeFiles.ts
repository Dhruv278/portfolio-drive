// Node only. Reads the owner's markdown once per process; the route imports this, the tests too.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { OWNER_FILES, type OwnerFiles } from './knowledge'

export function loadKnowledgeFiles(dir = join(process.cwd(), 'src', 'content', 'knowledge')): OwnerFiles {
  const out: OwnerFiles = {}
  for (const key of OWNER_FILES) {
    try {
      out[key] = readFileSync(join(dir, `${key}.md`), 'utf8')
    } catch {
      // a missing file means no section
    }
  }
  return out
}
