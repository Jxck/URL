type USVString = string;

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
  // searchParams: URLSearchParams;
  hash:         USVString;
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

//[Constructor(optional (USVString or URLSearchParams) init = ""), Exposed=(Window,Worker)]
//interface URLSearchParams {
//  void append(USVString name, USVString value);
//  void delete(USVString name);
//  USVString? get(USVString name);
//  sequence<USVString> getAll(USVString name);
//  boolean has(USVString name);
//  void set(USVString name, USVString value);
//  iterable<USVString, USVString>;
//  stringifier;
//};
interface IURLSearchParams {
  append(name: USVString, value: USVString): void;
  delete(name: USVString):                   void;
  get(name: USVString):                      USVString; //TODO: USVString?
  getAll(name: USVString):                   USVString[];
  has(name: USVString):                      boolean;
  set(name: USVString, value: USVString):    void;
  // iterable<USVString, USVString>;
  // stringifier;
  toString():                                string;
};

interface pair {
  name:  USVString;
  value: USVString;
}

class URLSearchParams implements IURLSearchParams {
  list: pair[];
  urlObject: URL[];

  constructor(init?: USVString);
  constructor(init?: URLSearchParams);
  constructor(init?: any) {
    this.list = [];
    this.urlObject = [];

    if (typeof init === "string") {
      this.list = this.parse(init);
    }
    if (typeof init === "object") {
      this.list = init.list;
    }
  }

  append(name: USVString, value: USVString): void {
    this.list.push({ name: name, value: value });
    this.update();
  }

  delete(name: USVString): void {
    this.list = this.list.filter(function(pair) {
      return pair.name !== name;
    });
    this.update();
  }

  get(name: USVString): USVString {
    return this.getAll(name).shift() || null;
  }

  getAll(name: USVString): USVString[] {
    return this.list.reduce(function(acc, pair) {
      if (pair.name === name) {
        acc.push(pair.value);
      }
      return acc;
    }, []);
  }

  has(name: USVString): boolean {
    return this.list.some(function(pair) {
      return pair.name === name;
    });
  }

  set(name: USVString, value: USVString): void { // TODO: performance
    // if exists, this appended will remove in filter.
    this.list.push({ name: name, value: value });

    // update all pair
    this.list.map(function(pair) {
      if (pair.name === name) {
        pair.value = value;
      }
      return pair
    })
    // filter duplicates
    .filter(function(pair) {
      if (pair.name === name) {
        if (this.emitted) {
          // current pair is duplicate
          return false;
        } else {
          // first pair of key
          this.emitted = true;
          return true;
        }
      }
      // other pair
      return true;
    }, { emitted: false });
  }

  private parse(input: USVString, encoding?: string, useCharset?: boolean, isIndex?: boolean): pair[] {
    if (encoding !== "utf-8") {
      encoding = "utf-8"; // TODO: currently only support utf-8
    }

    // TODO: check 0x7F

    var sequences = input.split('&');

    if(isIndex) {
      var sequence = sequences[0];
      if (sequence.indexOf("=") === -1) {
        sequences[0] = "=" + sequence;
      }
    }

    var pairs: pair[] = sequences.map(function(bytes: USVString): pair {
      if (bytes === "") return;

      // Split in "="
      var name, value: USVString;
      if (bytes.indexOf("=")) {
        var b = bytes.split("=");
        name  = b.shift();
        value = b.join("");
      } else {
        name  = bytes;
        value = "";
      }

      // replace "+" to 0x20
      var c0x20 = String.fromCharCode(0x20);
      name.replace(/\+/g, c0x20);
      value.replace(/\+/g, c0x20);

      if (useCharset && name === "_charset_") {
        throw new Error("not implemented yet");
      }

      return {name: name, value: value};
    });


    return null;
  }

  private update(): void {
  }

  toString(): string {
    return "";
  }
}