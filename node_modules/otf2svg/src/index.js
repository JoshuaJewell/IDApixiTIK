#!/usr/bin/env node

const fontkit = require('fontkit')

function zeroPad(str, length) {
  let ret = str;
  while(ret.length < length) {
    ret = '0' + ret;
  }
  return ret; 
}

function toUnicodeStr(codePoints) {

  let ret = null
  let foundControlCode = false;
  for(let codePointIndex=0; codePoints != null && Array.isArray(codePoints) && codePointIndex < codePoints.length; codePointIndex++) {
    let codePoint = codePoints[codePointIndex]
    if(codePoint >= 32 ) { //character shouldn't be mapped to control code
      let hex = codePoint.toString(16).toLowerCase()
      hex = (hex.length % 2 == 0 ? '' : '0' ) + hex ;
      ret = (ret == null ? '' : ret) + '&#x' + hex + ';' 
    } else {
      foundControlCode = true
    }
  }
  
  return foundControlCode ? null : ret
}

function glyphDef( codePoints, svgPath, name, advanceWidth, isMissing ) {

  let unicodeCodePointStr = toUnicodeStr(codePoints)
  let path = ""
  if(isMissing || unicodeCodePointStr != null) {
    
    let aw = advanceWidth != null ? 'horiz-adv-x="' + advanceWidth + '"' : '';
    let gn = name != null ? 'glyph-name="' + name + '" ' : '' ;
    let start = isMissing ? '<missing-glyph ' : '<glyph ' +  gn + 'unicode="' + unicodeCodePointStr + '" ' ;
    path = start + aw + ' d="' + svgPath + '" />'
  }
  return path
}

// string is unchanged, integer => string, integer array => string
function codePointDefToMapKey(codePointDef) {
  let ret = ''
  if( typeof(codePointDef) == 'string' ) {
    ret = codePointDef
  }
  if( typeof(codePointDef) == 'number' || typeof(codePointDef) == 'bigint') {
    ret = String.fromCodePoint(codePointDef) 
  }
  if( Array.isArray(codePointDef)) {
    for(let ai=0; ai < codePointDef.length ; ai++) {
      let nxt = codePointDef[ai]
      ret = ret + ( typeof(nxt) == 'string' ? nxt : String.fromCodePoint(nxt))
    }
  } 
  return ret

}

function convert(otfInput, subsetCodePoints=null) {

  let font = null;
  if(Buffer.isBuffer(otfInput)) {
    font = fontkit.create(otfInput)
  } else {
    font = fontkit.openSync(otfInput)
  }
  
  let glyphDefs = []
  

  let missing = font.getGlyph(0)
  glyphDefs.push( glyphDef(0, missing.path.toSVG(), missing.name, missing.advanceWidth, true) )

  let subsetCodePointMap = {}
  for(let scpi=0; subsetCodePoints != null && scpi < subsetCodePoints.length; scpi++ ){
      subsetCodePointMap[ codePointDefToMapKey(subsetCodePoints[scpi]) ] = true;
  }
  let codePoints = font.characterSet.sort(function(a, b){return a-b})



  let seenCodePoints = {}
  let seenGlyphIds = {}

  codePoints.forEach(codePoint => {
    let glyph = font.glyphForCodePoint( codePoint )
    if(glyph != null && glyph.id != missing.id && ( subsetCodePoints == null || subsetCodePoints.length == 0 || subsetCodePointMap[ codePointDefToMapKey(codePoint) ] != null )) {
      let nextGlyphDef = glyphDef([codePoint], glyph.path.toSVG(), glyph.name, glyph.advanceWidth, false)
      if(nextGlyphDef != '') {
        glyphDefs.push(nextGlyphDef)
      }
      seenCodePoints[codePoint] = true
      seenGlyphIds[glyph.id] == true
    }
  });


  /*
    Ligatures:
      SVG allows only one unicode sequence per glyph
      This means we can't preserve alternate glyphs when glyph already maps to a unicode code point
      Additionally, if a glyph is already defined for a single unicode code point we can't map an alternate for that single unicode code point
      Finally, SVG does not support "Chaining Contextual Substitution" where the context of the codepoint determines whether substitution happens, so these glyphs will be ignored

      However, when glyph is defined ONLY as a ligature, that is, one that maps to a sequence of  two or more code points, we can preserve those here.
  */
  try { 
    let lookupList = font.GSUB.lookupList.toArray();
    lookupList.forEach(entry => {
      if(entry.lookupType == 4 ) {
        entry.subTables.forEach(subtable => {
          try {
            let lset = subtable.ligatureSets.toArray()
            lset.forEach(lsubset => {
              lsubset = Array.isArray(lsubset) ? lsubset : [ lsubset ]
              lsubset.forEach(ligature => {
                if(seenGlyphIds[ligature.glyph] == null && ligature.components.length > 1 && ( subsetCodePoints == null || subsetCodePoints.length == 0 || subsetCodePointMap[ codePointDefToMapKey(ligature.components) ] != null ) ) {
                  let glyph = font.getGlyph(ligature.glyph)
                  let nextGlyphDef = glyphDef(ligature.components, glyph.path.toSVG(), glyph.name, glyph.advanceWidth, false)
                  if(nextGlyphDef != '') {
                    glyphDefs.push(nextGlyphDef)
                  }
                }
              }); 
            });
          } catch(innerErr) { }
        });
      }
    });
  } catch(outerErr) {  }

  let sortedCodePoints = Object.keys(seenCodePoints).sort( (a,b) => { return a-b; } )
  let uRangeDef = 'U+' + zeroPad(sortedCodePoints[0].toString(16), 8) + '-' + zeroPad(sortedCodePoints[sortedCodePoints.length-1].toString(16), 8)
  let bboxDef = font.bbox.minX + "," + font.bbox.minY + "," + font.bbox.maxX + "," + font.bbox.maxY
  let panoseDef = font['OS/2'].panose != null ? font['OS/2'].panose : '0 0 0 0 0 0 0 0 0 0'
  let weight = font['OS/2'].usWeightClass != null ? '" weight="' + font['OS/2'].usWeightClass : ''
  


  let header = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" ><svg xmlns="http://www.w3.org/2000/svg"><metadata></metadata><defs>\n'

  let fontDef = '<font id="' + font.postscriptName + "\" >\n"
  let fontFaceDef = '<font-face font-family="' + font.familyName + 
    '" font-stretch="normal" units-per-em="' + font.unitsPerEm + weight +
    '" panose-1="' + panoseDef + 
    '" ascent="' + font.ascent + 
    '" descent="' + font.descent + 
    '" x-height="' + font.xHeight + 
    '" underline-thickness="' + font.underlineThickness +
    '" underline-position="' + font.underlinePosition +
    '" unicode-range="' + uRangeDef +
    '" bbox="' + bboxDef +
    
    '" />\n' ;



  let footer = '</font>\n</defs>\n</svg>'


  return header + fontDef + fontFaceDef + glyphDefs.join("\n") + footer

}

function convertToFile(otfInput, svgOutputPath=null, subsetCodePoints=null) {

  let fs = require('fs');
  let svgData =  convert(otfInput, subsetCodePoints)
  if(svgOutputPath == null && (!Buffer.isBuffer(otfInput))) {
    svgOutputPath = otfInput.replace(/\.[^.]*$/, '') + ".svg"
  }
  if(svgOutputPath == null) {
    svgOutputPath = "output.svg"
  }
  fs.writeFileSync( svgOutputPath, svgData)
  return svgOutputPath
}


function cli() {

  let otfInputPath = process.argv[2]
  let svgOutputPath = process.argv[3]

  if(otfInputPath == null) {
    console.warn("ERROR: No Input OTF File specified.");
    process.exit(1);
  }


  console.log("Converting " + otfInputPath )
  try {
    svgOutputPath = convertToFile(otfInputPath, svgOutputPath);
  } catch(err) {
    console.log("ERROR: " + err)
    process.exit(1)
  }
  console.log("Done.");
  console.log(svgOutputPath + " has been created.")
  process.exit(0)

}


if (require.main === module) {
  cli();  
}

exports.convert = convert;
exports.convertToFile = convertToFile;
