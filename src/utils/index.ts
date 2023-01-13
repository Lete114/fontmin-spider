import { isAbsolute, join, parse } from 'path'
import { copyFileSync, existsSync } from 'fs'

/**
 * get Absolute Path
 * @param { string } basePath You can think of it as the root of the website
 * @param { string } improtPath import file path
 * @param { string } sourcePath improtPath improt source path
 * @returns { string } absolute path
 */
export function getAbsolutePath(basePath: string, improtPath: string, sourcePath: string) {
  return isAbsolute(sourcePath) ? join(basePath, sourcePath) : join(parse(improtPath).dir, sourcePath)
}

/**
 * Remove paired single or double quotes
 * @param { string } str You need to remove pairs of single - or double-quoted strings
 * @returns { string } Dispose of paired single- or double-quoted strings
 */
export const getQuoteless = (str: string) => str.replace(/(['"])(.+)\1/g, '$2')

/**
 * String de-duplication
 * @param { string } chars Strings to be de-duplicated
 * @returns { string } String after processing duplicate content
 */
export const unique = (chars: string) => Array.from(new Set(chars)).join('').replace(/\s*/g, '')

/**
 * Get the resource referenced by url() in css
 * @param { string } value css property value
 * @returns { string[] } Content in url() after processing
 */
export function getUrls(value: string) {
  const reg = /url\((\s*)(['"]?)(.+?)\2(\s*)\)/g
  let match
  const urls = []

  while ((match = reg.exec(value)) !== null) {
    const meta = {
      source: match[0],
      before: match[1],
      quote: match[2],
      value: match[3],
      after: match[4]
    }
    if (meta.value.indexOf('data:') !== 0 || meta.value.indexOf('#') !== 0) {
      urls.push(meta)
    }
  }
  return urls
}

const BACKUP = '.backup'
/**
 * File Backup
 * @param { string } filePath Need to backup file
 * @returns { string } File path after backup
 */
export function backup(filePath: string) {
  const { dir, name, ext } = parse(filePath)
  const backupPath = join(dir, name) + BACKUP + ext
  if (existsSync(backupPath)) return backupPath
  copyFileSync(filePath, backupPath)
  return backupPath
}
