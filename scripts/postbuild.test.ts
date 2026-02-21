import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

// Run in an isolated temp directory each test
let tmpDir: string
let originalCwd: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'postbuild-test-'))
  fs.mkdirSync(path.join(tmpDir, '.next', 'server'), { recursive: true })
  originalCwd = process.cwd()
  process.chdir(tmpDir)
  vi.resetModules()
})

afterEach(() => {
  process.chdir(originalCwd)
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

function getScript() {
  return require('../scripts/postbuild.js')
}

function serverPath(file: string) {
  return path.join(tmpDir, '.next', 'server', file)
}

describe('postbuild script', () => {
  it('does nothing when middleware-manifest.json is absent', () => {
    getScript().run()

    expect(fs.existsSync(serverPath('middleware.js'))).toBe(false)
    expect(fs.existsSync(serverPath('middleware.js.nft.json'))).toBe(false)
  })

  it('creates middleware.js and middleware.js.nft.json when manifest exists', () => {
    fs.writeFileSync(serverPath('middleware-manifest.json'), JSON.stringify({ version: 3 }))

    getScript().run()

    expect(fs.existsSync(serverPath('middleware.js'))).toBe(true)
    expect(fs.existsSync(serverPath('middleware.js.nft.json'))).toBe(true)
  })

  it('writes NFT file with version:1 and files:[] array', () => {
    fs.writeFileSync(serverPath('middleware-manifest.json'), JSON.stringify({ version: 3 }))

    getScript().run()

    const nft = JSON.parse(fs.readFileSync(serverPath('middleware.js.nft.json'), 'utf8'))
    expect(nft.version).toBe(1)
    expect(Array.isArray(nft.files)).toBe(true)
    expect(nft.files).toHaveLength(0)
  })

  it('does not overwrite existing middleware.js', () => {
    fs.writeFileSync(serverPath('middleware-manifest.json'), JSON.stringify({ version: 3 }))
    fs.writeFileSync(serverPath('middleware.js'), 'existing content')
    fs.writeFileSync(serverPath('middleware.js.nft.json'), JSON.stringify({ version: 1, files: [] }))

    getScript().run()

    expect(fs.readFileSync(serverPath('middleware.js'), 'utf8')).toBe('existing content')
  })

  it('middleware.js is a non-empty file', () => {
    fs.writeFileSync(serverPath('middleware-manifest.json'), JSON.stringify({ version: 3 }))

    getScript().run()

    const content = fs.readFileSync(serverPath('middleware.js'), 'utf8')
    expect(content.length).toBeGreaterThan(0)
  })
})
