export type Tkv = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export type TdeclaredFamilyMap = {
  [key: string]: { selector: string[]; path: string; chars: string }
}

// eslint-disable-next-line no-unused-vars
export type TfilterCallback = (declaredFamilyMap: TdeclaredFamilyMap) => void

export type Toptions = {
  basePath: string
  source?: string | string[]
  backup?: boolean
  reserveText?: string | { [key: string]: string }
  ignore?: string[]
  filter?: TfilterCallback
  afterFilter?: TfilterCallback
}
