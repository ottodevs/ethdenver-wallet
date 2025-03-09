import fs from 'fs'
import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const packageJsonPath = path.join(__dirname, '../package.json')
const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'))

// Get Node.js version
const nodeVersion = packageJson.engines?.node || '22'

// Write to .node-version
fs.writeFileSync(path.join(__dirname, '../.node-version'), nodeVersion)

console.log(`✅ .node-version updated to Node.js ${nodeVersion}`)
