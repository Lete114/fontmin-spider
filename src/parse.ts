import { readFileSync, existsSync, statSync } from 'node:fs'
import { extname } from 'node:path'
import { parseDocument } from 'htmlparser2'
import selectAll from 'css-select'
import { textContent } from 'domutils'
import { getUseFamily, parseUseFamily, parseSelector } from './utils/parse-family-map'
import { getAbsolutePath, getHash, removeParam } from './utils'
import { TdeclaredFamilyMap, TparseOptions, Tkv } from './types'

type Document = ReturnType<typeof parseDocument>

/**
 * Parsing the fonts used
 * @param { string } basePath You can think of it as the root of the website
 * @param { string[] } files Array of html files
 * @param options
 * @param { Function } options.filter Execute when all the used fonts are parsed
 * (the strings are not parsed, you can use the afterFilter method if you need to process the strings)
 * @param { Function } options.afterFilter After parsing is complete, execute
 * @returns { TdeclaredFamilyMap }
 */
/* eslint-disable max-depth,max-statements */
export default function parse(
  basePath: string,
  files: string[],
  options?: { [T in keyof TparseOptions]: TparseOptions[T] }
) {
  const declaredFamilyMap: TdeclaredFamilyMap = {}
  const caches: Map<string, string | Buffer> = new Map()
  const cacheDocment: Map<string, Document> = new Map()
  const cacheDocments: Map<string, Document[]> = new Map()
  const getDocument = (file: string) => parseDocument(readFileSync(file).toString())
  try {
    for (const file of files) {
      const doc = cacheDocment.has(file) ? (cacheDocment.get(file) as Document) : getDocument(file)
      const sources = cacheDocments.has(file)
        ? (cacheDocments.get(file) as Document[])
        : selectAll('style,link[href],[style]', doc)
      cacheDocment.set(file, doc)
      cacheDocments.set(file, sources)
      for (const source of sources) {
        // handler style tags
        if ((source as Tkv).name === 'style') {
          const StyleTextContent = textContent(source)
          const hash = getHash(StyleTextContent)
          if (!caches.has(hash)) {
            caches.set(hash, StyleTextContent)
            parseUseFamily(basePath, declaredFamilyMap, StyleTextContent, file)
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
          parseUseFamily(basePath, declaredFamilyMap, data, sourceAbsolutePath)
          continue
        }
      }
    }

    // custom filter font
    options?.filter && options.filter(declaredFamilyMap)

    for (const file of files) {
      const doc = cacheDocment.has(file) ? (cacheDocment.get(file) as Document) : getDocument(file)
      const sources = cacheDocments.has(file)
        ? (cacheDocments.get(file) as Document[])
        : selectAll('style,link[href],[style]', doc)
      for (const source of sources) {
        // handler style tags
        if ((source as Tkv).name === 'style') {
          const StyleTextContent = textContent(source)
          parseSelector(declaredFamilyMap, StyleTextContent)
          continue
        }

        // handler link tags
        const sourcePath = removeParam((source as Tkv).attribs.href || '')
        const sourceAbsolutePath = getAbsolutePath(basePath, file, sourcePath)
        if (extname(sourcePath) === '.css' && existsSync(sourceAbsolutePath) && statSync(sourceAbsolutePath).isFile()) {
          const data = caches.has(sourceAbsolutePath)
            ? (caches.get(sourceAbsolutePath) as string | Buffer)
            : readFileSync(sourceAbsolutePath)
          parseSelector(declaredFamilyMap, data)
          continue
        }

        const AttrStyleContent = (source as Tkv).attribs.style || ''
        if (!AttrStyleContent) continue
        const family = getUseFamily(declaredFamilyMap, AttrStyleContent)

        if (declaredFamilyMap[family]) {
          declaredFamilyMap[family].chars += textContent(source)
        }
      }
      getText(doc, declaredFamilyMap)
    }

    // custom filter font
    options?.afterFilter && options.afterFilter(declaredFamilyMap)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('\x1b[31mfontmin-spider Error:\x1b[39m', error)
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
  }
}
