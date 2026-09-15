import { readFile } from 'node:fs/promises'
import { OUT_DIR } from './paths'
import { writeClient } from './sanityClient'

const BATCH_SIZE = 50

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const raw = await readFile(`${OUT_DIR}/documents.ndjson`, 'utf-8')
  const documents = raw
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line))

  console.log(`${documents.length} document sẵn sàng.`)
  if (dryRun) {
    console.log('--dry-run: không ghi gì. Loại document:')
    const byType = new Map<string, number>()
    for (const doc of documents) {
      byType.set(doc._type, (byType.get(doc._type) ?? 0) + 1)
    }
    console.table(Object.fromEntries(byType))
    return
  }

  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE)
    const tx = writeClient.transaction()
    for (const doc of batch) tx.createOrReplace(doc)
    await tx.commit()
    console.log(`  đã ghi ${Math.min(i + BATCH_SIZE, documents.length)}/${documents.length}`)
  }

  console.log('Xong.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
