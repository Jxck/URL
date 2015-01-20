/// <reference path="webidl.d.ts" />
/// <reference path="text-encoding.d.ts" />
import TextEncoding = require('text-encoding');
var TextEncoder = TextEncoding.TextEncoder;
var TextDecoder = TextEncoding.TextDecoder;

function copy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function encode(s: string, encodeOverride: string): Uint8Array {
  var encoder = new TextEncoder(encodeOverride);
  return encoder.encode(s);
}

// https://url.spec.whatwg.org/#percent-encoded-bytes
function percentEncode(b: number): string {
  return "%" + b.toString(16).toUpperCase();
}

// https://url.spec.whatwg.org/#interface-urlsearchparams
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
  get(name: USVString):                      USVString;
  getAll(name: USVString):                   USVString[];
  has(name: USVString):                      boolean;
  set(name: USVString, value: USVString):    void;
  toString():                                string; // stringifier;
  // iterable<USVString, USVString>;
};

interface pair {
  name:  USVString;
  value: USVString;
}

class URLSearchParams implements IURLSearchParams {
  // https://url.spec.whatwg.org/#concept-urlsearchparams-list
  private list: pair[];

  // https://url.spec.whatwg.org/#concept-urlsearchparams-url-object
  private urlObject: URL[];

  // https://url.spec.whatwg.org/#concept-urlsearchparams-new
  constructor(init?: USVString);
  constructor(init?: URLSearchParams);
  constructor(init?: any) {
    this.list = [];
    this.urlObject = [];

    // step 1
    var query = this;

    // step 2
    if (init === "" || init === null) {
      return query
    }

    // step 3
    if (typeof init === "string") {
      query.list = this.parse(init);
    }

    // step 4
    if (URLSearchParams.prototype.isPrototypeOf(init)) {
      query.list = copy(init.list);
    }

    // step 5
    return query;
  }

  // https://url.spec.whatwg.org/#dom-urlsearchparams-append
  append(name: USVString, value: USVString): void {
    if(name === undefined || value === undefined) {
      throw new TypeError("Not enough arguments to URLSearchParams.append.");
    }

    // step 1
    this.list.push({ name: name, value: value });

    // step 2
    this.update();
  }

  // https://url.spec.whatwg.org/#dom-urlsearchparams-delete
  delete(name: USVString): void {
    if (name === undefined) {
      throw new TypeError("Not enough arguments to URLSearchParams.delete.");
    }

    // step 1
    this.list = this.list.filter(pair => pair.name !== name);

    // step 2
    this.update();
  }

  // https://url.spec.whatwg.org/#dom-urlsearchparams-get
  get(name: USVString): USVString {
    if (name === undefined) {
      throw new TypeError("Not enough arguments to URLSearchParams.get.");
    }
    return this.getAll(name).shift() || null;
  }

  // https://url.spec.whatwg.org/#dom-urlsearchparams-getall
  getAll(name: USVString): USVString[] {
    if (name === undefined) {
      throw new TypeError("Not enough arguments to URLSearchParams.getAll.");
    }
    return this.list.reduce((acc, pair) => {
      if (pair.name === name) {
        acc.push(pair.value);
      }
      return acc;
    }, []);
  }

  // https://url.spec.whatwg.org/#dom-urlsearchparams-set
  set(name: USVString, value: USVString): void { // TODO: performance
    if (name === undefined || value === undefined) {
      throw new TypeError("Not enough arguments to URLSearchParams.set.");
    }
    // if exists, this appended will remove in filter.
    this.list.push({ name: name, value: value });

    // update all pair
    this.list = this.list.map(pair => {
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

    // step 3
    this.update();
  }

  // https://url.spec.whatwg.org/#dom-urlsearchparams-has
  // TODO: implement correctly
  has(name: USVString): boolean {
    if (name === undefined) {
      throw new TypeError("Not enough arguments to URLSearchParams.has.");
    }
    return this.list.some(pair => pair.name === name);
  }

  // https://url.spec.whatwg.org/#concept-urlencoded-byte-serializer
  private byteSerialize(input: Uint8Array): string {
    // step 1
    var output = "";

    // step 2
    for(var i=0; i < input.length; i++) {
      var byt = input[i];
      if (byt === 0x20) {
        output += "+"; // 0x2B
        continue;
      }

      if ([0x2A, 0x2D, 0x2E].indexOf(byt) > -1) {
        output += String.fromCharCode(byt);
        continue;
      }

      if (0x30 <= byt && byt <= 0x39) {
        output += String.fromCharCode(byt);
        continue;
      }

      if (0x41 <= byt && byt <= 0x5A) {
        output += String.fromCharCode(byt);
        continue;
      }

      if (byt === 0x5F) {
        output += String.fromCharCode(byt);
        continue;
      }

      if (0x61 <= byt && byt <= 0x7A) {
        output += String.fromCharCode(byt);
        continue;
      }

      // Otherwise
      output += percentEncode(byt);
    }

    // step 3
    return output;
  }

  // https://url.spec.whatwg.org/#concept-urlencoded-serializer
  private serialize(pairs: pair[], encodingOverride?: string): string {
    // step 1
    if (encodingOverride === undefined) {
      encodingOverride = "utf-8";
    }

    // step 2
    var output = "";

    // step 3
    pairs.forEach((pair, index) => {
      // step 3-1
      var outputPair = copy(pair);

      // step 3-2
      var encodedName = encode(outputPair.name, encodingOverride);
      var encodedValue = encode(outputPair.value, encodingOverride);

      // step 3-3
      outputPair.name = this.byteSerialize(encodedName);
      outputPair.value = this.byteSerialize(encodedValue);

      // step 3-4
      if (index !== 0) {
        output += "&";
      }

      output += outputPair.name + "=" + outputPair.value;
    });

    // step 4
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

    return pairs;
  }

  // https://url.spec.whatwg.org/#concept-urlsearchparams-update
  private update(): void {
    // step 1
    this.urlObject.forEach((url) => {
      // TODO: add query to url
      // url.query = this.serialize(this.list);

      // step 2
      // this.urlObject.preupdate();
    });
  }

  toString(): string {
    return this.serialize(this.list);
  }
}

// tests
function assert(actual, expected) {
  console.log('.');
  console.assert(actual === expected, '\nact: ' + actual + '\nexp: ' + expected);
}

(function TestURLSearchPrams() {
  (function parse() {
    var s = new URLSearchParams("");
    assert(s.toString(), "");

    var s = new URLSearchParams(null);
    assert(s.toString(), "");

    var q = "a=b&c=d";
    var s = new URLSearchParams(q);
    assert(s.toString(), q);

    var a = "aAzZ09あ𠮟叱";
    var e = "aAzZ09%E3%81%82%F0%A0%AE%9F%E5%8F%B1=";
    var s = new URLSearchParams(a);
    assert(s.toString(), e);

    var a = " *-._";
    var e = "+*-._=";
    var s = new URLSearchParams(a);
    assert(s.toString(), e);

    var a = "!~'()";
    var e = "%21%7E%27%28%29=";
    var s = new URLSearchParams(a);
    assert(s.toString(), e);

    var q = "a=b&c=d";
    var s = new URLSearchParams(q);
    var ss = new URLSearchParams(s);
    assert(ss.toString(), q);

  })();

  (function api() {
    // append
    var s = new URLSearchParams();
    s.append("a", "b");
    s.append("c", "d");
    assert(s.toString(), "a=b&c=d");
    s.append("a", "b");
    assert(s.toString(), "a=b&c=d&a=b");

    var s = new URLSearchParams("a=b");
    s.append("a", "b");
    assert(s.toString(), "a=b&a=b");

    // get
    var s = new URLSearchParams("a=b");
    assert(s.get("a"), "b");

    var s = new URLSearchParams("a=b&a=c");
    assert(s.get("a"), "b");
    assert(s.get("b"), null);
    s.append("a", "d");
    assert(s.get("a"), "b");

    // getAll
    var s = new URLSearchParams("a=b&b=c&a=c");
    var all = s.getAll("a");
    assert(all.length, 2);
    assert(all[0], "b");
    assert(all[1], "c");
    assert(s.getAll("z").length, 0);

    // set
    var s = new URLSearchParams("a=b&b=c&a=c");
    s.set("a", "d");
    var all = s.getAll("a");
    assert(all.length, 1);
    assert(all[0], "d");
    assert(s.toString(), "a=d&b=c");

    // delete
    var s = new URLSearchParams("a=b&a=c&x=y");
    s.delete("a");
    var all = s.getAll("a");
    assert(all.length, 0);

    s.delete("z");
    assert(s.get("x"), "y");

    // has
    var s = new URLSearchParams("a=b&a=c&x=y");
    assert(s.has("a"), true);
    assert(s.has("x"), true);
    assert(s.has("z"), false);
  })();

  (function storyTest() {
    // from https://developer.mozilla.org/ja/docs/Web/API/URLSearchParams
    var paramsString = "q=URLUtils.s&topic=api"
    var s = new URLSearchParams(paramsString);

    assert(s.has("topic"), true);
    assert(s.get("topic"), "api");
    assert(s.getAll("topic")[0], "api");
    assert(s.get("foo"), null); // true

    s.append("topic", "webdev");
    assert(s.toString(), "q=URLUtils.s&topic=api&topic=webdev");

    s.delete("topic");
    assert(s.toString(), "q=URLUtils.s");
  })();

  (function argumentsErrorTest() {
    var error_message = "Not enough arguments to URLSearchParams"
    var s = new URLSearchParams();

    // append
    try {
      s.append('a', undefined);
    } catch(err) {
      assert(err.message, error_message + ".append.");
    }

    try {
      s.append(undefined, 'b');
    } catch(err) {
      assert(err.message, error_message + ".append.");
    }

    try {
      s.append(undefined, undefined);
    } catch(err) {
      assert(err.message, error_message + ".append.");
    }

    // get
    try {
      s.get(undefined);
    } catch(err) {
      assert(err.message, error_message + ".get.");
    }

    // getAll
    try {
      s.getAll(undefined);
    } catch(err) {
      assert(err.message, error_message + ".getAll.");
    }

    // set
    try {
      s.set('a', undefined);
    } catch(err) {
      assert(err.message, error_message + ".set.");
    }

    try {
      s.set(undefined, 'b');
    } catch(err) {
      assert(err.message, error_message + ".set.");
    }

    try {
      s.set(undefined, undefined);
    } catch(err) {
      assert(err.message, error_message + ".set.");
    }

    // has
    try {
      s.has(undefined);
    } catch(err) {
      assert(err.message, error_message + ".has.");
    }

    // delete
    try {
      s.delete(undefined);
    } catch(err) {
      assert(err.message, error_message + ".delete.");
    }
  })();
})();
