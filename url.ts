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
  return Object.keys(relativeScheme).indexOf(scheme) > -1;
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
    var flagAt = false;
    var flagParen = false;

    // step 7
    var pointer = 0;

    // step 8
    switch(state) {
    case "schemeStartState":
      var c = input.charCodeAt(pointer);

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
    case "schemeState":
      var c = input.charCodeAt(pointer);

      // step 9-1
      if (isASCIIAlphaNumeric(c) || [43, 45, 46].indexOf(c) > 0) { // +, -, .
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
      else if (c === NaN) {
        return; // TODO: terminate
      }

      // step 9-5
      else {
        // TODO: parse error
        return; // TODO: terminate
      }
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
