declare module URLSearchParams {
  interface URLSearchParams {
    append(name: USVString, value: USVString): void;
    delete(name: USVString):                   void;
    get(name: USVString):                      USVString;
    getAll(name: USVString):                   USVString[];
    has(name: USVString):                      boolean;
    set(name: USVString, value: USVString):    void;
    toString():                                string; // stringifier;
    // iterable<USVString, USVString>;
  }
  var URLSearchParams: {
    prototype: URLSearchParams;
    new (init?: string): URLSearchParams;
    new (init?: URLSearchParams): URLSearchParams;
    new (init?: any): URLSearchParams;
  }
}

declare module 'urlsearchparams' {
  export = URLSearchParams;
}
