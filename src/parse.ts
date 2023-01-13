import { readFileSync, existsSync, statSync } from 'node:fs'
import { extname } from 'node:path'
import { parseDocument } from 'htmlparser2'
import selectAll from 'css-select'
import { textContent } from 'domutils'
import parseFamilyMap from './utils/parse-family-map'
import { getAbsolutePath, unique } from './utils'
import { TdeclaredFamilyMap, Tkv } from './types'

type Document = ReturnType<typeof parseDocument>

/**
 * Parsing the fonts used
 * @param { string } basePath You can think of it as the root of the website
 * @param { string[] } files Array of html files
 * @returns { TdeclaredFamilyMap }
 */
/* eslint-disable max-depth */
export default function parse(basePath: string, files: string[]) {
  const declaredFamilyMap: TdeclaredFamilyMap = {}
  const caches = new Map()
  for (const file of files) {
    const content = readFileSync(file).toString()
    const dom = parseDocument(content)
    const sources = selectAll('link[href]', dom)
    for (const source of sources) {
      const sourcePath = (source as Tkv).attribs.href
      if (extname(sourcePath) !== '.css') continue
      const sourceAbsolutePath = getAbsolutePath(basePath, file, sourcePath)
      if (existsSync(sourceAbsolutePath) && statSync(sourceAbsolutePath).isFile()) {
        let data: Buffer
        if (caches.has(sourceAbsolutePath)) {
          data = caches.get(sourceAbsolutePath)
        } else {
          data = readFileSync(sourceAbsolutePath)
          caches.set(sourceAbsolutePath, data)
        }
        parseFamilyMap(basePath, declaredFamilyMap, data, sourceAbsolutePath)
        getText(dom, declaredFamilyMap)
      }
    }
  }
  return declaredFamilyMap
}
/* eslint-enable */

function getText(dom: Document, familyMap: Tkv) {
  for (const key in familyMap) {
    const value = familyMap[key]
    if (!value) continue
    value.selector.map((item: string) => {
      const node = selectAll(item, dom)
      familyMap[key].chars += textContent(node)
    })
    familyMap[key].chars = unique(familyMap[key].chars)
  }
}
