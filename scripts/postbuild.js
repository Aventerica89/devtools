const fs = require('fs')
const path = require('path')

function getPaths() {
  const serverDir = path.join(process.cwd(), '.next', 'server')
  return {
    serverDir,
    manifest: path.join(serverDir, 'middleware-manifest.json'),
    nft: path.join(serverDir, 'middleware.js.nft.json'),
    stub: path.join(serverDir, 'middleware.js'),
  }
}

function run() {
  const { manifest, nft, stub } = getPaths()

  if (fs.existsSync(nft) && fs.existsSync(stub)) return
  if (!fs.existsSync(manifest)) return

  if (!fs.existsSync(stub)) {
    fs.writeFileSync(stub, '// Turbopack middleware stub — actual code in .vercel/output\n')
  }
  if (!fs.existsSync(nft)) {
    fs.writeFileSync(nft, JSON.stringify({ version: 1, files: [] }))
  }
}

module.exports = { run, getPaths }

if (require.main === module) {
  run()
}
