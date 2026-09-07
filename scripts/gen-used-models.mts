// Writes scripts/used-models.json from the placement table so copy-models.mjs has no TS dependency.
import { writeFileSync } from 'node:fs'
import { usedModels } from '../src/content/route'
writeFileSync(new URL('./used-models.json', import.meta.url), JSON.stringify(usedModels(), null, 2) + '\n')
console.log(usedModels().length, 'models')
