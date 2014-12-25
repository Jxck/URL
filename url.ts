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

  private byteSerialize(input: string): string {
    input = encodeURIComponent(input);

    // revert space to '+'
    input = input.replace("%20", "+");

    // replace chars which encodeURIComponent dosen't cover
    input = input.replace("!", "%21")
                 .replace("~", "%7E")
                 .replace("'", "%27")
                 .replace("(", "%28")
                 .replace(")", "%29")

    return input
  }

  private serialize(pairs: pair[], encodingOverride?: string): string {
    if (encodingOverride === undefined) {
      encodingOverride = "utf-8";
    }

    var output = pairs.reduce(function(_output, pair, index) {
      // use encodeURIComponent as byte serializer
      var name  = byteSerialize(pair.name);
      var value = byteSerialize(pair.value);
      if (index !== 0) {
        _output = _output + "&";
      }
      _output += name + "=" + value;
      return _output;
    }, "");

    return output;
  }


  // https://url.spec.whatwg.org/#concept-urlencoded-parser
  /**
   * CAUTION
   * this implementation currently support only UTF-8 encoding
   * so ignore 'encodingOverride' and '_charset_' flag
   */
  private parse(input: USVString, encodingOverride?: string, useCharset?: boolean, isIndex?: boolean): pair[] {
    if (encodingOverride === undefined) {
      encodingOverride = "utf-8";
    }

    if (encodingOverride !== "utf-8") {
      // TODO: support other encoding
      throw new Error("unsupported eocnding");
    }

    var sequences = input.split('&');

    if(isIndex) {
      var head = sequences[0];
      if (head.indexOf("=") === -1) {
        sequences[0] = "=" + head;
      }
    }

    var pairs: pair[] = sequences.map(function(bytes: USVString): pair {
      if (bytes === "") return;

      // Split in "="
      var name, value: USVString;
      if (bytes.indexOf("=")) {
        var b = bytes.split("=");
        name  = b.shift();
        value = b.join("=");
      } else {
        name  = bytes;
        value = "";
      }

      // replace "+" to 0x20
      var c0x20 = String.fromCharCode(0x20);
      name.replace(/\+/g, c0x20);
      value.replace(/\+/g, c0x20);

      if (useCharset && name === "_charset_") {
        throw new Error("unsupported flug _charset_");
      }

      // parsent decode
      name  = decodeURIComponent(name);
      value = decodeURIComponent(value);

      return { name: name, value: value };
    });

    return null;
  }

  private update(): void {
    // TODO: implement me
    // https://url.spec.whatwg.org/#concept-urlsearchparams-update
  }

  toString(): string {
    return this.serialize(this.list);
  }
}
