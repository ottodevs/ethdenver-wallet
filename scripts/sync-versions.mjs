import fs from 'node:fs'
import { findPackageJSON } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Configure __dirname correctly in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const packageJson = findPackageJSON(import.meta.url)

// Get Node.js version
const nodeVersion = packageJson.engines?.node || '22'

// Path to .node-version file
const nodeVersionPath = path.join(__dirname, '../.node-version')

// Check if file exists and has the same content
let shouldUpdate = true
if (fs.existsSync(nodeVersionPath)) {
    const currentNodeVersion = fs.readFileSync(nodeVersionPath, 'utf8').trim()
    shouldUpdate = currentNodeVersion !== nodeVersion
}

// Only update if needed
if (shouldUpdate) {
    fs.writeFileSync(nodeVersionPath, nodeVersion)
    console.log(`✅ .node-version updated to Node.js ${nodeVersion}`)
}
