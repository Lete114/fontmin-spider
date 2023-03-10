import crypto from 'crypto'
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

/**
 * Generate hash
 * @param { string | buffer } data Generate the contents of the hash
 * @param { number } size The size (length) of the generated hash
 * @returns { string } hash
 */
export function getHash(data: string | Buffer, size = 10) {
  if (typeof data !== 'string' && !Buffer.isBuffer(data)) {
    throw new TypeError('Expected a Buffer or string')
  }
  size = Number.isInteger(size) ? size : 10
  const md5 = crypto.createHash('md5').update(data).digest('hex')
  return size > md5.length ? md5 : md5.slice(0, size)
}

/**
 * ????????????????????????
 * @param { string } param string
 * @returns { string } string
 */
export const removeParam = (param: string) => param.replace(/#.*$/, '').replace(/\?.*$/, '')
