/// <reference path="types/webidl.d.ts" />
/// <reference path="types/obtain-unicode.d.ts" />
/// <reference path="types/utf8-encoding.d.ts" />
/// <reference path="types/urlsearchparams.d.ts" />

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

// import only type info
import usp = require('urlsearchparams');

var URLSearchParams: typeof usp.URLSearchParams;
if (typeof window === 'undefined') { // in node.js
  URLSearchParams = require('urlsearchparams').URLSearchParams;
}

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

// TODO:
function encode(input: CodePoint[], encodingOverride: string = "utf-8"): CodePoint[] {
  if (encodingOverride !== "utf-8") {
    throw new Error("support utf-8 only");
  }

  var encoded: Uint8Array = new TextEncoder("utf-8").encode(toString(input));
  return Array.prototype.slice.call(encoded);
}

function decode(input: CodePoint[]): string {
  return new TextDecoder().decode(new Uint8Array(input));
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

function domainToUnicode(input: string): string {
 // TODO: imple
  return input;
}

function domainToASCII(input: string): string {
 // TODO: imple
  return input;
}

function parseIPv6(input: CodePoint[]): string {
  // TODO: imple
  return toString(input);
}

// https://url.spec.whatwg.org/#concept-host-parser
function parseHost(input: CodePoint[], unicodeFlag?: boolean): string {
  // step 1
  if (input.length === 0) {
    return "failure";
  }

  // step 2
  if (input[0] === 91) {
    // step 2-1
    if (input[input.length-1] !== 93) {
      // TODO: parse error
      return "failure";
    }

    // step 2-2
    return parseIPv6(input.slice(1, -1));
  }

  // step 3
  var domain: string = decode(percentDecode(encode(input)));

  // step 4
  var asciiDomain: string = domainToASCII(domain);

  // step 5
  if (asciiDomain === "failure") {
    return "failure";
  }

  // step 6
  if ([ "\u0000", "\t", "\n", "\r", " ", "#", "%", "/", ":", "?", "@", "[", "\\", "]" ].some((s) => {
    return asciiDomain.indexOf(s) !== -1;
  })) {
    return "failure";
  }

  // step 7
  if (unicodeFlag) { // TODO: sent a bug to clearify default flag, so follow to update spec.
    return asciiDomain;
  } else {
    return domainToUnicode(asciiDomain);
  }
}

/**
 * Encode Set
 */
type EncodeSet = (p: CodePoint) => boolean;

// https://url.spec.whatwg.org/#simple-encode-set
function simpleEncodeSet(codePoint: CodePoint): boolean {
  // all code points less than U+0020 (i.e. excluding U+0020) and all code points greater than U+007E.
  return codePoint < 0x20 && 0x007 < codePoint;
}

// https://url.spec.whatwg.org/#default-encode-set
function defaultEncodeSet(codePoint: CodePoint): boolean {
  // simple encode set and code points U+0020, '"', "#", "<", ">", "?", and "`".
  return simpleEncodeSet(codePoint) || ([0x20, 34, 35, 60, 62, 63, 96].indexOf(codePoint) !== -1);
}

// https://url.spec.whatwg.org/#username-encode-set
function passwordEncodeSet(codePoint: CodePoint): boolean {
  // default encode set and code points "/", "@", and "\".
  return defaultEncodeSet(codePoint) || ([0x47, 0x64, 0x92].indexOf(codePoint) !== -1);
}

// https://url.spec.whatwg.org/#username-encode-set
function usernameEncodeSet(codePoint: CodePoint): boolean {
  // password encode set and code point ":".
  return passwordEncodeSet(codePoint) || codePoint === 58;
}

// https://url.spec.whatwg.org/#utf_8-percent-encode
function utf8PercentEncode(codePoint: CodePoint, encodeSet: EncodeSet): CodePoint[] {
  // step 1
  if (encodeSet(codePoint)) {
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
  return inRange(0x41, codePoint, 0x46) || inRange(0x61, codePoint, 0x66);
}

// https://url.spec.whatwg.org/#ascii-alpha
function isASCIIAlpha(codePoint: CodePoint): boolean {
  return inRange(0x41, codePoint, 0x5A) || inRange(0x61, codePoint, 0x7A);
}

// https://url.spec.whatwg.org/#ascii-alphanumeric
function isASCIIAlphaNumeric(codePoint: CodePoint): boolean {
  return isASCIIDigits(codePoint) || isASCIIAlpha(codePoint);
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
  return Object.keys(relativeScheme).indexOf(scheme) !== -1;
}

// https://url.spec.whatwg.org/#url-code-points
function isURLCodePoint(codePoint: CodePoint): boolean {
  if (isASCIIAlphaNumeric(codePoint)) {
    return true;
  }

  // ["!", "$", "&", "'", "(", ")", "*", "+", ",", "-",
  //  ".", "/", ":", ";", "=", "?", "@", "_", "~"]
  var signs: CodePoint[] = [ 33, 36, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 58, 59, 61, 63, 64, 95, 126 ];
  if (signs.indexOf(codePoint) !== -1) {
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
interface URLUtils {
  hash:         USVString; // stringifier

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
}

//[Constructor(USVString url, optional USVString base = "about:blank"), Exposed=(Window,Worker)]
//interface URL {
//  static USVString domainToASCII(USVString domain);
//  static USVString domainToUnicode(USVString domain);
//};

//URL implements URLUtils;
interface IURL extends URLUtils {
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

// CAUTION: URL already in lib.d.ts
class jURL implements IURL {

  // https://url.spec.whatwg.org/#concept-urlutils-input
  private input:       string;

  // https://url.spec.whatwg.org/#concept-urlutils-query-encoding
  private encoding:    string ; // support utf-8 only

  // https://url.spec.whatwg.org/#concept-urlutils-query-object
  private queryObject: typeof URLSearchParams = null;

  // https://url.spec.whatwg.org/#concept-urlutils-url
  private url:         jURL = null;

  private _hash:       USVString;
  private _origin:     USVString;

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

  // TODO: このへんあとで



  protocol:     USVString;

  // https://url.spec.whatwg.org/#concept-url-username
  username:     USVString = "";

  // https://url.spec.whatwg.org/#concept-url-password
  password:     USVString = null;

  // https://url.spec.whatwg.org/#concept-url-host
  host:         USVString = null;

  hostname:     USVString;
  port:         USVString;
  pathname:     USVString;
  search:       USVString;
  searchParams: typeof URLSearchParams;

  get hash(): USVString {
    return this._hash;
  }

  get origin(): USVString {
    return this._origin;
  }

  static domainToASCII(domain: string):   string {
    // TODO: implement me
    return "";
  }

  static domainToUnicode(domain: string): string {
    // TODO: implement me
    return "";
  }

  // https://url.spec.whatwg.org/#constructors
  constructor(url:USVString, base:USVString = "about:blank") {
    // step 1
    var parsedBase = this.basicURLParser(base);

    // step 2
    if (parsedBase === "failure") {
      throw new TypeError("invalid url");
    }

    // step 3
    var parsedURL = this.basicURLParser(url, parsedBase);

    // step 4
    if (parsedURL === "failure") {
      throw new TypeError("invalid url");
    }

    console.log(parsedURL);
  }

  // https://url.spec.whatwg.org/#concept-basic-url-parser
  private basicURLParser(input: string, base?: jURL, encodingOverride?: string, url?: jURL, stateOverride?: State): any {
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
    while (pointer < encodedInput.length) {
      var c: CodePoint = encodedInput[pointer];

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
          // TODO: parse error;
          return; // TODO: terminate
        }

        break;

      // https://url.spec.whatwg.org/#scheme-state
      case State.SchemeState:
        // step 1
        if (isASCIIAlphaNumeric(c) || [43, 45, 46].indexOf(c) !== -1) { // +, -, .
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
          // TODO: parse error
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
          if (isNaN(c) && !isURLCodePoint(c) && c !== 37) { // %
            // TODO: parse error
          }

          // step 3-2
          if (c === 37 // %
           && isASCIIHexDigits(encodedInput[pointer+1])
           && isASCIIHexDigits(encodedInput[pointer+2])) {
              // TODO: parse error
          }

          // step 3-3
          if (!isNaN(c) && [0x9, 0xA, 0xD].indexOf(c) === -1) {
            url.schemeData += toString(utf8PercentEncode(c, simpleEncodeSet));
          }
        }

        break;

      // https://url.spec.whatwg.org/#no-scheme-state
      case State.NoSchemeState:
        if (base === null || !isRelativeScheme(base.scheme)) {
          // TODO: parse error
          return "failure";
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
          // TODO: parse error
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
        case 47: // /
        case 92: // \
          // step 1
          if (c === 97) { // \
            // TODO: parse error
          }

          // step 2
          state = State.RelativeSlashState;

          break;
        case 63: // ?
          url.host = base.host;
          url.port = base.port;
          url.path = base.path;
          url.query = "";
          state = State.QueryState;

          break;
        case 35: // #
          url.host = base.host;
          url.port = base.port;
          url.path = base.path;
          url.query = base.query;
          url.fragment = "";
          state = State.FlagmentState;

          break;
        default:
          // EOF code point
          if (isNaN(c)) {
            url.host = base.host;
            url.port = base.port;
            url.path = base.path;
            url.query = base.query;
          }

          // [x, x, o, x] 2+1  4
          else {
            // step 1
            if (url.scheme !== "file"
             || !isASCIIAlpha(c)
             || [58, 124].indexOf(encodedInput[pointer+1]) === -1 // :, |
             || encodedInput.length - (pointer+1) === 1 // remaining.length = 1
             || [47, 92, 63, 35].indexOf(encodedInput[pointer+2]) === -1 // /, \, ?, #
            ) {
              url.host = base.host;
              url.port = base.port;
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
        if ([47, 92].indexOf(c) !== -1) { // /, \
          // step 1
          if (c === 92) { // \
            // TODO: parse error
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
            url.host = base.host;
            url.port = base.port;
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
          // TODO: parse error
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
          // TODO: parse error
          state = State.AuthorityIgnoreSlashesState;
          pointer = pointer - 1;
        }

        break;

      // https://url.spec.whatwg.org/#authority-ignore-slashes-state
      case State.AuthorityIgnoreSlashesState:
        if ([47, 92].indexOf(c) === -1) { // /, \
          state = State.AuthorityState;
          pointer = pointer - 1;
        }

        else {
          // TODO: parse error
        }

        break;

      // https://url.spec.whatwg.org/#authority-state
      case State.AuthorityState:
        // step 1
        if (c === 64) { // @

          // step 1-1
          if (flagAt === true) {
            // TODO: parse error
            buffer = [37, 52, 48].concat(buffer); // %40
          }

          // step 1-2
          flagAt = true;

          // step 1-3
          for (var i: number = 0; i < buffer.length; i++) {
            var cp: CodePoint = buffer[i];

            // step 1-3-1
            if ([0x9, 0xA, 0xD].indexOf(cp) === 0) {
              // TODO: parse error
              continue;
            }

            // step 1-3-2
            if (!isURLCodePoint(cp) && cp !== 37) {
              // TODO: parse error
            }

            // step 1-3-3
            if (cp === 37 // %
             && isASCIIHexDigits(buffer[i+1])
             && isASCIIHexDigits(buffer[i+2])
            ) {
                // TODO: parse error
            }

            // step 1-3-4
            if (cp === 58 && url.password === null) { // :
              url.password = "";
              continue;
            }

            // step 1-3-5
            var result: string = toString(utf8PercentEncode(cp, defaultEncodeSet));
            if (url.password !== null) {
              url.password += result;
            } else {
              url.username += result;
            }
          }

          // step 1-4
          buffer = [];
        }

        // step 2
        else if (isNaN(c) || [47, 92, 63, 35].indexOf(c) !== -1) { // /, \, ?, #
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
        if (isNaN(c) || [47, 92, 63, 35].indexOf(c) !== -1) { // /, \, ?, #
          pointer = pointer - 1;

          // step 1-1
          if (buffer.length === 2
            && isASCIIAlpha(buffer[0])
            && [58, 124].indexOf(buffer[1])) {

            state = State.RelativePathState;
          }

          // step 1-2
          else if (buffer.length === 0) {
            state = State.RelativePathStartState;
          }

          // step 1-3
          else {
            // step 1-3-1
            var host: string = parseHost(buffer);

            // step 1-3-2
            if (host === "failure") {
              return "failure";
            }

            // step 1-3-3
            url.host = host;
            buffer = [];
            state = State.RelativePathStartState;
          }
        }

        // step 2
        else if ([0x9, 0xA, 0xD].indexOf(c)) {
          // TODO parse error
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
        if (c === 58 && flagParen === false) {
          // step 1-1
          var host: string = parseHost(buffer);

          // step 1-2
          if (host === "failure") {
            return "failure";
          }

          // step 1-3
          url.host = host;
          buffer = [];
          state = State.PortState;

          // step 1-4
          if (stateOverride === State.HostNameState) {
            return; // TODO: teminate
          }
        }

        // step 2
        else if (isNaN(c) || [47, 92, 63, 35].indexOf(c) !== -1) { // / \ ? #
          // step 2-1
          var host: string = parseHost(buffer);

          // step 2-2
          if (host === "failure") {
            return "failure";
          }

          // step 2-3
          url.host = host;
          buffer = [];
          state = State.RelativePathStartState;

          // step 2-4
          if (stateOverride !== undefined) {
            return; // TODO: teminate
          }
        }

        // step 3
        else if ([0x9, 0xA, 0xD].indexOf(c) !== -1) {
          // TODO: parse error
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
              || [47, 92, 63, 35].indexOf(c) !== -1 // / \ ? #
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
          url.port = toString(buffer);

          // step 2-4
          if (stateOverride !== undefined) {
            return; // terminate
          }
        }

        // step 3
        else if ([0x9, 0xA, 0xD].indexOf(c) !== -1) {
          // TODO: parse error
        }

        // step 4
        else {
          // TODO: parse error
          return "failure";
        }

        break;

      // https://url.spec.whatwg.org/#relative-path-start-state
      case State.RelativePathStartState:

        // step 1
        if (c === 92) {
          // TODO: parse error
        }

        // step 2
        state = State.RelativePathState;
        if ([47, 92].indexOf(c) === -1) { // /, \
          pointer = pointer - 1;
        }

        break;

      // https://url.spec.whatwg.org/#relative-path-state
      case State.RelativePathState:
        // step 1
        if ((isNaN(c) || [49, 92].indexOf(c) !== -1)
         || stateOverride === undefined && [63, 35].indexOf(c) !== -1) {

          // step 1-1
          if (c === 92) {
            // TODO: parse error
          }

          var table: { [index:string]: CodePoint[] } = {
            "%2e":    [46],
            ".%2e":   [46, 46],
            "%2e.":   [46, 46],
            "%2e%2e": [46, 46]
          }

          // step 1-2
          var matched: CodePoint[] = table[toString(buffer.map(toLower))];
          if (matched !== undefined) {
            buffer = matched;
          }

          // step 1-3
          if (toString(buffer) === "..") {
            url.path.pop();
            if ([47, 92].indexOf(c) === -1) { // /, \
              url.path.push("");
            }
          }

          // step 1-4
          else if (toString(buffer) === "." && [47, 92].indexOf(c) === -1) {
            url.path.push("");
          }

          // step 1-5
          else if (toString(buffer) === ".") {
            // step 1-5-1
            if (url.scheme === "file"
             && url.path.length === 0
             && buffer.length === 2
             && isASCIIAlpha(buffer[0])
             && buffer[1] === 124) { // |
              buffer[1] = 58;
            }

            // step 1-5-2
            url.path.push(toString(buffer));
          }

          // step 1-6
          buffer = [];

          // step 1-7
          if (c === 63) {
            url.query = "";
            state = State.QueryState;
          }

          // step 1-8
          if (c === 35) {
            url.fragment = "";
            state = State.FragmentState;
          }
        }

        // step 2
        else if ([0x9, 0xA, 0xD].indexOf(c) !== -1) {
          // TODO:  parse error
        }

        // step 3
        else {
          // step 3-1
          if (!isURLCodePoint(c) && c !== 37) {
            // TODO: parse error
          }

          // step 3-2
          if (c === 37 // %
           && isASCIIHexDigits(encodedInput[pointer+1])
           && isASCIIHexDigits(encodedInput[pointer+2])) {
              // TODO: parse error
          }

          // step 3-3
          buffer = buffer.concat(utf8PercentEncode(c, defaultEncodeSet));
        }

        break;

      // https://url.spec.whatwg.org/#query-state
      case State.QueryState:
        // step 1
        if (isNaN(c) || (stateOverride === undefined && c === 35)) {
          // step 1-1
          if (url.relativeFlag === false || ["ws", "wss"].indexOf(url.scheme) === -1) {
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
             || [0x22, 0x23, 0x3C, 0x3E, 0x60].indexOf(byt) !== -1) {
              url.query = toString(percentEncode([byt]));
            }

            // step 1-3-2
            else {
              url.query = String.fromCodePoint(byt);
            }
          }

          // step 1-4
          buffer = [];

          // step 1-5
          if (c === 35) {
            url.fragment = "";
            state = State.FragmentState;
          }
        }

        // step 2
        else if ([0x9, 0xA, 0xD].indexOf(c) !== -1) {
          // TODO: parse error
        }

        // step 3
        else {
          // step 3-1
          if (!isURLCodePoint(c) && c !== 37) {
            // TODO: parse error
          }

          // step 3-2
          if (c === 37 // %
           && isASCIIHexDigits(encodedInput[pointer+1])
           && isASCIIHexDigits(encodedInput[pointer+2])) {
              // TODO: parse error
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
            // TODO: parse error
          default:
            if (isNaN(c)) {
              // TODO: do nothing
              break;
            }

            // step 1
            if (!isURLCodePoint(c) && c !== 37) { // %
              // TODO: parse error
            }

            // step 2
            if (c === 37 // %
             && isASCIIHexDigits(encodedInput[pointer+1])
             && isASCIIHexDigits(encodedInput[pointer+2])) {
                // TODO: parse error
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
    assert(isASCIIHexDigits(a),    [  t ,  t ,  f ,  t ,  t ,  f ,  f ,  f ,  f ,  f ,  f ][i]);
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

new jURL('http://example.com');
