declare module URLSearchParams {
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
  var URLSearchParams: {
    prototype: IURLSearchParams;
    new (init?: string): IURLSearchParams;
    new (init?: IURLSearchParams): IURLSearchParams;
    new (init?: any): IURLSearchParams;
  }
}

declare module 'urlsearchparams' {
  export = URLSearchParams;
}
