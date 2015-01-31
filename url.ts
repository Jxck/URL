/// <reference path="types/webidl.d.ts" />
/// <reference path="types/urlsearchparams.d.ts" />

// for dynamic require
declare var require: any;

// import only type info
import usp = require('urlsearchparams');

var URLSearchParams: typeof usp.URLSearchParams;
if (typeof window === 'undefined') { // in node.js
  URLSearchParams = require('urlsearchparams').URLSearchParams;
}

function inRange(from, tar, to: number): boolean {
  return (from <= tar && tar <= to);
}

// https://url.spec.whatwg.org/#ascii-digits
function isASCIIDigits(codePoint: number): boolean {
  return inRange(0x30, codePoint, 0x39);
}

// https://url.spec.whatwg.org/#ascii-hex-digits
function isASCIIHexDigits(codePoint: number): boolean {
  return inRange(0x41, codePoint, 0x46) || inRange(0x61, codePoint, 0x66);
}

// https://url.spec.whatwg.org/#ascii-alpha
function isASCIIAlpha(codePoint: number): boolean {
  return inRange(0x41, codePoint, 0x5A) || inRange(0x61, codePoint, 0x7A);
}

// https://url.spec.whatwg.org/#ascii-alphanumeric
function isASCIIAlphaNumeric(codePoint: number): boolean {
  return isASCIIDigits(codePoint) || isASCIIAlpha(codePoint);
}

// https://url.spec.whatwg.org/#relative-scheme
var relativeScheme = {
  "ftp"    : "21",
  "file"   : "",
  "gopher" : "70",
  "http"   : "80",
  "https"  : "443",
  "ws"     : "80",
  "wss"    : "443"
}

function isRelativeScheme(scheme: string): boolean {
  return Object.keys(relativeScheme).indexOf(scheme) !== -1;
}

// https://url.spec.whatwg.org/#url-code-points
function isURLCodePoint(codePoint: number): boolean {
  if (isASCIIAlphaNumeric(codePoint)) {
    return true;
  }

  // ["!", "$", "&", "'", "(", ")", "*", "+", ",", "-",
  //  ".", "/", ":", ";", "=", "?", "@", "_", "~"]
  var signs = [ 33, 36, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 58, 59, 61, 63, 64, 95, 126 ];
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
  private shcemeData:  string = "";

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
  }

  // TODO: using enum in state
  private basicURLParser(input: string, base?: jURL, encodingOverride?: string, url?: jURL, stateOverride?: string) {
    // step 1
    if (url === undefined) {
      // step 1-1
      url = this; // new URL

      // step 1-2
      input = input.trim();
    }

    // step 2
    var state = stateOverride || "schemeStartState";

    // step 3
    base = base || null;

    // step4
    encodingOverride = encodingOverride || null;

    // step 5
    var buffer = "";

    // step 6
    var flagAt = false; // @flag
    var flagParen = false; // []flag

    // step 7
    var pointer = 0;

    var c = input.charCodeAt(pointer);

    // step 8
    switch(state) {

    // https://url.spec.whatwg.org/#scheme-start-state
    case "schemeStartState":
      // step 8-1
      if (isASCIIAlpha(c)) {
        buffer += String.fromCharCode(c).toLowerCase();
        state = "schemeState";
      }

      // step 8-2
      else if (stateOverride === undefined) {
        state = "noSchemeState";
        pointer = pointer - 1;
      }

      // step 8-3
      else {
        return 'parse error';
      }

      break;

    // https://url.spec.whatwg.org/#scheme-state
    case "schemeState":
      // step 9-1
      if (isASCIIAlphaNumeric(c) || [43, 45, 46].indexOf(c) !== -1) { // +, -, .
        buffer += String.fromCharCode(c).toLowerCase();
      }

      // step 9-2
      else if (c === 58) { // :
        url.scheme = buffer;
        buffer = "";

        // step 9-2-1
        if (stateOverride !== undefined) {
          return; // TODO: terminate
        }

        // step 9-2-2
        if (isRelativeScheme(url.scheme)) {
          url.relativeFlag = true;
        }

        // step 9-2-3
        if (url.scheme === "file") {
          state = "relativeState";
        }

        // step 9-2-4
        else if (url.relativeFlag === true
                 && base !== null
                 && base.scheme === url.scheme) {
          state = "relativeOrAuthority";

        }

        // step 9-2-5
        else if (url.relativeFlag === true) {
          state = "authorityFirstSlashState";
        }

        // step 9-2-6
        else {
          state = "schemeDataState";
        }
      }

      // step 9-3
      else if (stateOverride === undefined) {
        buffer = "";
        state = "noSchemeState";

        // TODO: return to First

      }

      // step 9-4
      else if (isNaN(c)) {
        return; // TODO: terminate
      }

      // step 9-5
      else {
        // TODO: parse error
        return; // TODO: terminate
      }

      break;

    // https://url.spec.whatwg.org/#scheme-data-state
    case "schemeDataState":
      // step 1
      if (c === 63) { // ?
        url.query = "";
        state = "queryState";
      }

      // step 2
      else if (c === 35) { // #
        url.fragment = "";
        state = "flagmentState";
      }

      // step 3
      else {
        // step 3-1
        if (isNaN(c) && !isURLCodePoint(c) && c !== 37) { // %
          // TODO: parse error
          return "parse error";
        }

        // step 3-2
        if (c === 37) { // %
          var c0 = input.charCodeAt(pointer+1);
          if (isASCIIHexDigits(c0)) {
            // TODO: parse error
            return "parse error";
          }
          var c1 = input.charCodeAt(pointer+2);
          if (isASCIIHexDigits(c1)) {
            // TODO: parse error
            return "parse error";
          }
        }

        // step 3-3
        if (c !== NaN && [0x9, 0xA, 0xD].indexOf(c) === -1) {
          // TODO: implement
        }
      }

      break;

    // https://url.spec.whatwg.org/#no-scheme-state
    case "noSchemeState":
      if (base === null || !isRelativeScheme(base.scheme)) {
        // TODO: parse error
        return "failure";
      }

      else {
        state = "relativeState";
        pointer = pointer - 1;
      }

      break;

    // https://url.spec.whatwg.org/#relative-or-authority-state
    case "relativeOrAuthorityState":
      if (c === 47 && input.charCodeAt(pointer+1) === 47) { // /
        state = "authorityIgnoreSlashesState";
        pointer = pointer + 1;
      }

      else {
        // TODO: parse error
        state = "relativeState";
        pointer = pointer - 1;
      }

      break;

    // https://url.spec.whatwg.org/#relative-state
    case "relativeState":
      url.relativeFlag = true;
      url.scheme = base.scheme;

      if (url.scheme !== "file") {
        switch(c) {
        case 47: // /
        case 92: // \
          // step 1
          if (c === 97) {
            // TODO: parse error
          }

          // step 2
          state = "relativeSlashState";

          break;
        case 63: // ?
          url.host = base.host;
          url.port = base.port;
          url.path = base.path;
          url.query = "";
          state = "queryState";

          break;
        case 35: // #
          url.host = base.host;
          url.port = base.port;
          url.path = base.path;
          url.query = base.query;
          url.fragment = "";
          state = "flagmentState";

          break;
        default:
          if (isNaN(c)) { // EOF
            url.host = base.host;
            url.port = base.port;
            url.path = base.path;
            url.query = base.query;
          }

          else {
            // step 1
            if (url.scheme !== "file"
            || !isASCIIAlpha(c)
            || [58, 124].indexOf(input.charCodeAt(pointer+1)) !== -1 // *, |
            || isNaN(input.charCodeAt(pointer+2)) // remaining.length = 1
            || [47, 92, 63, 35].indexOf(input.charCodeAt(pointer+2)) !== -1 // /, \, ?, #
            ) {
              url.host = base.host;
              url.port = base.port;
              url.path = base.path;
              url.path = url.path.slice(0, -1); // remove last
            }

            // step 2
            state = "relativePathState";
            pointer = pointer - 1;
          }

          break;
        }
      }

      break;

    // https://url.spec.whatwg.org/#relative-slash-state
    case "relativeSlashState":
      if ([47, 92].indexOf(c) !== -1) { // /, \
        // step 1
        if (c === 92) { // \
          // TODO
          return "parse error";
        }

        // step 2
        if (url.scheme === "file") {
          state = "fileHostState";
        }

        // step 3
        else {
          state = "authorityIgnoreSlashesState";
        }
      }

      else {
        // step 1
        if (url.scheme !== "file") {
          url.host = base.host;
          url.port = base.port;
        }

        // step 2
        state = "relativePathState";
        pointer = pointer - 1;
      }

      break;

    // https://url.spec.whatwg.org/#authority-first-slash-state
    case "authorityFirstSlashState":
      if (c === 47) { // /
        state = "authoritySecondState";
      }
      else {
        // TODO: parse error
        state = "authorityIgnoreSlashesState";
        pointer = pointer - 1;
      }

      break;

    // https://url.spec.whatwg.org/#authority-second-slash-state
    case "authoritySecondSlashState":
      if (c === 47) { // /
        state = "authorityIgnoreSlashesState";
      }
      else {
        // TODO: parse error
        state = "authorityIgnoreSlashesState";
        pointer = pointer - 1;
      }

      break;

    // https://url.spec.whatwg.org/#authority-ignore-slashes-state
    case "authorityIgnoreSlashesState":
      if ([47, 92].indexOf(c) !== -1) { // /, \
        state = "authorityState";
        pointer = pointer - 1;
      }

      else {
        // TODO: parse error
      }

      break;

    // https://url.spec.whatwg.org/#authority-state
    case "authorityState":
      // step 1
      if (c === 64) { // @

        // step 1-1
        if (flagAt === true) {
          // TODO: parse error
          buffer = "%40" + buffer;
        }

        // step 1-2
        flagAt = true;

        // step 1-3

        // TODO: あとで

      }

      // step 2
      else if (isNaN(c) || [47, 92, 63, 35]) { // /, \, ?, #
        // TODO: あとで
      }

      // step 3
      else {
        // TODO: あとで
      }

      break;

    // https://url.spec.whatwg.org/#file-host-state
    case "fileHostState":
      // step 1
      if (isNaN(c) || [47, 92, 63, 35]) { // /, \, ?, #
        pointer = pointer - 1;

        // step 1-1
      }

      break;

    // https://url.spec.whatwg.org/#host-state
    case "hostState":

      break;

    // https://url.spec.whatwg.org/#hostname-state
    case "hostnameState":

      break;

    // https://url.spec.whatwg.org/#port-state
    case "portState":

      break;

    // https://url.spec.whatwg.org/#relative-path-start-state
    case "relativePathStartState":

      break;

    // https://url.spec.whatwg.org/#relative-path-state
    case "relativePathState":

      break;

    // https://url.spec.whatwg.org/#query-state
    case "queryState":

      break;

    // https://url.spec.whatwg.org/#fragment-state
    case "fragmentState":

      break;

    }
  }
}


function assert(actual, expected) {
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
  });

["ftp", "file", "gopher", "http", "https", "ws", "wss"].forEach((scheme) => {
  assert(isRelativeScheme(scheme), true);
});

assert(isRelativeScheme("foo"), false);
assert(isRelativeScheme(""), false);
assert(isRelativeScheme(null), false);
assert(isRelativeScheme(undefined), false);
