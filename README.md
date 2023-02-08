# fontmin-spider

Analyze which fonts are used on the page and eliminate the ones that are not used to get a smaller font file

## Install

```bash
npm install fontmin-spider
```

## Usage

```js
const { spider, parse } = require('fontmin-spider')

;(async () => {
  const basePath = '/home/site/'
  // Recursively read all html files in the /home/site/ directory
  // default: **/*.html
  await spider({ basePath })


  /* 
    // css
    p {
      font-family: 'fontName';
    }

    // html
    <p>Analyze which fonts are used on the page and eliminate the ones that are not used to get a smaller font file</p>
  */
  const files = ['/home/site/index.html', '/home/site/post/index.html', '/home/site/page/index.html']
  // It only parses, it does not compress
  const fontMaps = parse(basePath, files)
  console.log(fontMaps)
  /*
    {
      fontName: {
        selector: [ 'p' ],
        path: '/home/site/font/font-file.ttf',
        chars: 'Analyzewhicfotsrudpgm'
      }
      ....
    }
  */
})()
```

## API

### spider(options)

Crawl the fonts referenced by the specified .html file for compression.
matching the text used according to the css selector, compressing on demand

#### options.basePath

Type: `string`

Required: `true`

You can think of it as the root of the website

### options.source

Type: `string | string[]`

See [fast-glob](https://github.com/mrmlnc/fast-glob#patterns) for details

### options.backup

Type: `boolean`

Default: `true`

backup font (font.backup.ttf)

### options.reserveText

Type: `string | object`

Reserved text. For example, when using JavaScript to add text dynamically.
the fontmin-spider will not be able to parse the text and you will need to add the reserved text manually

```js
const { spider, parse } = require('fontmin-spider')

;async () => {
  const basePath = '/home/site/'
  // Even if 'ABCDEFG' is not used, 'fontmin-spider' does not eliminate it and remains in the font file
  await spider({ basePath, reserveText: 'ABCDEFG' })

  // Settings for specific fonts only
  /* p {
      font-family: 'fontName';
    } 
  */
  await spider({ basePath, reserveText: { fontName: 'ABCDEFG', fontName2: '1234567890' } })
}
```

### options.ignore

Type: `string[]`

See [fast-glob](https://github.com/mrmlnc/fast-glob#ignore) for details

### parse(basePath, files)

#### basePath

Type: `string`

Required: `true`

You can think of it as the root of the website

#### files

Type: `string[]`

Required: `true`

Array type html file (absolute path)

#### filter

Type: `Function`

Required: `false`

Execute when all the used fonts are parsed (the strings are not parsed, you can use the afterFilter method if you need to process the strings)

#### afterFilter

Type: `Function`

Required: `false`

After parsing is complete, execute
