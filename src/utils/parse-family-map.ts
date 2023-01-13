import { existsSync, statSync } from 'node:fs'
import postcss from 'postcss'
import { Tkv } from '../types'
import { getQuoteless, getUrls, getAbsolutePath } from '.'

export default parseFamilyMap

/**
 * Parsing the referenced font
 * @param { string } basePath You can think of it as the root of the website
 * @param { Tkv } declaredFamilyMap Mapping of used fonts
 * @param { string | Buffer } content css file content
 * @param { string } importPath css file path
 */
function parseFamilyMap(basePath: string, declaredFamilyMap: Tkv, content: string | Buffer, importPath: string) {
  postcss({
    postcssPlugin: 'fontmin-spider-family-parse',
    Once(root) {
      root.walkAtRules('font-face', (rule) => {
        rule.walkDecls('font-family', (decl) => {
          const family = getQuoteless(decl.value)
          if (declaredFamilyMap[family]) return
          declaredFamilyMap[family] = null
        })
        rule.walkDecls('src', (decl) => {
          if (decl.value && decl.value.includes('url(')) {
            getUrls(decl.value).map((meta) => {
              const sourcePath = meta.value
              const filePath = getAbsolutePath(basePath, importPath, sourcePath)
              if (existsSync(filePath) && statSync(filePath).isFile()) {
                for (const family in declaredFamilyMap) {
                  if (declaredFamilyMap[family] === null) {
                    declaredFamilyMap[family] = {}
                    declaredFamilyMap[family].selector = []
                    declaredFamilyMap[family].path = filePath
                    declaredFamilyMap[family].chars = ''
                  }
                }
              }
            })
          }
        })
      })
      root.walkDecls((decl) => {
        let selector = decl.parent && (decl.parent as Tkv).selector
        selector = (selector || '').replace(/:?:(active|hover|focus|before|after)/g, '')

        let family = getQuoteless(decl.value)
        family = family.split(',').find((item) => declaredFamilyMap[getQuoteless(item.trim())]) || ''
        family = getQuoteless(family)

        if (
          selector &&
          decl.prop === 'font-family' &&
          declaredFamilyMap[family] &&
          !declaredFamilyMap[family].selector.includes(selector)
        ) {
          declaredFamilyMap[family].selector.push(selector)
        }
      })
    }
  }).process(content).css
}
