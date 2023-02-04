import { readFileSync, existsSync, statSync } from 'node:fs'
import { extname } from 'node:path'
import { parseDocument } from 'htmlparser2'
import selectAll from 'css-select'
import { textContent } from 'domutils'
import { getFamily, parseFamilyMap } from './utils/parse-family-map'
import { getAbsolutePath, getHash, unique, removeParam } from './utils'
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
    const sources = selectAll('style,link[href],[style]', dom)
    for (const source of sources) {
      // handler style tags
      if ((source as Tkv).name === 'style') {
        const StyleTextContent = textContent(source)
        const hash = getHash(StyleTextContent)
        if (!caches.has(hash)) {
          caches.set(hash, StyleTextContent)
          parseFamilyMap(basePath, declaredFamilyMap, StyleTextContent, file)
        }
        continue
      }
      // handler link tags
      const sourcePath = removeParam((source as Tkv).attribs.href || '')
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
        continue
      }
      const AttrStyleContent = (source as Tkv).attribs.style || ''
      const family = getFamily(declaredFamilyMap, AttrStyleContent)

      if (declaredFamilyMap[family]) {
        declaredFamilyMap[family].chars += unique(textContent(source))
      }
    }
    getText(dom, declaredFamilyMap)
  }
  return declaredFamilyMap
}
/* eslint-enable */

function getText(dom: Document, familyMap: TdeclaredFamilyMap) {
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
