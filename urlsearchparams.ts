/// <reference path="webidl.d.ts" />

function copy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
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
  list: pair[];

  // https://url.spec.whatwg.org/#concept-urlsearchparams-url-object
  urlObject: URL[];

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

  append(name: USVString, value: USVString): void {
    if(name === undefined || value === undefined) {
      throw new TypeError("Not enough arguments to URLSearchParams.append.");
    }
    this.list.push({ name: name, value: value });
    this.update();
  }

  delete(name: USVString): void {
    if (name === undefined) {
      throw new TypeError("Not enough arguments to URLSearchParams.delete.");
    }
    this.list = this.list.filter(function(pair) {
      return pair.name !== name;
    });
    this.update();
  }

  get(name: USVString): USVString {
    if (name === undefined) {
      throw new TypeError("Not enough arguments to URLSearchParams.get.");
    }
    return this.getAll(name).shift() || null;
  }

  getAll(name: USVString): USVString[] {
    if (name === undefined) {
      throw new TypeError("Not enough arguments to URLSearchParams.getAll.");
    }
    return this.list.reduce(function(acc, pair) {
      if (pair.name === name) {
        acc.push(pair.value);
      }
      return acc;
    }, []);
  }

  has(name: USVString): boolean {
    if (name === undefined) {
      throw new TypeError("Not enough arguments to URLSearchParams.has.");
    }
    return this.list.some(function(pair) {
      return pair.name === name;
    });
  }

  set(name: USVString, value: USVString): void { // TODO: performance
    if (name === undefined || value === undefined) {
      throw new TypeError("Not enough arguments to URLSearchParams.set.");
    }
    // if exists, this appended will remove in filter.
    this.list.push({ name: name, value: value });

    // update all pair
    this.list = this.list.map(function(pair) {
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

    var output = pairs.reduce((_output, pair, index) => {
      // use encodeURIComponent as byte serializer
      var name  = this.byteSerialize(pair.name);
      var value = this.byteSerialize(pair.value);
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

    return pairs;
  }

  private update(): void {
    // TODO: implement me
    // https://url.spec.whatwg.org/#concept-urlsearchparams-update
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
  (function test1() {
    var q = "a=b&c=d";
    var searchParams = new URLSearchParams(q);
    assert(searchParams.toString(), q);

    var a = "aAzZ09あ𠮟叱";
    var e = "aAzZ09%E3%81%82%F0%A0%AE%9F%E5%8F%B1=";
    var searchParams = new URLSearchParams(a);
    assert(searchParams.toString(), e);

    var a = " *-._";
    var e = "+*-._=";
    var searchParams = new URLSearchParams(a);
    assert(searchParams.toString(), e);

    var a = "!~'()";
    var e = "%21%7E%27%28%29=";
    var searchParams = new URLSearchParams(a);
    assert(searchParams.toString(), e);
  })();

  (function test2() {
    // append
    var searchParams = new URLSearchParams();
    searchParams.append("a", "b");
    searchParams.append("c", "d");
    assert(searchParams.toString(), "a=b&c=d");

    // get
    var searchParams = new URLSearchParams("a=b");
    assert(searchParams.get("a"), "b");

    var searchParams = new URLSearchParams("a=b&a=c");
    assert(searchParams.get("a"), "b");
    assert(searchParams.get("b"), null);

    // getAll
    var searchParams = new URLSearchParams("a=b&a=c");
    var all = searchParams.getAll("a");
    assert(all.length, 2);
    assert(all[0], "b");
    assert(all[1], "c");

    // set
    var searchParams = new URLSearchParams("a=b&a=c");
    searchParams.set("a", "d");
    var all = searchParams.getAll("a");
    assert(all.length, 1);
    assert(all[0], "d");

    // delete
    var searchParams = new URLSearchParams("a=b&a=c&x=y");
    searchParams.delete("a");
    var all = searchParams.getAll("a");
    assert(all.length, 0);

    searchParams.delete("z");
    assert(searchParams.get("x"), "y");

    // has
    var searchParams = new URLSearchParams("a=b&a=c&x=y");
    assert(searchParams.has("a"), true);
    assert(searchParams.has("x"), true);
    assert(searchParams.has("z"), false);
  })();

  (function test3() {
    // from https://developer.mozilla.org/ja/docs/Web/API/URLSearchParams
    var paramsString = "q=URLUtils.searchParams&topic=api"
    var searchParams = new URLSearchParams(paramsString);

  assert(searchParams.has("topic"), true);
  assert(searchParams.get("topic"), "api");
  assert(searchParams.getAll("topic")[0], "api");
  assert(searchParams.get("foo"), null); // true

  searchParams.append("topic", "webdev");
  assert(searchParams.toString(), "q=URLUtils.searchParams&topic=api&topic=webdev");

  searchParams.delete("topic");
  assert(searchParams.toString(), "q=URLUtils.searchParams");
  })();

  (function test4() {
    var error_message = "Not enough arguments to URLSearchParams"
    var searchParams = new URLSearchParams();

  // append
  try {
    searchParams.append(undefined, undefined);
  } catch(err) {
    assert(err.message, error_message + ".append.");
  }

  // get
  try {
    searchParams.get(undefined);
  } catch(err) {
    assert(err.message, error_message + ".get.");
  }

  // getAll
  try {
    searchParams.getAll(undefined);
  } catch(err) {
    assert(err.message, error_message + ".getAll.");
  }

  // set
  try {
    searchParams.set(undefined, undefined);
  } catch(err) {
    assert(err.message, error_message + ".set.");
  }

  // has
  try {
    searchParams.has(undefined);
  } catch(err) {
    assert(err.message, error_message + ".has.");
  }

  // delete
  try {
    searchParams.delete(undefined);
  } catch(err) {
    assert(err.message, error_message + ".delete.");
  }
  })();
})();
