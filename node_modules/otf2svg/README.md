# otf2svg


[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]

This is a small utility that uses the fontkit module to convert Open Type (OTF) font files to SVG font files.

While the SVG font format is deprecated, there is currently (as of September 2020) no consistently working native javascript 
solution for converting Open Type fonts to *any* other format. Fontkit and opentype.js can parse Open Type fonts reasonably well, 
but cannot do any sort of conversion. The fonteditor-core package has code for opentype conversion but this has many known issues
and can mangle glyphs on e.g. Google's Noto CJK fonts.

This tool provides a way around this problem by allowing accurate conversion into the SVG font format, which can then be converted
into any other desired format by, e.g. fonteditor-core.

Unfortunately, SVG fonts are more limited than other formats and therefore considered deprecated. If/when fontkit or opentype.js implements
direct opentype to truetype conversion or fonteditor-core fixes their opentype code this package should be deprecated in favor of a different solution. 

## Features
- Converts OTF font files to SVG font files
- Can be imported as a module or run as a command line tool
- Works with Google's Noto CJK fonts



## Usage

To use as a module:

```js

const otf2svg = require('otf2svg');

let rawSVGString = otf2svg.convert("/path/to/input.otf");

let createdSVGFilePath = otf2svg.convertToFile("/path/to/input.otf", "/path/to/desired/output.svg");

let unicodePointsToInclude = [ 0x5b99 ];
let createdSvgSubsetFilePath = otf2svg.convertToFile("/path/to/input.otf", 
                                                     "/path/to/desired/output-subset.svg", 
                                                     unicodePointsToInclude);

```

To use as CLI:


```
otf2svg /path/to/input.otf /path/to/output.svg
```

The command line tool cannot do subsetting at this time (you will have to use as a module for this).


## API

#### `otf2svg.convert(inputOTF, subsetUnicodePointArray = null)`

Converts an OTF font file to an SVG file, returning a string representation of the raw SVG file. All I/O is performed synchronously.

`inputOTF`: If this is a string, it is interpretted as a file to open and read. If this is a Buffer, it is interpretted as binary OTF data.

`subsetUnicodePointArray`: If this is null, the entire file is converted, which is the default. Otherwise it should be an integer array containing unicode code points to preserve.

#### `otf2svg.convertToFile(inputOTF, outputSVG = null, subsetUnicodePointArray = null)`

Converts an OTF font file to an SVG file, returning the path of the SVG file written. All I/O is performed synchronously.

`inputOTF`: If this is a string, it is interpretted as a file to open and read. If this is a Buffer, it is interpretted as binary OTF data.

`outputOTF`: The path of the output file to write the SVG file to. If this is null, the path will be the same as the input file with the extension switched to 
".svg". If the input is a buffer and the parameter is null the  output path will be "output.svg"

`subsetUnicodePointArray`: If this is null, the entire file is converted, which is the default. Otherwise it should be an integer array containing unicode code points to preserve.

## License

ISC


[npm-url]: https://npmjs.org/package/otf2svg
[npm-image]: http://img.shields.io/npm/v/otf2svg.svg

[travis-url]: https://travis-ci.org/ericpaulbishop/otf2svg
[travis-image]: http://img.shields.io/travis/ericpaulbishop/otf2svg.svg

[downloads-image]: http://img.shields.io/npm/dm/otf2svg.svg
