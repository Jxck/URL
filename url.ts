/// <reference path="types/webidl.d.ts" />
/// <reference path="types/array.d.ts" />
/// <reference path="types/obtain-unicode.d.ts" />
/// <reference path="types/utf8-encoding.d.ts" />

// TODO: Fixme does not exist on type 'string'... ?
interface String {
  codePoint(): number;
}

if (String.prototype.codePoint === undefined) {
  Object.defineProperty(String.prototype, 'codePoint', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function(): number[] {
      return obtainUnicode(this);
    }
  });
}

// polyfill for String.fromCodePoint
declare var String: {
  new (value?: any): String;
  (value?: any): string;
  prototype: String;
  fromCharCode(...codes: number[]): string;
  /**
   * Pollyfill of String.fromCodePoint
   */
  fromCodePoint(...codePoints: number[]): string;
};

// polyfill for Array.prototype.includes
if (Array.prototype.includes === undefined) {
  Object.defineProperty(Array.prototype, 'includes', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function(e: number): boolean {
      return this.indexOf(e) !== -1
    }
  });
}

// for dynamic require
declare var require: any;

// import only type info
import ou = require("obtain-unicode");

var obtainUnicode: typeof ou.obtainUnicode;
if (typeof window === "undefined") { // in node.js
  obtainUnicode = require("obtain-unicode").obtainUnicode;
}

// import only type info
import te = require('utf8-encoding');

var TextEncoder: typeof te.TextEncoder;
var TextDecoder: typeof te.TextDecoder;
if (typeof window === 'undefined') { // in node.js
  TextEncoder = require('utf8-encoding').TextEncoder;
  TextDecoder = require('utf8-encoding').TextDecoder;
}

var encoder = new TextEncoder("utf-8");
var decoder = new TextDecoder();

// import only type info
var URLSearchParams = require('urlsearchparams').URLSearchParams;

// MEMO: code point
// ",  #,  $,  %,  &,  ',  (,  ),  *,  +,  ,   -,  .,  /
// 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47

//  0, ...,  9
// 48, ..., 57

//  :,  ;,  <,  =,  >,  ?,  @
// 58, 59, 60, 61, 62, 63, 64

//  A, ...,  Z
// 65, ..., 90

//  [,  \,  ],  ^,  _,  `
// 91, 92, 93, 94, 95, 96

//  a, ...,   z
// 97, ..., 122

//   {,   |,   },   ~
// 123, 124, 125, 126


// original type
type CodePoint = number;
var EOF: any = undefined;

function copy<T>(obj: T): T {
  "use strict";
  return JSON.parse(JSON.stringify(obj));
}

function toLower(codePoint: CodePoint): CodePoint{
  if (!inRange(65, codePoint, 90)) {
    return codePoint;
  }
  return codePoint + 32;
}

function toUpper(codePoint: CodePoint): CodePoint {
  if (!inRange(97, codePoint, 122)) {
    return codePoint;
  }
  return codePoint - 32;
}

function toString(codePoints: CodePoint[]): string {
  return String.fromCodePoint.apply(null, codePoints);
}

function encode(input: CodePoint[], encodingOverride: string = "utf-8"): CodePoint[] {
  if (encodingOverride !== "utf-8") {
    throw new Error("support utf-8 only");
  }

  var encoded: Uint8Array = encoder.encode(toString(input));
  return Array.prototype.slice.call(encoded);
}

function decode(input: CodePoint[]): string {
  return decoder.decode(new Uint8Array(input));
}

function percentEncode(input: CodePoint[]): CodePoint[] {
  var result: CodePoint[] = [];
  for (var i = 0; i < input.length; i ++) {
    var hex = input[i].toString(16).toUpperCase();
    if (hex.length === 1) {
      hex = "0" + hex;
    }
    result = result.concat(obtainUnicode("%" + hex));
  }
  return result;
}

function percentDecode(input: CodePoint[]): CodePoint[] {
  function range(b: number): boolean {
    return !inRange(0x30, b, 0x39)
        && !inRange(0x41, b, 0x46)
        && !inRange(0x61, b, 0x66)
  }

  // step 1
  var output: CodePoint[] = [];

  // step 2
  for (var i=0; i<input.length; i++) {
    var byt = input[i];

    // setp 2-1
    if (byt !== 37) { // %
      output.push(byt);
    }

    // step 2-2
    else if (byt === 37
          && range(input[i+1])
          && range(input[i+2])
    ) { // %
      output.push(byt);
    }

    // step 2-3
    else {
      // step 2-3-1
      var bytePoint = parseInt(decode([input[i+1], input[i+2]]), 16);

      // step 2-3-2
      output.push(bytePoint);

      // step 2-3-3
      i = i + 2;
    }
  }

  return output;
}

// https://url.spec.whatwg.org/#concept-ipv6-parser
function parseIPv6(input: CodePoint[]): number[] {

  // step 1
  var address: number[] = [0, 0, 0, 0, 0, 0, 0, 0]; // 16bit * 8

  // step 2
  var piecePointer: number = 0;
  var piece: number = address[piecePointer];

  // step 3
  var compressPointer: number = null;

  // step 4
  var pointer: number = 0;

  // step 5
  if (input[pointer] === 58) { // :
    // step 5-1
    if (input[pointer+1] !== 58) { // :
      console.error("parse error");
      throw new Error("failure");
    }

    // step 5-2
    pointer = pointer + 2;

    // step 5-3
    piecePointer = piecePointer + 1;
    compressPointer = piecePointer;
  }

  return Main(address, input, pointer, piecePointer, compressPointer);
}

  // step 6
  // https://url.spec.whatwg.org/#concept-ipv6-parser-main
function Main(address: number[], input: CodePoint[], pointer: number, piecePointer: number, compressPointer: number): number[] {
  while(input[pointer] !== EOF) {
    // step 6-1
    if (piecePointer === 8) {
      console.error("parse error");
      throw new Error("failure");
    }

    // step 6-2
    if (input[pointer] === 58) { // :
      // step 6-2-1
      if (compressPointer !== null) {
        console.error("parse error");
        throw new Error("failure");
      }

      // step 6-2-2
      pointer = pointer + 1;
      piecePointer = piecePointer + 1;
      compressPointer = piecePointer;
      return Main(address, input, pointer, piecePointer, compressPointer);
    }

    // step 6-3
    var value = 0;
    var len = 0; // length

    // step 6-4
    while (len < 4 && isASCIIHexDigits(input[pointer])) {
      value = value * 0x10 + parseInt(String.fromCodePoint(input[pointer]), 16);
      pointer = pointer + 1;
      len = len + 1;
    }

    // step 6-5
    switch (input[pointer]) {
    case 46: // "."
      if (len === 0) {
        console.error("parse error");
        throw new Error("failure");
      }

      pointer = pointer - len;
      // goto IPv4; // TODO
      return IPv4(address, input, pointer, piecePointer, compressPointer);
    case 58: // ":"
      pointer = pointer + 1;
      if (input[pointer] === EOF) {
        console.error("parse error");
        throw new Error("failure");
      }
      break;
    default:
      if (input[pointer] === EOF) {
        break;
      }
      console.error("parse error");
      throw new Error("failure");
    }

    // step 6-6
    // piece
    address[piecePointer] = value;

    // step 6-7
    piecePointer = piecePointer + 1;
  }

  // step 7
  if (input[pointer] === EOF) {
    // goto Finale; // TODO
    return Finale(address, input, pointer, piecePointer, compressPointer);
  }

  return IPv4(address, input, pointer, piecePointer, compressPointer);
}

// step 8
function IPv4(address: number[], input: CodePoint[], pointer: number, piecePointer: number, compressPointer: number): number[] {
  if (piecePointer > 6) {
    console.error("parse error");
    throw new Error("failure");
  }

  // step 9
  var dotsSeen = 0;

  // step 10
  while(input[pointer] !== EOF) {
    // step 10-1
    var value: number = null;

    // step 10-2
    if (!isASCIIDigits(input[pointer])) {
      console.error("parse error");
      throw new Error("failure");
    }

    // step 10-3
    while (isASCIIDigits(input[pointer])) {
      input[pointer] = input[pointer];

      // step 10-3-1
      var num: number = parseInt(String.fromCodePoint(input[pointer]), 10); // number

      // step 10-3-2
      if (value === null) {
        value = num;
      }
      else if (value === 0) {
        console.error("parse error");
        throw new Error("failure");
      }
      else {
        value = value * 10 + num;
      }

      // step 10-3-3
      pointer = pointer + 1;

      // step 10-3-4
      if (value > 255) {
        console.error("parse error");
        throw new Error("failure");
      }
    }

    // step 10-4
    if (dotsSeen < 3 && input[pointer] !== 46) { // .
      console.error("parse error");
      throw new Error("failure");
    }

    // step 10-5
    address[piecePointer] = address[piecePointer] * 0x100 + value;

    // step 10-6
    if (dotsSeen === 1 || dotsSeen === 3) {
      piecePointer = piecePointer + 1;
    }

    // step 10-7
    pointer = pointer + 1;

    // step 10-8
    if (dotsSeen === 3 && input[pointer] !== EOF) {
      console.error("parse error");
      throw new Error("failure");
    }

    // step 10-9
    dotsSeen = dotsSeen + 1;
  }

  return Finale(address, input, pointer, piecePointer, compressPointer);
}

// step 11
function Finale(address: number[], input: CodePoint[], pointer: number, piecePointer: number, compressPointer: number): number[] {
  if (compressPointer !== null) {
    // step 11-1
    var swaps = piecePointer - compressPointer;

    // step 11-2
    piecePointer = 7;

    // step 11-3
    while (piecePointer !== 0 && swaps > 0) {
      var tmp = address[piecePointer];
      address[piecePointer] = address[compressPointer + swaps - 1];
      address[compressPointer + swaps - 1] = tmp;

      piecePointer = piecePointer - 1;
      swaps = swaps - 1;
    }
  }

  // step 12
  else if (compressPointer !== null && piecePointer !== 8) {
    console.error("parse error");
    throw new Error("failure");
  }

  // step 13
  return address;
}

// https://url.spec.whatwg.org/#concept-ipv6-serializer
function serializeIPv6(address: number[]): string {
  // step 1
  var output: string  = "";

  // step 2, 3
  function find(arr: number[]): number {
    arr.push(1); // append 1 for end of input

    var pos = -1; // current seq of 0 position
    var acc = 0;  // sum of 0
    var result = { pos: -1, acc: 0 }; // current max result
    for (var i=0; i<arr.length; i++) {
      if (arr[i] === 0) {
        if (pos === -1) {
          // start of 0 seq
          pos = i;
        }
        acc ++;
      } else {
        if (acc > 0) {
          if (result.acc < acc) {
            // update result
            result = { pos: pos, acc: acc };
          }
          // clear
          acc = 0;
          pos = -1;
        }
      }
    }

    arr.pop(); // remove 1 added at top of this function
    return result.acc > 1 ? result.pos: null;
  }
  var compressPointer = find(address);

  // step 4
  for (var index:number = 0; index < address.length; index ++) {
    var piece: number = address[index];

    // step 4-1
    if (compressPointer === index) {
      if (index === 0) {
        output = output + "::";
      } else {
        output = output + ":";
      }

      while(address[index+1] === 0) {
        index = index + 1;
      }
      continue;
    }

    // step 4-2
    output = output + piece.toString(16);

    // step 4-3
    if (index !== address.length - 1) {
      output = output + ":";
    }
  };

  return output;
}

// https://url.spec.whatwg.org/#concept-host
type Host = string | number[];

// https://url.spec.whatwg.org/#concept-host-parser
function parseHost(input: CodePoint[], unicodeFlag?: boolean): Host {
  // step 1
  if (input.length === 0) {
    throw new Error("failure");
  }

  // step 2
  if (input[0] === 91) { // [
    // step 2-1
    if (input[input.length-1] !== 93) { // ]
      console.error("parse error");
      throw new Error("failure");
    }

    // step 2-2
    return parseIPv6(input.slice(1, -1));
  }

  // step 3
  var domain: string = decode(percentDecode(encode(input)));

  var asciiDomain: string;

  try {
    // step 4
    asciiDomain = jURL.domainToASCII(domain);
  } catch (failure) {
    // step 5
    throw failure;
  }

  // step 6
  var check = [ "\u0000", "\t", "\n", "\r", " ", "#", "%", "/", ":", "?", "@", "[", "\\", "]" ].some((s) => {
    return asciiDomain.indexOf(s) !== -1;
  });
  if (check === true) {
    throw new Error("failure");
  }

  // step 7
  if (unicodeFlag) { // TODO: sent a bug to clearify default flag, so follow to update spec.
    return asciiDomain;
  } else {
    return jURL.domainToUnicode(asciiDomain);
  }
}

// https://url.spec.whatwg.org/#concept-host-serializer
function serializeHost(host: Host): string {
  // step 1
  if (host === null) {
    return "";
  }

  // step 2
  if (isIPv6(host)) {
    return "[" + serializeIPv6(<Array<number>> host) + "]";
  }

  // step 3
  else if(isDomain(host)) {
    return <string>host;
  }
}


// https://html.spec.whatwg.org/multipage/browsers.html#unicode-serialisation-of-an-origin
// origin [scheme, host, port];
function serializeOriginInUnicode(origin: { scheme: string; host: Host; port: string; }): string {
  // step 1
  if (!origin) {
    return "null";
  }

  // step 2
  var result = origin.scheme;

  // step 3
  result = result + "://";

  // step 4
  // TODO: how to handle if Host is Array?
  // result = result + origin.host.split(".").map((component) => {
  //    return jURL.domainToUnicode(component);
  //  }).join(".");
  result = result + serializeHost(origin.host);

  // step 5
  if (origin.port !== relativeScheme[origin.scheme]) {
    result = result + ":" + origin.port;
  }

  return result;
}


/**
 * Encode Set
 */
type EncodeSet = (p: CodePoint) => boolean;

// https://url.spec.whatwg.org/#simple-encode-set
function simpleEncodeSet(codePoint: CodePoint): boolean {
  // all code points less than U+0020 (i.e. excluding U+0020) and all code points greater than U+007E.
  return codePoint < 0x0020 || 0x007E < codePoint;
}

// https://url.spec.whatwg.org/#default-encode-set
function defaultEncodeSet(codePoint: CodePoint): boolean {
  // simple encode set and code points U+0020, '"', "#", "<", ">", "?", and "`".
  return simpleEncodeSet(codePoint) || ([0x20, 34, 35, 60, 62, 63, 96].includes(codePoint));
}

// https://url.spec.whatwg.org/#username-encode-set
function passwordEncodeSet(codePoint: CodePoint): boolean {
  // default encode set and code points "/", "@", and "\".
  return defaultEncodeSet(codePoint) || ([0x47, 0x64, 0x92].includes(codePoint));
}

// https://url.spec.whatwg.org/#username-encode-set
function usernameEncodeSet(codePoint: CodePoint): boolean {
  // password encode set and code point ":".
  return passwordEncodeSet(codePoint) || codePoint === 58;
}

// https://url.spec.whatwg.org/#utf_8-percent-encode
function utf8PercentEncode(codePoint: CodePoint, encodeSet: EncodeSet): CodePoint[] {
  // step 1
  if (encodeSet(codePoint) === false) {
    return [codePoint];
  }

  // step 2
  var bytes: CodePoint[] = encode([codePoint]);

  // step 3
  var result: CodePoint[] = percentEncode(bytes);

  return result;
}

function inRange(from: number, tar: number, to: number): boolean {
  return (from <= tar && tar <= to);
}

// https://url.spec.whatwg.org/#ascii-digits
function isASCIIDigits(codePoint: CodePoint): boolean {
  return inRange(0x30, codePoint, 0x39);
}

// https://url.spec.whatwg.org/#ascii-hex-digits
function isASCIIHexDigits(codePoint: CodePoint): boolean {
  return isASCIIDigits(codePoint) || inRange(0x41, codePoint, 0x46) || inRange(0x61, codePoint, 0x66);
}

// https://url.spec.whatwg.org/#ascii-alpha
function isASCIIAlpha(codePoint: CodePoint): boolean {
  return inRange(0x41, codePoint, 0x5A) || inRange(0x61, codePoint, 0x7A);
}

// https://url.spec.whatwg.org/#ascii-alphanumeric
function isASCIIAlphaNumeric(codePoint: CodePoint): boolean {
  return isASCIIDigits(codePoint) || isASCIIAlpha(codePoint);
}

// https://url.spec.whatwg.org/#url-code-points
function isURLCodePoint(codePoint: CodePoint): boolean {
  if (isASCIIAlphaNumeric(codePoint)) {
    return true;
  }

  // ["!", "$", "&", "'", "(", ")", "*", "+", ",", "-",
  //  ".", "/", ":", ";", "=", "?", "@", "_", "~"]
  var signs: CodePoint[] = [ 33, 36, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 58, 59, 61, 63, 64, 95, 126 ];
  if (signs.includes(codePoint)) {
    return true;
  }

  if (inRange(0x00A0  , codePoint, 0xD7FF  )) return true;
  if (inRange(0xE000  , codePoint, 0xFDCF  )) return true;
  if (inRange(0xFDF0  , codePoint, 0xFFFD  )) return true;
  if (inRange(0x10000 , codePoint, 0x1FFFD )) return true;
  if (inRange(0x20000 , codePoint, 0x2FFFD )) return true;
  if (inRange(0x30000 , codePoint, 0x3FFFD )) return true;
  if (inRange(0x40000 , codePoint, 0x4FFFD )) return true;
  if (inRange(0x50000 , codePoint, 0x5FFFD )) return true;
  if (inRange(0x60000 , codePoint, 0x6FFFD )) return true;
  if (inRange(0x70000 , codePoint, 0x7FFFD )) return true;
  if (inRange(0x80000 , codePoint, 0x8FFFD )) return true;
  if (inRange(0x90000 , codePoint, 0x9FFFD )) return true;
  if (inRange(0xA0000 , codePoint, 0xAFFFD )) return true;
  if (inRange(0xB0000 , codePoint, 0xBFFFD )) return true;
  if (inRange(0xC0000 , codePoint, 0xCFFFD )) return true;
  if (inRange(0xD0000 , codePoint, 0xDFFFD )) return true;
  if (inRange(0xE0000 , codePoint, 0xEFFFD )) return true;
  if (inRange(0xF0000 , codePoint, 0xFFFFD )) return true;
  if (inRange(0x100000, codePoint, 0x10FFFD)) return true;

  return false;
}

// https://url.spec.whatwg.org/#relative-scheme
var relativeScheme: { [index: string] : string } = {
  ftp   : "21",
  file  : "",
  gopher: "70",
  http  : "80",
  https : "443",
  ws    : "80",
  wss   : "443"
}

function isRelativeScheme(scheme: string): boolean {
  return Object.keys(relativeScheme).includes(scheme);
}

// https://url.spec.whatwg.org/#local-scheme
var localScheme = [ "about", "blob", "data", "filesystem" ];


function isIPv6(host: Host): boolean {
  return (Array.isArray(host) && host.length === 8);
}

function isDomain(host: Host): boolean {
  return (typeof host === "string");
}

interface IPair {
  name:  USVString;
  value: USVString;
}

// https://url.spec.whatwg.org/#concept-urlencoded-parser
function parseURLEncoded(input: CodePoint[], encodingOverride?: string, useCharset?: boolean, isIndex?: boolean): IPair[] {
  "use strict";

  // step 1
  if (encodingOverride === undefined) {
    encodingOverride = "utf-8";
  }

  // step 2
  if (encodingOverride !== "utf-8") {
    // omit byte range checking (=<0x7F)
    throw new Error("unsupported encoding");
  }

  // step 3
  var sequences: CodePoint[][] = [];
  while (true) {
    var i = input.indexOf(38); // &
    if (i < 0) {
      sequences.push(input);
      break;
    }
    sequences.push(input.splice(0, i));
    input.shift();
  }

  // step 4
  if (isIndex === true) {
    if (sequences[0].indexOf(61) === -1) { // =
      sequences[0].unshift(61);
    }
  }

  // step 5, 6
  var pairs: IPair[] = sequences.map((bytes: number[]): IPair => {
    // step 6-1
    if (bytes.length === 0) return;

    // step 6-2
    var name: number[], value: number[];
    var i = bytes.indexOf(61);
    if (i > 0) { // =
      name = bytes.splice(0, i);
      bytes.shift();
      value = bytes;
    }

    // step 6-3
    else {
      name  = bytes;
      value = [];
    }

    // step 4
    name.map((e: number) => {
      if (e === 43) { // +
        e = 0x20;
      }
      return e;
    });

    // step 5
    if (useCharset && toString(name) === "_charset_") {
      throw new Error("unsupported flug '_charset_'");
    }

    // step 8 parsent decode
    return {
      name: decode(percentDecode(name)),
      value: decode(percentDecode(value))
    };
  });

  return pairs;
}

// https://url.spec.whatwg.org/#concept-urlencoded-serializer
function serializeURLEncoded(pairs: IPair[], encodingOverride?: string): string {
  "use strict";

  // step 1
  if (encodingOverride === undefined) {
    encodingOverride = "utf-8";
  }

  // this imeplementation support only utf-8
  if (encodingOverride !== "utf-8") {
    throw new Error("unsupported encoding");
  }

  // step 2
  var output = "";

  // step 3
  pairs.forEach((pair: IPair, index: number) => {
    // step 3-1
    var outputPair = copy(pair);

    // step 3-2
    var encodedName = encoder.encode(outputPair.name);
    var encodedValue = encoder.encode(outputPair.value);

    // step 3-3
    outputPair.name = byteSerializeURLEncoded(Array.prototype.slice.call(null, encodedName));
    outputPair.value = byteSerializeURLEncoded(Array.prototype.slice.call(null, encodedValue));

    // step 3-4
    if (index !== 0) {
      output += "&";
    }

    // step 3-5
    output += `${outputPair.name}=${outputPair.value}`;
  });

  // step 4
  return output;
}

// https://url.spec.whatwg.org/#concept-urlencoded-byte-serializer
function byteSerializeURLEncoded(input: CodePoint[]): string {
  "use strict";

  // step 1
  var output: CodePoint[] = [];

  // step 2
  for (var i = 0; i < input.length; i++) {
    var byt = input[i];
    if (byt === 0x20) {
      output.push(0x2B);
      continue;
    }

    if ([0x2A, 0x2D, 0x2E].indexOf(byt) !== -1) {
      output.push(byt);
      continue;
    }

    if (0x30 <= byt && byt <= 0x39) {
      output.push(byt);
      continue;
    }

    if (0x41 <= byt && byt <= 0x5A) {
      output.push(byt);
      continue;
    }

    if (byt === 0x5F) {
      output.push(byt);
      continue;
    }

    if (0x61 <= byt && byt <= 0x7A) {
      output.push(byt);
      continue;
    }

    // otherwise
    output = output.concat(percentEncode([byt]));
  }

  // step 3
  return toString(output);
}


//[NoInterfaceObject, Exposed=(Window,Worker)]
// interface URLUtilsReadOnly {
//   stringifier readonly attribute USVString href;
//   readonly attribute USVString origin;
//
//   readonly attribute USVString protocol;
//   readonly attribute USVString host;
//   readonly attribute USVString hostname;
//   readonly attribute USVString port;
//   readonly attribute USVString pathname;
//   readonly attribute USVString search;
//   readonly attribute USVString hash;
// };

//[NoInterfaceObject, Exposed=(Window,Worker)]
//interface URLUtils {
//  stringifier attribute USVString href;
//  readonly attribute USVString origin;
//
//           attribute USVString protocol;
//           attribute USVString username;
//           attribute USVString password;
//           attribute USVString host;
//           attribute USVString hostname;
//           attribute USVString port;
//           attribute USVString pathname;
//           attribute USVString search;
//           attribute URLSearchParams searchParams;
//           attribute USVString hash;
//};
interface IURLUtils {
  href:         USVString; // stringifier

  origin:       USVString; // readonly

  protocol:     USVString;
  username:     USVString;
  password:     USVString;
  host:         USVString;
  hostname:     USVString;
  port:         USVString;
  pathname:     USVString;
  search:       USVString;
  searchParams: typeof URLSearchParams;
  hash:         USVString;
}

//[Constructor(USVString url, optional USVString base = "about:blank"), Exposed=(Window,Worker)]
//interface URL {
//  static USVString domainToASCII(USVString domain);
//  static USVString domainToUnicode(USVString domain);
//};

//URL implements URLUtils;
interface IURL extends IURLUtils {
  // static domainToASCII(domain: string):   string;
  // static domainToUnicode(domain: string): string;
}

enum State {
  SchemeStartState,
  SchemeState,
  SchemeDataState,
  NoSchemeState,
  RelativeOrAuthorityState,
  RelativeState,
  RelativeSlashState,
  AuthorityFirstSlashState,
  AuthoritySecondSlashState,
  AuthorityIgnoreSlashesState,
  AuthorityState,
  FlagmentState,
  FileHostState,
  HostState,
  HostNameState,
  PortState,
  RelativePathStartState,
  RelativePathState,
  QueryState,
  FragmentState,
}

// https://url.spec.whatwg.org/#urls
class innerURL {
  // https://url.spec.whatwg.org/#concept-url-scheme
  scheme: string = '';

  // https://url.spec.whatwg.org/#concept-url-scheme-data
  schemeData: string = '';

  // https://url.spec.whatwg.org/#concept-url-username
  username: string = '';

  // https://url.spec.whatwg.org/#concept-url-password
  password: string = null;

  // https://url.spec.whatwg.org/#concept-url-host
  host: string = null;

  // https://url.spec.whatwg.org/#concept-url-port
  port: string = '';

  // https://url.spec.whatwg.org/#concept-url-path
  path: string[] = [];

  // https://url.spec.whatwg.org/#concept-url-query
  query: string = null;

  // https://url.spec.whatwg.org/#concept-url-fragment
  fragment: string = null;

  // https://url.spec.whatwg.org/#relative-flag
  private relativeFlag = false;

  // https://url.spec.whatwg.org/#concept-url-object
  private object: Blob = null;

  // https://url.spec.whatwg.org/#concept-url-object
  get isLocal(): boolean {
    return ["about", "blob", "data", "filesystem"].indexOf(this.scheme) > -1;
  }

  // https://url.spec.whatwg.org/#include-credentials
  get includeCredentials(): boolean {
    return this.username !== '' || this.password !== null;
  }
}

// CAUTION: URL already in lib.d.ts
class jURL implements IURL {

  // https://url.spec.whatwg.org/#concept-urlutils-input
  private input: string;

  // https://url.spec.whatwg.org/#concept-urlutils-query-encoding
  private encoding: string; // support utf-8 only

  // https://url.spec.whatwg.org/#concept-urlutils-query-object
  queryObject: typeof URLSearchParams = null;

  // https://url.spec.whatwg.org/#concept-urlutils-url
  private url: jURL = null;

  // https://url.spec.whatwg.org/#concept-url-origin
  get _origin(): { scheme: string; host: Host; port: string; } {

    // TODO: golobally unique identifier
    var GUID: { scheme: string; host: Host; port: string; } = null;

    switch(this.scheme) {
    case "blob":
      var url: jURL;
      try {
        url = this.parseBasicURL(this.schemeData);
      } catch(err) {
        return GUID;
      }
      return url._origin;
      break;
    case "ftp":
    case "gopher":
    case "http":
    case "https":
    case "ws":
    case "wss":
      var o = {
        scheme: this.scheme,
        host: this._host,
        port: this._port !== "" ? this._port: relativeScheme[this.scheme]
      };
      return o;
      break;
    case "file":
      return GUID;
      break;
    default:
      return GUID;
    }
  }

  // https://url.spec.whatwg.org/#dom-urlutils-origin
  get origin(): USVString {
    if (this.url === null) {
      return "";
    }
    return serializeOriginInUnicode(this._origin);
  }

  // https://url.spec.whatwg.org/#concept-url-scheme
  private scheme:      string = "";

  // https://url.spec.whatwg.org/#concept-url-scheme-data
  private schemeData:  string = "";

  // https://url.spec.whatwg.org/#concept-url-path
  private path:        string[] = [];

  // https://url.spec.whatwg.org/#concept-url-query
  private query:       string = null;

  // https://url.spec.whatwg.org/#concept-url-fragment
  private fragment:    string = null;

  // https://url.spec.whatwg.org/#relative-flag
  private relativeFlag: boolean = false;

  // https://url.spec.whatwg.org/#concept-url-object
  private object: Blob = null;

  // https://url.spec.whatwg.org/#concept-urlutils-get-the-base
  private _base: jURL = null;

  get base(): jURL {
    return this._base;
  }

  // https://url.spec.whatwg.org/#dom-urlutils-href
  get href(): string {
    // step 1
    if (this.url === null) {
      return this.input;
    }

    // step 2
    return this.serializeURL(this.url);
  }

  set href(value: string) {
    // step 1
    var input = value;

    // step 2
    if (this instanceof jURL) {
      var parsedURL: jURL;
      try {
        // step 1
        parsedURL = this.parseBasicURL(input, this.base);
      } catch(err) {
        // step 2
        throw new TypeError(err);
      }

      this.setTheInput("", parsedURL);
    }

    // step 3
    else {
      // step 3-1
      this.setTheInput(input);

      // step 3-2
      this.preUpdateSteps(input);
    }
  }

  // https://url.spec.whatwg.org/#dom-urlutils-protocol
  get protocol(): USVString {
    // setp 1
    if (this.url === null) {
      return ":";
    }

    // step 2
    return this.scheme + ":";
  }

  set protocol(value: string) {
    // step 1
    if (this.url === null) {
      return; // TODO: terminate
    }

    // step 2
    var url = this.parseBasicURL(value + ":", null, null, this.url, State.SchemeStartState);

    // step 3
    // TODO: ????
  }

  // https://url.spec.whatwg.org/#concept-url-username
  private _username:     USVString = "";

  // https://url.spec.whatwg.org/#dom-urlutils-username
  get username(): USVString {
    // step 1
    if (this.url === null) {
      return "";
    }

    // step 2
    return this._username;
  }

  set username(value: USVString) {
    // step 1
    if (this.url === null || this.relativeFlag === false) {
      return; // TODO: terminate
    }

    // step 2
    this.setTheUsername(value);

    // step 3
    // TODO: ???
  }

  // https://url.spec.whatwg.org/#concept-url-password
  private _password:     USVString = null;

  // https://url.spec.whatwg.org/#dom-urlutils-password
  get password(): USVString {
    // step 1
    if (this.url === null || this._password === null) {
      return "";
    }

    // step 2
    return this._password
  }

  set password(value: USVString) {
    // step 1
    if (this.url === null || this.relativeFlag === false) {
      return; // TODO: terminate
    }

    // step 2
    this.setThePassword(value);

    // step 3
    // TODO: ???
  }

  // https://url.spec.whatwg.org/#concept-url-host
  private _host: Host = null;

  // https://url.spec.whatwg.org/#dom-urlutils-host
  get host(): USVString {
    // step 1
    if(this.url === null) {
      return "";
    }

    // step 2
    if (this._port === "") {
      return serializeHost(this._host);
    }

    // step 3
    return serializeHost(this._host) + ":" + this._port;
  }

  // https://url.spec.whatwg.org/#dom-urlutils-hostname
  get hostname(): USVString {
    // step 1
    if (this.url === null) {
      return "";
    }

    // step 2
    return serializeHost(this._host);
  }

  set hostname(value: USVString) {
    // step 1
    if (this.url === null || this.relativeFlag === false) {
      return; // TODO: terminate
    }

    // step 2
    var url = this.parseBasicURL(value, null, null, this.url, State.HostNameState);

    // step 3
    // TODO: ???
  }

  // https://url.spec.whatwg.org/#concept-url-port
  private _port:         USVString = "";

  // https://url.spec.whatwg.org/#dom-urlutils-port
  get port() {
    // step 1
    if (this.url === null) {
      return "";
    }

    // step 2
    return this._port;
  }

  set port(value: USVString) {
    // step 1
    if (this.url === null || this.relativeFlag === false || this.scheme === "file") {
      return; // TODO: terminate
    }

    // step 2
    var url = this.parseBasicURL(value, null, null, this.url, State.PortState);

    // step 3
    // TODO: ???
  }

  // https://url.spec.whatwg.org/#dom-urlutils-pathname
  get pathname() {
    // step 1
    if (this.url === null) {
      return "";
    }

    // step 2
    if (this.relativeFlag === false) {
      return this.schemeData;
    }

    // step 3
    return "/" + this.path.join("/");
  }

  set pathname(value: USVString) {
    // step 1
    if (this.url === null || this.relativeFlag === false) {
      return; // TODO: terminate
    }

    // step 2
    this.path = [];

    // step 3
    var url = this.parseBasicURL(value, null, null, this.url, State.RelativePathStartState);

    // step 3
    // TODO: ???
  }

  // https://url.spec.whatwg.org/#dom-urlutils-search
  get search() {
    // step 1
    if (this.url === null || this.query === null || this.query === "") {
      return "";
    }

    // step 2
    return "?" + this.query;
  }

  set search(value: USVString) {
    // step 1
    if (this.url === null) {
      return; // TODO: terminate
    }

    // step 2
    if (value === "") {
      this.query = null;
      this.queryObject.list = null;
      // TODO: update steps
      return; // TODO: terminate
    }

    // step 3
    var input = value[0] === "?" ? value: value.slice(1);

    // step 4
    this.query = "";

    // step 5
    var url = this.parseBasicURL(input, null, this.queryEncoding, this.url, State.QueryState);

    // step 6
    this.queryObject.list = this.parse(input);

    // step 7
    // TODO: query object update steps
  }

  // https://url.spec.whatwg.org/#dom-urlutils-searchparams
  get searchParams(): typeof URLSearchParams {
    return this.queryObject;
  }

  // TODO
  set searchParams(value) {
  }

  // https://url.spec.whatwg.org/#dom-urlutils-hash
  get hash(): USVString {
    // step 1
    if (this.url === null || this.fragment === null || this.fragment === "") {
      return "";
    }

    // step 2
    return "#" + this.fragment;
  }

  set hash(value) {
    // step 1
    if (this.url === null || this.scheme === "javascript") {
      return; // TODO: terminate
    }

    // step 2
    if (value === "") {
      this.fragment = null;
      // TODO: pre-update
      return; // TODO: terminate
    }

    // step 3
    var input = value[0] === "#" ? value: value.slice(1);

    // step 4
    this.fragment = "";

    // step 5
    this.parseBasicURL(input, null, null, this.url, State.FragmentState);

    // step 6
    // TODO: pre-update
  }

  // https://url.spec.whatwg.org/#concept-urlutils-query-encoding
  queryEncoding: string;

  static domainToASCII(domain: string):   string {
    // TODO: implement me
    return domain;
  }

  static domainToUnicode(domain: string): string {
    // TODO: implement me
    return domain;
  }

  // https://url.spec.whatwg.org/#constructors
  constructor(url:USVString, base:USVString = "about:blank") {
    try {
      // step 1
      var parsedBase = this.parseBasicURL(base);
    } catch(failure) {
      // step 2
      throw new TypeError("invalid url");
    }

    try {
      // step 3
      var parsedURL = this.parseBasicURL(url, parsedBase);
    } catch(failure) {
      // step 4
      throw new TypeError("invalid url");
    }

    // step 5
    var result = this;

    // step 6
    result._base = parsedBase;

    // step 7
    result.setTheInput("", parsedURL);

    // step 8
    return result;
  }

  // https://url.spec.whatwg.org/#concept-urlutils-set-the-input
  private setTheInput(input: string, url?: jURL) {
    // step 1
    if (url !== undefined) {
      this.url = url;
      this.input = input;
    }

    // step 2
    else {
      // step 2-1
      this.url = null;

      // step 2-2
      if (input === null) {
        this.input = "";
      }

      // step 2-3
      else {
        // step 2-3-1
        this.input = input;

        try {
          // step 2-3-2
          var url = this.parseURL(input, this.base, this.queryEncoding);

          // step 2-3-3
          this.url = url;
        } catch(failure) {
          throw failure;
        }
      }
    }

    // setp 3
    var query: string;
    if (url !== null && url.query !== null) {
      query = url.query;
    } else {
      query = "";
    }

    // step 4
    if (this.queryObject === null) {
      this.queryObject = new URLSearchParams(query);
      this.queryObject.urlObject.push(this);
    }

    // step 5
    else {
      this.queryObject.list.push(this.parse(query));
    }
  }

  // https://url.spec.whatwg.org/#set-the-username
  setTheUsername(username: USVString) {
    // step 1
    this._username = "";

    // step 2
    this._username = String.fromCodePoint.apply(obtainUnicode(username).map((c) => {
      return utf8PercentEncode(c, usernameEncodeSet);
    }));
  }

  // https://url.spec.whatwg.org/#set-the-password
  setThePassword(password: USVString) {
    // step 1
    if (password === "") {
      this._password = null;
    }

    // step 2
    else {
      // step 2-1
      this._password = "";

      // step 2-2
      this._password = String.fromCodePoint.apply(obtainUnicode(password).map((c) => {
        return utf8PercentEncode(c, passwordEncodeSet);
      }));
    }
  }

  private preUpdateSteps(value: string) {
    // TODO: implement me
  }

  private updateSteps() {
    // TODO: implement me
  }

  // https://url.spec.whatwg.org/#concept-urlencoded-string-parser
  private parse(input: string): IPair[] {
    return parseURLEncoded(Array.prototype.slice.call(encoder.encode(input)));
  }

  // https://url.spec.whatwg.org/#concept-url-parser
  private parseURL(input: string, base?: jURL, encodingOverride?: string): jURL {
    try {
      // step 1
      var url = this.parseBasicURL(input, base, encodingOverride);
    } catch(failure) {
      // step 2
      throw failure;
    }

    // step 3
    if (url.scheme !== "blob") {
      return url;
    }

    // step 4
    // TODO: support blob URL store

    // step 5
    // TODO: support blob URL store

    // step 6
    return url;
  }

  // https://url.spec.whatwg.org/#concept-basic-url-parser
  private parseBasicURL(input: string, base?: jURL, encodingOverride?: string, url?: jURL, stateOverride?: State): jURL {
    // step 1
    if (url === undefined) {
      // step 1-1
      url = this; // new URL

      // step 1-2
      input = input.trim();
    }

    // step 2
    var state: State = (stateOverride !== undefined)? stateOverride : State.SchemeStartState;

    // step 3
    base = (base !== undefined)? base : null;

    // step4
    encodingOverride = (encodingOverride !== undefined) ? encodingOverride : "utf-8";

    // step 5
    var buffer: CodePoint[] = [];

    // step 6
    var flagAt:    boolean = false; // @flag
    var flagParen: boolean = false; // []flag

    // step 7
    var pointer: number = 0;
    var encodedInput: CodePoint[] = obtainUnicode(input);

    // step 8
    while (pointer < encodedInput.length + 1) {
      var c: CodePoint = encodedInput[pointer];

      // console.log(toString(buffer));

      switch(state) {

      // https://url.spec.whatwg.org/#scheme-start-state
      case State.SchemeStartState:
        // step 1
        if (isASCIIAlpha(c)) {
          buffer.push(toLower(c));
          state = State.SchemeState;
        }

        // step 2
        else if (stateOverride === undefined) {
          state = State.NoSchemeState;
          pointer = pointer - 1;
        }

        // step 3
        else {
          console.error("parse error");
          return; // TODO: terminate
        }

        break;

      // https://url.spec.whatwg.org/#scheme-state
      case State.SchemeState:
        // step 1
        if (isASCIIAlphaNumeric(c) || [43, 45, 46].includes(c)) { // +, -, .
          buffer.push(toLower(c));
        }

        // step 2
        else if (c === 58) { // :
          url.scheme = toString(buffer);
          buffer = [];

          // step 2-1
          if (stateOverride !== undefined) {
            return; // TODO: terminate
          }

          // step 2-2
          if (isRelativeScheme(url.scheme)) {
            url.relativeFlag = true;
          }

          // step 2-3
          if (url.scheme === "file") {
            state = State.RelativeState;
          }

          // step 2-4
          else if (url.relativeFlag === true
                   && base !== null
                   && base.scheme === url.scheme) {
            state = State.RelativeOrAuthorityState;

          }

          // step 2-5
          else if (url.relativeFlag === true) {
            state = State.AuthorityFirstSlashState;
          }

          // step 2-6
          else {
            state = State.SchemeDataState;
          }
        }

        // step 3
        else if (stateOverride === undefined) {
          buffer = [];
          state = State.NoSchemeState;
          pointer = 0;
          continue;
        }

        // step 4
        else if (isNaN(c)) {
          return; // TODO: terminate
        }

        // step 5
        else {
          console.error("parse error");
          return; // TODO: terminate
        }

        break;

      // https://url.spec.whatwg.org/#scheme-data-state
      case State.SchemeDataState:
        // step 1
        if (c === 63) { // ?
          url.query = "";
          state = State.QueryState;
        }

        // step 2
        else if (c === 35) { // #
          url.fragment = "";
          state = State.FlagmentState;
        }

        // step 3
        else {
          // step 3-1
          if (!isNaN(c) && !isURLCodePoint(c) && c !== 37) { // %
            console.error("parse error");
          }

          // step 3-2
          if (c === 37 // %
           && isASCIIHexDigits(encodedInput[pointer+1])
           && isASCIIHexDigits(encodedInput[pointer+2])) {
              console.error("parse error");
          }

          // step 3-3
          if (!isNaN(c) && ![0x9, 0xA, 0xD].includes(c)) {
            url.schemeData += toString(utf8PercentEncode(c, simpleEncodeSet));
          }
        }

        break;

      // https://url.spec.whatwg.org/#no-scheme-state
      case State.NoSchemeState:
        if (base === null || !isRelativeScheme(base.scheme)) {
          console.error("parse error");
          throw new Error("failure");
        }

        else {
          state = State.RelativeState;
          pointer = pointer - 1;
        }

        break;

      // https://url.spec.whatwg.org/#relative-or-authority-state
      case State.RelativeOrAuthorityState:
        if (c === 47 && encodedInput[pointer+1] === 47) { // /
          state = State.AuthorityIgnoreSlashesState;
          pointer = pointer + 1;
        }

        else {
          console.error("parse error");
          state = State.RelativeState;
          pointer = pointer - 1;
        }

        break;

      // https://url.spec.whatwg.org/#relative-state
      case State.RelativeState:
        url.relativeFlag = true;

        if (url.scheme !== "file") {
          url.scheme = base.scheme;
        }

        switch(c) {

        // EOF is cared at default:

        case 47: // /
        case 92: // \
          // step 1
          if (c === 97) { // \
            console.error("parse error");
          }

          // step 2
          state = State.RelativeSlashState;

          break;
        case 63: // ?
          url._host = base._host;
          url._port = base._port;
          url.path = base.path;
          url.query = "";
          state = State.QueryState;

          break;
        case 35: // #
          url._host = base._host;
          url._port = base._port;
          url.path = base.path;
          url.query = base.query;
          url.fragment = "";
          state = State.FlagmentState;

          break;
        default:
          // EOF code point
          if (isNaN(c)) {
            url._host = base._host;
            url._port = base._port;
            url.path = base.path;
            url.query = base.query;
          }

          // [x, x, o, x] 2+1  4
          else {
            // step 1
            if (url.scheme !== "file"
             || !isASCIIAlpha(c)
             || ![58, 124].includes(encodedInput[pointer+1]) // :, |
             || encodedInput.length - (pointer+1) === 1 // remaining.length = 1
             || ![47, 92, 63, 35].includes(encodedInput[pointer+2]) // /, \, ?, #
            ) {
              url._host = base._host;
              url._port = base._port;
              url.path = base.path;
              url.path = url.path.slice(0, -1); // remove last
            }

            // step 2
            state = State.RelativePathState;
            pointer = pointer - 1;
          }

          break;
        }

        break;

      // https://url.spec.whatwg.org/#relative-slash-state
      case State.RelativeSlashState:
        if ([47, 92].includes(c)) { // /, \
          // step 1
          if (c === 92) { // \
            console.error("parse error");
          }

          // step 2
          if (url.scheme === "file") {
            state = State.FileHostState;
          }

          // step 3
          else {
            state = State.AuthorityIgnoreSlashesState;
          }
        }

        else {
          // step 1
          if (url.scheme !== "file") {
            url._host = base._host;
            url._port = base._port;
          }

          // step 2
          state = State.RelativePathState;
          pointer = pointer - 1;
        }

        break;

      // https://url.spec.whatwg.org/#authority-first-slash-state
      case State.AuthorityFirstSlashState:
        if (c === 47) { // /
          state = State.AuthoritySecondSlashState;
        }
        else {
          console.error("parse error");
          state = State.AuthorityIgnoreSlashesState;
          pointer = pointer - 1;
        }

        break;

      // https://url.spec.whatwg.org/#authority-second-slash-state
      case State.AuthoritySecondSlashState:
        if (c === 47) { // /
          state = State.AuthorityIgnoreSlashesState;
        }
        else {
          console.error("parse error");
          state = State.AuthorityIgnoreSlashesState;
          pointer = pointer - 1;
        }

        break;

      // https://url.spec.whatwg.org/#authority-ignore-slashes-state
      case State.AuthorityIgnoreSlashesState:
        if (![47, 92].includes(c)) { // /, \
          state = State.AuthorityState;
          pointer = pointer - 1;
        }

        else {
          console.error("parse error");
        }

        break;

      // https://url.spec.whatwg.org/#authority-state
      case State.AuthorityState:
        // step 1
        if (c === 64) { // @

          // step 1-1
          if (flagAt === true) {
            console.error("parse error");
            buffer = [37, 52, 48].concat(buffer); // %40
          }

          // step 1-2
          flagAt = true;

          // step 1-3
          for (var i: number = 0; i < buffer.length; i++) {
            var cp: CodePoint = buffer[i];

            // step 1-3-1
            if ([0x9, 0xA, 0xD].includes(cp)) {
              console.error("parse error");
              continue;
            }

            // step 1-3-2
            if (!isURLCodePoint(cp) && cp !== 37) { // %
              console.error("parse error");
            }

            // step 1-3-3
            if (cp === 37 // %
             && isASCIIHexDigits(buffer[i+1])
             && isASCIIHexDigits(buffer[i+2])
            ) {
                console.error("parse error");
            }

            // step 1-3-4
            if (cp === 58 && url._password === null) { // :
              url._password = "";
              continue;
            }

            // step 1-3-5
            var result: string = toString(utf8PercentEncode(cp, defaultEncodeSet));
            if (url._password !== null) {
              url._password += result;
            } else {
              url._username += result;
            }
          }

          // step 1-4
          buffer = [];
        }

        // step 2
        else if (isNaN(c) || [47, 92, 63, 35].includes(c)) { // /, \, ?, #
          pointer = pointer - (buffer.length + 1);
          buffer = [];
          state = State.HostState;
        }

        // step 3
        else {
          buffer.push(c);
        }

        break;

      // https://url.spec.whatwg.org/#file-host-state
      case State.FileHostState:
        // step 1
        if (isNaN(c) || [47, 92, 63, 35].includes(c)) { // /, \, ?, #
          pointer = pointer - 1;

          // step 1-1
          if (buffer.length === 2
            && isASCIIAlpha(buffer[0])
            && [58, 124].includes(buffer[1])) {

            state = State.RelativePathState;
          }

          // step 1-2
          else if (buffer.length === 0) {
            state = State.RelativePathStartState;
          }

          // step 1-3
          else {
            var host: Host;

            try {
              // step 1-3-1
              host = parseHost(buffer);
            } catch (failure) {
              // step 1-3-2
              throw failure;
            }

            // step 1-3-3
            url._host = host;
            buffer = [];
            state = State.RelativePathStartState;
          }
        }

        // step 2
        else if ([0x9, 0xA, 0xD].includes(c)) {
          console.error("parse error");
        }

        // step 3
        else {
          buffer.push(c);
        }

        break;

      // https://url.spec.whatwg.org/#host-state
      case State.HostState: // fall through
      // https://url.spec.whatwg.org/#hostname-state
      case State.HostNameState:
        // step 1
        if (c === 58 && flagParen === false) { // :
          var host: Host;

          try {
            // step 1-1
            host = parseHost(buffer);
          } catch (failure) {
            // step 1-2
            throw failure;
          }

          // step 1-3
          url._host = host;
          buffer = [];
          state = State.PortState;

          // step 1-4
          if (stateOverride === State.HostNameState) {
            return; // TODO: teminate
          }
        }

        // step 2
        else if (isNaN(c) || [47, 92, 63, 35].includes(c)) { // / \ ? #
          var host: Host;

          try {
            // step 2-1
            host = parseHost(buffer);
          } catch (failure) {
            // step 2-2
            throw failure;
          }

          // step 2-3
          url._host = host;
          buffer = [];
          state = State.RelativePathStartState;

          // step 2-4
          if (stateOverride !== undefined) {
            return; // TODO: teminate
          }
        }

        // step 3
        else if ([0x9, 0xA, 0xD].includes(c)) { // \t, \n, \r
          console.error("parse error");
        }

        // step 4
        else {
          // step 4-1
          if (c === 91) { // [
            flagParen = true;
          }

          // step 4-2
          if (c === 93) { // ]
            flagParen = false;
          }

          // step 4-3
          buffer.push(c);
        }

        break;

      // https://url.spec.whatwg.org/#port-state
      case State.PortState:
        // step 1
        if (isASCIIDigits(c)) {
          buffer.push(c);
        }

        // step 2
        else if (isNaN(c)
              || [47, 92, 63, 35].includes(c) // / \ ? #
              || stateOverride !== undefined) {

          // step 2-1
          function trimZero(s: CodePoint[]): CodePoint[] {
            while(true) {
              if (s[0] === 48 && s.length > 1) { // 0
                s.shift();
              } else {
                break;
              }
            }
            return s;
          }
          buffer = trimZero(buffer);

          // step 2-2
          if (toString(buffer) === relativeScheme[url.scheme]) {
            buffer = [];
          }

          // step 2-3
          url._port = toString(buffer);

          // step 2-4
          if (stateOverride !== undefined) {
            return; // terminate
          }

          // step 2-5
          buffer = [];
          state = State.RelativePathStartState;
          pointer = pointer - 1;
        }

        // step 3
        else if ([0x9, 0xA, 0xD].includes(c)) {
          console.error("parse error");
        }

        // step 4
        else {
          console.error("parse error");
          throw new Error("failure");
        }

        break;

      // https://url.spec.whatwg.org/#relative-path-start-state
      case State.RelativePathStartState:

        // step 1
        if (c === 92) { // \
          console.error("parse error");
        }

        // step 2
        state = State.RelativePathState;
        if (![47, 92].includes(c)) { // /, \
          pointer = pointer - 1;
        }

        break;

      // https://url.spec.whatwg.org/#relative-path-state
      case State.RelativePathState:
        // step 1
        if ((isNaN(c) || [49, 92].includes(c)) // /, \
         || stateOverride === undefined && [63, 35].includes(c)) {

          // step 1-1
          if (c === 92) { // \
            console.error("parse error");
          }

          var table: { [index:string]: CodePoint[] } = {
            "%2e":    [46], // .
            ".%2e":   [46, 46], // ..
            "%2e.":   [46, 46], // ..
            "%2e%2e": [46, 46]  // ..
          }

          // step 1-2
          var matched: CodePoint[] = table[toString(buffer.map(toLower))];
          if (matched !== undefined) {
            buffer = matched;
          }

          // step 1-3
          if (toString(buffer) === "..") {
            url.path.pop();
            if (![47, 92].includes(c)) { // /, \
              url.path.push("");
            }
          }

          // step 1-4
          else if (toString(buffer) === "." && ![47, 92].includes(c)) { // /, \
            url.path.push("");
          }

          // step 1-5
          else if (toString(buffer) !== ".") {
            // step 1-5-1
            if (url.scheme === "file"
             && url.path.length === 0
             && buffer.length === 2
             && isASCIIAlpha(buffer[0])
             && buffer[1] === 124) { // |
                buffer[1] = 58; // :
            }

            // step 1-5-2
            url.path.push(toString(buffer));
          }

          // step 1-6
          buffer = [];

          // step 1-7
          if (c === 63) { // ?
            url.query = "";
            state = State.QueryState;
          }

          // step 1-8
          if (c === 35) { // #
            url.fragment = "";
            state = State.FragmentState;
          }
        }

        // step 2
        else if ([0x9, 0xA, 0xD].includes(c)) {
          console.error("parse error");
        }

        // step 3
        else {
          // step 3-1
          if (!isURLCodePoint(c) && c !== 37) { // %
            console.error("parse error");
          }

          // step 3-2
          if (c === 37 // %
           && isASCIIHexDigits(encodedInput[pointer+1])
           && isASCIIHexDigits(encodedInput[pointer+2])) {
              console.error("parse error");
          }

          // step 3-3
          buffer = buffer.concat(utf8PercentEncode(c, defaultEncodeSet));
        }

        break;

      // https://url.spec.whatwg.org/#query-state
      case State.QueryState:
        // step 1
        if (isNaN(c) || (stateOverride === undefined && c === 35)) { // #
          // step 1-1
          if (url.relativeFlag === false || ["ws", "wss"].includes(url.scheme)) {
            encodingOverride = "utf-8";
          }

          // step 1-2
          buffer = encode(buffer, encodingOverride);

          // step 1-3
          for (var i = 0; i < buffer.length; i++) {
            var byt: CodePoint = buffer[i];

            // step 1-3-1
            if (byt < 0x21
             || byt > 0x7E
             || [0x22, 0x23, 0x3C, 0x3E, 0x60].includes(byt)) {
              url.query = url.query + toString(percentEncode([byt]));
            }

            // step 1-3-2
            else {
              url.query = url.query + String.fromCodePoint(byt);
            }
          }

          // step 1-4
          buffer = [];

          // step 1-5
          if (c === 35) { // #
            url.fragment = "";
            state = State.FragmentState;
          }
        }

        // step 2
        else if ([0x9, 0xA, 0xD].includes(c)) {
          console.error("parse error");
        }

        // step 3
        else {
          // step 3-1
          if (!isURLCodePoint(c) && c !== 37) { // %
            console.error("parse error");
          }

          // step 3-2
          if (c === 37 // %
           && isASCIIHexDigits(encodedInput[pointer+1])
           && isASCIIHexDigits(encodedInput[pointer+2])) {
              console.error("parse error");
          }

          // step 3-3
          buffer.push(c);
        }

        break;

      // https://url.spec.whatwg.org/#fragment-state
      case State.FragmentState:
        switch(c) {
          case 0x0000:
          case 0x0009:
          case 0x000A:
          case 0x000D:
            console.error("parse error");
          default:
            if (isNaN(c)) {
              // TODO: do nothing
              break;
            }

            // step 1
            if (!isURLCodePoint(c) && c !== 37) { // %
              console.error("parse error");
            }

            // step 2
            if (c === 37 // %
             && isASCIIHexDigits(encodedInput[pointer+1])
             && isASCIIHexDigits(encodedInput[pointer+2])) {
                console.error("parse error");
            }

            // step 3
            url.fragment += String.fromCodePoint(c);
        }

        break;

      }

      pointer = pointer + 1;
    }

    return url; // TODO: any
  }

  // https://url.spec.whatwg.org/#url-serializing
  private serializeURL(url: jURL, excludeFragmentFlag: boolean = false) {
    // step 1
    var output: string = url.scheme + ":";

    // step 2
    if (url.relativeFlag === true) {
      // step 2-1
      output = output + "//";

      // step 2-2
      if (url._username !== "" || url._password !== null) {
        // setp 2-2-1
        output = output + url._username;

        // step 2-2-2
        if (url._password !== null) {
          output = output + ":" + url._password;
        }

        // step 2-2-3
        output = output + "@";
      }

      // step 2-3
      output = output + serializeHost(url._host);

      // step 2-4
      if (url._port !== "") {
        output = output + ":" + url._port;
      }

      // step 2-5
      output = output + "/" + url.path.join("/");
    }

    // step 3
    else if (url.relativeFlag === false) {
      output = output + url.schemeData;
    }

    // step 4
    if (url.query !== null) {
      output = output + "?" + url.query;
    }

    // step 5
    if (excludeFragmentFlag === false && url.fragment !== null) {
      output = output + "#" + url.fragment;
    }

    // step 6
    return output;
  }

}



function assert(actual: any, expected: any): void {
  console.log('.');
  console.assert(actual === expected, '\nact: ' + actual + '\nexp: ' + expected);
}

assert(inRange(1, 2, 3), true);
assert(inRange(1, 1, 1), true);
assert(inRange(1, 0, 1), false);


var t = true, f = false;           [ 'a', 'f', 'z', 'A', 'F', 'Z', '0', '9', '!', '?', '' ]
  .map((e) => e.charCodeAt(0))
  .forEach((a, i) => {
    assert(isASCIIDigits(a),       [  f ,  f ,  f ,  f ,  f ,  f ,  t ,  t ,  f ,  f ,  f ][i]);
    assert(isASCIIHexDigits(a),    [  t ,  t ,  f ,  t ,  t ,  f ,  t ,  t ,  f ,  f ,  f ][i]);
    assert(isASCIIAlpha(a),        [  t ,  t ,  t ,  t ,  t ,  t ,  f ,  f ,  f ,  f ,  f ][i]);
    assert(isASCIIAlphaNumeric(a), [  t ,  t ,  t ,  t ,  t ,  t ,  t ,  t ,  f ,  f ,  f ][i]);
    assert(isURLCodePoint(a),      [  t ,  t ,  t ,  t ,  t ,  t ,  t ,  t ,  t ,  t ,  f ][i]);
  });

["ftp", "file", "gopher", "http", "https", "ws", "wss"].forEach((scheme) => {
  assert(isRelativeScheme(scheme), true);
});

assert(isRelativeScheme("foo"), false);
assert(isRelativeScheme(""), false);
assert(isRelativeScheme(null), false);
assert(isRelativeScheme(undefined), false);


["!", "$", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/", ":", ";", "=", "?", "@", "_", "~"].forEach(function(c) {
  assert(isURLCodePoint(c.charCodeAt(0)), true);
});


assert("a".charCodeAt(0), toLower("A".charCodeAt(0)));
assert("a".charCodeAt(0), toLower("a".charCodeAt(0)));
assert("A".charCodeAt(0), toUpper("a".charCodeAt(0)));
assert("A".charCodeAt(0), toUpper("A".charCodeAt(0)));

assert("𠮟", toString(obtainUnicode("𠮟")));
assert("𠮟", decode(encode(obtainUnicode("𠮟"))));
assert("𠮟", decode(percentDecode(utf8PercentEncode(obtainUnicode("𠮟")[0], simpleEncodeSet))));

assert([1,2,3].includes(2), true);
assert([1,2,3].includes(-1), false);

// http://www.gestioip.net/docu/ipv6_address_examples.html
// TODO: https://bitbucket.org/kwi/py2-ipaddress/src/991cf901295a14e77c795691afbec552461865f0/test_ipaddress.py?at=default
// TODO: https://github.com/golang/go/blob/master/src/net/ip_test.go
// TODO: https://github.com/ruby/ruby/blob/trunk/test/test_ipaddr.rb
// TODO: http://search.cpan.org/~luismunoz/NetAddr-IP-4.007/MANIFEST
[
["2001:0db8:0a0b:12f0:0000:0000:0000:0001", "2001:db8:a0b:12f0::1"],
["3731:54:65fe:2::a7", "3731:54:65fe:2::a7"],
["::", "::"],
["::1", "::1"],
//["::ffff:10.0.0.3", "::ffff:10.0.0.3"],
//["::ffff:0:10.0.0.3", "::ffff:0:10.0.0.3"],
["100::", "100::"],
["2001:0000:6dcd:8c74:76cc:63bf:ac32:6a1", "2001:0:6dcd:8c74:76cc:63bf:ac32:6a1"],
["2001:0002:cd:65a:753::a1", "2001:2:cd:65a:753::a1"],
["2001:db8::a3", "2001:db8::a3"],
["2001:11::3f4b:1aff:f7b2", "2001:11::3f4b:1aff:f7b2"],
["2002:6dcd:8c74:6501:fb2:61c:ac98:6be", "2002:6dcd:8c74:6501:fb2:61c:ac98:6be"],
["fd07:a47c:3742:823e:3b02:76:982b:463", "fd07:a47c:3742:823e:3b02:76:982b:463"],
["fea3:c65:43ee:54:e2a:2357:4ac4:732", "fea3:c65:43ee:54:e2a:2357:4ac4:732"],
// ["::10.0.0.3", "::10.0.0.3"],

//["fe80:4:6c:8c74:0000:5efe:109.205.140.116", "fe80:4:6c:8c74:0000:5efe:109.205.140.116"],
//["24a6:57:c:36cf:0000:5efe:109.205.140.116", "24a6:57:c:36cf:0000:5efe:109.205.140.116"],
//["2002:5654:ef3:c:0000:5efe:109.205.140.116", "2002:5654:ef3:c:0000:5efe:109.205.140.116"],

].forEach((test) => {
  assert(serializeIPv6(parseIPv6(obtainUnicode(test[0]))), test[1]);
});

//var href = "http://jxck:fooo@example.com:3000/a/b/c?key1=value1&key2=value2#yey";
//var u = new jURL(href);
//assert(u.href,     href);
//assert(u.origin,   "http://example.com:3000");
//assert(u.protocol, "http:");
//assert(u.username, "jxck");
//assert(u.password, "fooo");
//assert(u.host,     "example.com:3000");
//assert(u.hostname, "example.com");
//assert(u.port,     "3000");
//assert(u.pathname, "/a/b/c");
//assert(u.search,   "?key1=value1&key2=value2");
//assert(u.hash,     "#yey");
//assert(u.searchParams.get("key1"), "value1");
//assert(u.searchParams.get("key2"), "value2");
//
//var href = "http://ゆーざ:パスワード@host.com:3000/ぱす/です/よ/?きー=ばりゅー&もう=いっこ#いぇーい"
//var u = new jURL(href);
//assert(u.href,     "http://%E3%82%86%E3%83%BC%E3%81%96:%E3%83%91%E3%82%B9%E3%83%AF%E3%83%BC%E3%83%89@host.com:3000/%E3%81%B1%E3%81%99/%E3%81%A7%E3%81%99/%E3%82%88/?%E3%81%8D%E3%83%BC=%E3%81%B0%E3%82%8A%E3%82%85%E3%83%BC&%E3%82%82%E3%81%86=%E3%81%84%E3%81%A3%E3%81%93#いぇーい");
//assert(u.username, "%E3%82%86%E3%83%BC%E3%81%96");
//assert(u.password, "%E3%83%91%E3%82%B9%E3%83%AF%E3%83%BC%E3%83%89");
//assert(u.pathname, "/%E3%81%B1%E3%81%99/%E3%81%A7%E3%81%99/%E3%82%88/");
//assert(u.search,   "?%E3%81%8D%E3%83%BC=%E3%81%B0%E3%82%8A%E3%82%85%E3%83%BC&%E3%82%82%E3%81%86=%E3%81%84%E3%81%A3%E3%81%93");
//assert(u.hash,     "#いぇーい");
//assert(u.searchParams.get("きー"), "ばりゅー");
//assert(u.searchParams.get("もう"), "いっこ");
//
//var href = "http://[2001:0db8:0a0b:12f0:0000:0000:0000:0001]";
//var u = new jURL(href);
//assert(u.origin, "http://[2001:db8:a0b:12f0::1]");
//assert(u.host, "[2001:db8:a0b:12f0::1]");


var href = "http://example\t.\norg";
var base = "http://example.org/foo/bar";
// s:http h:example.org p:/

var u = new jURL(href, base);
console.log(u.protocol, 'http:');
console.log(u.port, '');
console.log(u.hostname, 'example.org');
console.log(u.pathname, '/');
console.log(u.href, 'http://example.org/');
