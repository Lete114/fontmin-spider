import { readFileSync, existsSync, statSync } from 'node:fs'
import { extname } from 'node:path'
import { parseDocument } from 'htmlparser2'
import selectAll from 'css-select'
import { textContent } from 'domutils'
import parseFamilyMap from './utils/parse-family-map'
import { getAbsolutePath, getHash, unique } from './utils'
import { TdeclaredFamilyMap, Tkv } from './types'

type Document = ReturnType<typeof parseDocument>

/**
 * Parsing the fonts used
 * @param { string } basePath You can think of it as the root of the website
 * @param { string[] } files Array of html files
 * @returns { TdeclaredFamilyMap }
 */
/* eslint-disable max-depth,max-statements */
export default function parse(basePath: string, files: string[]) {
  const declaredFamilyMap: TdeclaredFamilyMap = {}
  const caches = new Map()
  for (const file of files) {
    const content = readFileSync(file).toString()
    const dom = parseDocument(content)
    const sources = selectAll('style,link[href]', dom)
    for (const source of sources) {
      const sourcePath = (source as Tkv).attribs.href
      if ((source as Tkv).tagName === 'style') {
        const StyleTextContent = textContent(source)
        const hash = getHash(StyleTextContent)
        if (!caches.has(hash)) {
          caches.set(hash, StyleTextContent)
          parseFamilyMap(basePath, declaredFamilyMap, StyleTextContent, file)
        }
        continue
      }
      const sourceAbsolutePath = getAbsolutePath(basePath, file, sourcePath)
      if (
        extname(sourcePath) === '.css' &&
        existsSync(sourceAbsolutePath) &&
        statSync(sourceAbsolutePath).isFile() &&
        !caches.has(sourceAbsolutePath)
      ) {
        const data = readFileSync(sourceAbsolutePath)
        caches.set(sourceAbsolutePath, data)
        parseFamilyMap(basePath, declaredFamilyMap, data, sourceAbsolutePath)
      }
    }
    getText(dom, declaredFamilyMap)
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
