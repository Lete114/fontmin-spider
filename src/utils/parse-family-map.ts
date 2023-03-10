import { existsSync, statSync } from 'node:fs'
import postcss from 'postcss'
import { Tkv } from '../types'
import { getQuoteless, getUrls, getAbsolutePath, removeParam } from '.'

/**
 * Get font used
 * @param { Tkv } declaredFamilyMap Mapping of used fonts
 * @param { string | Buffer } content css file content
 */
export function getUseFamily(declaredFamilyMap: Tkv, content: string | Buffer) {
  let family = ''
  postcss({
    postcssPlugin: 'fontmin-spider-get-use-family',
    Once(root) {
      root.walkDecls(/^(font-family|font)$/, (decl) => {
        family = decl.value
        if (decl.prop === 'font') {
          const font = Object.entries(declaredFamilyMap).find(([k]) => family.match(new RegExp(k)))
          if (font) family = font[0]
        }
        family = family.split(',').find((item) => declaredFamilyMap[getQuoteless(item.trim())]) || ''
        family = getQuoteless(family)
      })
    }
  }).process(content).css
  return family
}

/**
 * Parsing the fonts used
 * @param { string } basePath You can think of it as the root of the website
 * @param { Tkv } declaredFamilyMap Mapping of used fonts
 * @param { string | Buffer } content css file content
 * @param { string } importPath css file path
 */
export function parseUseFamily(basePath: string, declaredFamilyMap: Tkv, content: string | Buffer, importPath: string) {
  postcss({
    postcssPlugin: 'fontmin-spider-parse-use-family',
    Once(root) {
      root.walkAtRules('font-face', (rule) => {
        let tmpFontName = ''
        let tmpSourcePath = ''
        rule.walkDecls(/font-family|src/, (decl) => {
          if (decl.value && decl.value.includes('url(')) {
            getUrls(decl.value).forEach((meta) => {
              const sourcePath = removeParam(meta.value)
              const filePath = getAbsolutePath(basePath, importPath, sourcePath)
              if (existsSync(filePath) && statSync(filePath).isFile()) {
                tmpSourcePath = filePath
              }
            })
          } else {
            tmpFontName = getQuoteless(decl.value)
          }
        })
        if (tmpFontName && tmpSourcePath) {
          declaredFamilyMap[tmpFontName] = {}
          declaredFamilyMap[tmpFontName].selector = []
          declaredFamilyMap[tmpFontName].path = tmpSourcePath
          declaredFamilyMap[tmpFontName].chars = ''
        }
      })
    }
  }).process(content).css
}

/**
 * Parse the selector that uses fonts
 * @param { Tkv } declaredFamilyMap Mapping of used fonts
 * @param { string | Buffer } content css file content
 */
export function parseSelector(declaredFamilyMap: Tkv, content: string | Buffer) {
  postcss({
    postcssPlugin: 'fontmin-spider-family-parse',
    Once(root) {
      const reg = /:?:(active|hover|focus|before|after)/g
      root.walkDecls(/^(font-family|font)$/, (decl) => {
        let content = ''
        let family = decl.value
        let selector = decl.parent && (decl.parent as Tkv).selector

        if (!selector) return

        if (reg.test(selector)) {
          const value = decl.parent?.nodes.find((node) => (node as Tkv).prop === 'content')
          if (value) content = getQuoteless((value as Tkv).value)
        }
        selector = (selector as string).replace(reg, '').replace(/\r?\n/g, '')

        if (decl.prop === 'font') {
          const font = Object.entries(declaredFamilyMap).find(([k]) => family.match(new RegExp(k)))
          if (font) family = font[0]
        }
        family = family.split(',').find((item) => declaredFamilyMap[getQuoteless(item.trim())]) || ''
        family = getQuoteless(family)

        if (selector && declaredFamilyMap[family]) {
          if (!declaredFamilyMap[family].selector.includes(selector)) declaredFamilyMap[family].selector.push(selector)
          declaredFamilyMap[family].chars += content
        }
      })
    }
  }).process(content).css
}
