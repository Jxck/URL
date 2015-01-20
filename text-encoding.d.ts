declare module TextEncoding {
  interface TextDecoder {
    encoding: string;
    fatal: boolean;
    ignoreBOM: boolean;
    decode(input?: any, options?: Object): string;
  }
  var TextDecoder: {
    prototype: TextDecoder;
    new (label?: string, options?: Object): TextDecoder;
  }

  interface TextEncoder {
    encoding: string;
    encode(input?: string): Uint8Array;
  }
  var TextEncoder: {
    prototype: TextEncoder;
    new (utfLabel?: string): TextEncoder;
  }
}

declare module 'text-encoding' {
    export = TextEncoding;
}
