import { join } from 'path'
import { tmpdir } from 'os'
import { mkdtempSync, existsSync } from 'fs'
import { describe, expect, it, afterAll } from 'vitest'
import getFolderSize from 'get-folder-size'
import { spider, parse } from '../src/main'
import { getAbsolutePath, getQuoteless, unique, getUrls, backup, getHash, removeParam } from '../src/utils'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { removeSync, copySync } = require('fs-extra')

const tmpDirs: string[] = []

afterAll(() => {
  tmpDirs.forEach(removeSync)
})

describe('utils', () => {
  it('getAbsolutePath', () => {
    const basePath = __dirname
    const path = join(basePath, 'index.css')
    const improtPath = join(basePath, 'index.html')
    const result1 = getAbsolutePath(basePath, improtPath, 'index.css')
    const result2 = getAbsolutePath(basePath, improtPath, '/index.css')
    const result3 = getAbsolutePath(basePath, improtPath, './index.css')
    const result4 = getAbsolutePath(basePath, improtPath, '../index.css')
    expect(result1).equal(path) // /test/index.css === /test/index.css
    expect(result2).equal(path) // /test/index.css === /test/index.css
    expect(result3).equal(path) // /test/index.css === /test/index.css
    expect(result4).equal(join(basePath, '../index.css')) // /index.css === /index.css
  })
  it('getQuoteless', () => {
    /* eslint-disable quotes */
    expect(getQuoteless(`'666'`)).equal('666')
    expect(getQuoteless(`"666"`)).equal('666')
    expect(getQuoteless(`"666" 'result'`)).equal('666 result')
    expect(getQuoteless(`"666 'result'`)).equal('"666 result')
    /* eslint-enable */
  })
  it('unique', () => {
    /* eslint-disable quotes */
    expect(unique(`'666'`)).equal(`'6`)
    expect(unique(`"666"`)).equal('"6')
    expect(unique(`"666" 'result' result result`)).equal(`"6'result`)
    /* eslint-enable */
  })

  it('getUrls', () => {
    /* eslint-disable quotes */
    expect(JSON.stringify(getUrls(`url('666')`)[0])).equal(
      JSON.stringify({ source: "url('666')", before: '', quote: "'", value: '666', after: '' })
    )
    expect(JSON.stringify(getUrls(`url("666")`)[0])).equal(
      JSON.stringify({ source: 'url("666")', before: '', quote: '"', value: '666', after: '' })
    )
    /* eslint-enable */
  })

  it('backup', () => {
    const tmpPath = join(tmpdir(), 'fontmin-spider-')
    const tempPath = mkdtempSync(tmpPath)
    tmpDirs.push(tempPath)
    copySync(join(__dirname, '../public'), tempPath)
    const requireBackupPath = join(tempPath, 'font/SmileySans-Oblique.ttf')
    const backupPath = backup(requireBackupPath)
    const afterBackupPath = requireBackupPath.replace(/.ttf$/, '.backup.ttf')
    expect(backupPath).equal(afterBackupPath)
    expect(existsSync(afterBackupPath)).toBeTruthy()
  })

  it('getHash', () => {
    const str = '1234567890'
    const hash = getHash(str)
    const hashMax = getHash(str, 32)
    expect(hash).equal('e807f1fcf8')
    expect(hashMax).equal('e807f1fcf82d132f9bb018ca6738a19f')
  })

  it('removeParam', () => {
    const str = 'xxx.ttf?v=2574dae2ee'
    const param = removeParam(str)
    const paramHash = removeParam(str + '#666')
    expect(param).equal('xxx.ttf')
    expect(paramHash).equal('xxx.ttf')
  })
})

describe('parse', () => {
  it('parse fonts', () => {
    const tmpPath = join(tmpdir(), 'fontmin-spider-')
    const tempPath = mkdtempSync(tmpPath)
    tmpDirs.push(tempPath)
    copySync(join(__dirname, '../public'), tempPath)
    const files = [join(tempPath, 'index.html')]
    const fontMaps = parse(tmpPath, files)
    const font = Object.keys(fontMaps)[0]
    expect(fontMaps[font].selector.length > 0).toBeTruthy()
  })
})

describe('spider', () => {
  it('fontmin-spider', async () => {
    const tmpPath = join(tmpdir(), 'fontmin-spider-')
    const tempPath = mkdtempSync(tmpPath)
    tmpDirs.push(tempPath)
    copySync(join(__dirname, '../public'), tempPath)
    const beforeFolder = await getFolderSize.strict(tempPath)
    await spider({ basePath: tempPath, backup: false })
    const afterFolder = await getFolderSize.strict(tempPath)

    expect(beforeFolder > afterFolder).toBeTruthy()
  })
})
