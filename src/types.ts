export type Tkv = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export type Toptions = {
  basePath: string
  source?: string | string[]
  backup?: boolean
  reserveText?: string | { [key: string]: string }
  ignore?: string[]
}

export type TdeclaredFamilyMap = {
  [key: string]: { selector: string[]; path: string; chars: string }
}
