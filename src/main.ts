import { writeFile } from 'node:fs/promises'
import fg from 'fast-glob'
import Fontmin from 'fontmin'
import parse from './parse'
import { backup } from './utils'
import { Toptions, TdeclaredFamilyMap } from './types'
export { default as parse } from './parse'

/**
 * Crawl the fonts referenced by the specified .html file for compression.
 * matching the text used according to the css selector, compressing on demand
 * @param options
 * @param { string } options.basePath You can think of it as the root of the website
 * @param { string | string[] } options.source https://github.com/mrmlnc/fast-glob#patterns
 * @param { boolean } options.backup backup font (font.backup.ttf) (default: true)
 * @param { string | object } options.reserveText
 * Reserved text. For example, when using JavaScript to add text dynamically.
 * the fontmin-spider will not be able to parse the text and you will need to add the reserved text manually
 * @param { string[] } options.ignore Ignore html file. https://github.com/mrmlnc/fast-glob#ignore
 * @param { Function } options.filter Execute when all the used fonts are parsed
 * (the strings are not parsed, you can use the afterFilter method if you need to process the strings)
 * @param { Function } options.afterFilter After parsing is complete, execute
 */
export function spider(options: { [T in keyof Toptions]: Toptions[T] }) {
  const fgOptions = { dot: true, absolute: true, cwd: options.basePath, ignore: options.ignore }
  options.backup = options.backup === false ? false : true

  const files = fg.sync(options.source || '**/*.html', fgOptions)
  const fontMaps: TdeclaredFamilyMap = parse(options.basePath, files, options)

  return Promise.all(
    Object.entries(fontMaps).map(([name, font]) => {
      return new Promise((resolve, reject) => {
        if (!font) return resolve(null)

        if (typeof options.reserveText === 'string') {
          font.chars += options.reserveText
        } else if (Object.prototype.toString.call(options.reserveText) === '[object Object]') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const reserveText = (options as any).reserveText[name]
          if (reserveText) font.chars += reserveText
        }

        if (!font.chars) return resolve(null)

        const path = font.path
        if (options.backup) font.path = backup(font.path)

        const fontmin = new Fontmin().src(font.path)

        fontmin.use(Fontmin.glyph({ text: font.chars, hinting: false }))

        fontmin.run(async (err, file) => {
          if (err) return reject(err)
          writeFile(path, file[0]._contents as unknown as Buffer).then(resolve, reject)
        })
      })
    })
  )
}
