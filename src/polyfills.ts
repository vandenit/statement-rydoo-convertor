// Polyfills for browser-only globals required by some PDF libraries in a worker/pkg environment
if (typeof (global as any).DOMMatrix === 'undefined') {
  (global as any).DOMMatrix = class DOMMatrix {
    constructor() {}
    static fromMatrix() { return new DOMMatrix(); }
  };
}
if (typeof (global as any).ImageData === 'undefined') {
  (global as any).ImageData = class ImageData {
    constructor() {}
  };
}
if (typeof (global as any).Path2D === 'undefined') {
  (global as any).Path2D = class Path2D {
    constructor() {}
  };
}

export {};
