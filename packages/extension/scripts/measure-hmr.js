const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Clean the project
console.log('Cleaning project...')
try {
  if (fs.existsSync('node_modules')) {
    fs.rmSync('node_modules', { recursive: true, force: true })
  }
} catch (error) {
  console.warn('Warning: Could not remove node_modules, continuing anyway...')
}

try {
  if (fs.existsSync('.plasmo')) {
    fs.rmSync('.plasmo', { recursive: true, force: true })
  }
} catch (error) {
  console.warn('Warning: Could not remove .plasmo, continuing anyway...')
}

// Start timing
const startTime = Date.now()

// Install dependencies
console.log('Installing dependencies...')
execSync('pnpm install', { stdio: 'inherit' })

// Start dev server and measure time
console.log('Starting dev server...')
const devStartTime = Date.now()
try {
  execSync('pnpm dev', { stdio: 'inherit' })
} catch (error) {
  console.error('Error starting dev server:', error.message)
  process.exit(1)
}
const devEndTime = Date.now()

// Calculate times
const totalTime = (devEndTime - startTime) / 1000
const devTime = (devEndTime - devStartTime) / 1000

console.log('\nPerformance Results:')
console.log(`Total setup time: ${totalTime.toFixed(2)}s`)
console.log(`Dev server start time: ${devTime.toFixed(2)}s`)

// Check if we meet the performance budget
const budget = 120 // 2 minutes in seconds
if (totalTime > budget) {
  console.error(`❌ Performance budget exceeded! Target: ${budget}s, Actual: ${totalTime.toFixed(2)}s`)
  process.exit(1)
} else {
  console.log(`✅ Performance budget met! Target: ${budget}s, Actual: ${totalTime.toFixed(2)}s`)
} 