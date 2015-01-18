/// <reference path="./webidl.d.ts" />
/// <reference path="urlsearchparams.ts" />

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
  // readonly attribute
  origin:       USVString;
  protocol:     USVString;
  username:     USVString;
  password:     USVString;
  host:         USVString;
  hostname:     USVString;
  port:         USVString;
  pathname:     USVString;
  search:       USVString;
  searchParams: URLSearchParams;
  hash:         USVString;
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

// URL already in lib.d.ts
class jURL implements IURL {
  private input:         string;
  private encoding:      string;
  private queryObject:   URLSearchParams;
  private url:           jURL;

  private _origin:       USVString;
  private _protocol:     USVString;
  private _username:     USVString;
  private _password:     USVString;
  private _host:         USVString;
  private _hostname:     USVString;
  private _port:         USVString;
  private _pathname:     USVString;
  private _search:       USVString;
  private _searchParams: URLSearchParams;
  private _hash:         USVString;

  static domainToASCII(domain: string):   string {
    // TODO: implement me
    return "";
  }

  static domainToUnicode(domain: string): string {
    // TODO: implement me
    return "";
  }

  constructor(url:USVString, base:USVString = "about:blank") {
  }

  get origin(): USVString {
    return this._origin;
  }

  get protocol(): USVString {
    return this._protocol;
  }

  get username(): USVString {
    return this._username;
  }

  get password(): USVString {
    return this._password;
  }

  get host(): USVString {
    return this._host;
  }

  get hostname(): USVString {
    return this._hostname;
  }

  get port(): USVString {
    return this._port;
  }

  get pathname(): USVString {
    return this._pathname;
  }

  get search(): USVString {
    return this._search;
  }

  get searchParams(): URLSearchParams {
    return this._searchParams;
  }

  get hash(): USVString {
    return this._hash;
  }
}

//class jURL implements URLUtils {
//  private origin:       USVString;
//  private protocol:     USVString;
//  private username:     USVString;
//  private password:     USVString;
//  private host:         USVString;
//  private hostname:     USVString;
//  private port:         USVString;
//  private pathname:     USVString;
//  private search:       USVString;
//  // searchParams: URLSearchParams;
//  private hash:         USVString;
//}

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
