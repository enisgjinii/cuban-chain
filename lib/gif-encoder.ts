/**
 * Minimal in-browser GIF89a encoder — no dependencies.
 * Uses a 6×6×6 RGB color cube (216 of the 256 palette slots).
 * Suitable for chain previews; not intended for photographic content.
 */

// Build a fixed 256-entry RGB palette: 6×6×6 web-safe-like cube + black padding.
function buildPalette(): Uint8Array {
  const p = new Uint8Array(256 * 3);
  let i = 0;
  for (let r = 0; r < 6; r++) {
    for (let g = 0; g < 6; g++) {
      for (let b = 0; b < 6; b++) {
        p[i++] = Math.round(r * 51);
        p[i++] = Math.round(g * 51);
        p[i++] = Math.round(b * 51);
      }
    }
  }
  return p;
}

const PALETTE = buildPalette();

function quantize(rgba: Uint8ClampedArray): Uint8Array {
  const n = rgba.length >> 2;
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const ri = Math.min(Math.round(rgba[i * 4]     / 51), 5);
    const gi = Math.min(Math.round(rgba[i * 4 + 1] / 51), 5);
    const bi = Math.min(Math.round(rgba[i * 4 + 2] / 51), 5);
    out[i] = ri * 36 + gi * 6 + bi;
  }
  return out;
}

function lzwEncode(indices: Uint8Array, minCodeSize: number): number[] {
  const clearCode = 1 << minCodeSize;
  const eoi = clearCode + 1;

  let codeSize = minCodeSize + 1;
  let nextCode = eoi + 1;
  let maxCode = 1 << codeSize;
  let table = new Map<string, number>();

  const output: number[] = [];
  let buf = 0;
  let bits = 0;

  const emit = (code: number) => {
    buf |= code << bits;
    bits += codeSize;
    while (bits >= 8) { output.push(buf & 0xff); buf >>= 8; bits -= 8; }
  };

  const initTable = () => {
    table = new Map();
    for (let i = 0; i < clearCode; i++) table.set(String.fromCharCode(i), i);
    nextCode = eoi + 1;
    codeSize = minCodeSize + 1;
    maxCode = 1 << codeSize;
  };

  initTable();
  emit(clearCode);

  if (!indices.length) { emit(eoi); if (bits > 0) output.push(buf & 0xff); return output; }

  let buffer = String.fromCharCode(indices[0]);
  for (let i = 1; i < indices.length; i++) {
    const c = String.fromCharCode(indices[i]);
    const bc = buffer + c;
    if (table.has(bc)) {
      buffer = bc;
    } else {
      emit(table.get(buffer)!);
      if (nextCode < 4096) {
        table.set(bc, nextCode++);
        if (nextCode > maxCode && codeSize < 12) { codeSize++; maxCode <<= 1; }
      } else {
        emit(clearCode);
        initTable();
      }
      buffer = c;
    }
  }
  emit(table.get(buffer)!);
  emit(eoi);
  if (bits > 0) output.push(buf & 0xff);
  return output;
}

/** Scale an ImageData down to at most `maxWidth` px wide, preserving aspect ratio. */
export function resizeFrame(src: ImageData, maxWidth = 640): ImageData {
  const scale = Math.min(1, maxWidth / src.width);
  const w = Math.max(1, Math.floor(src.width  * scale));
  const h = Math.max(1, Math.floor(src.height * scale));
  if (w === src.width && h === src.height) return src;

  const tmpA = document.createElement("canvas");
  tmpA.width = src.width; tmpA.height = src.height;
  tmpA.getContext("2d")!.putImageData(src, 0, 0);

  const tmpB = document.createElement("canvas");
  tmpB.width = w; tmpB.height = h;
  const ctx = tmpB.getContext("2d")!;
  ctx.drawImage(tmpA, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

export interface GifFrame {
  imageData: ImageData;
  /** Delay in centiseconds (100ths of a second). 5 = 50 ms ≈ 20 fps. */
  delay?: number;
}

/**
 * Encode an array of ImageData frames into a looping GIF89a Blob.
 * All frames must have the same dimensions.
 */
export function encodeGif(frames: GifFrame[], loop = true): Blob {
  if (!frames.length) throw new Error("encodeGif: no frames provided");
  const { width, height } = frames[0].imageData;

  const bytes: number[] = [];
  const wb  = (b: number) => bytes.push(b & 0xff);
  const ws  = (n: number) => { wb(n); wb(n >> 8); };
  const wa  = (arr: ArrayLike<number>) => { for (let i = 0; i < arr.length; i++) wb(arr[i]); };

  // Header
  wa([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]); // "GIF89a"

  // Logical Screen Descriptor
  ws(width); ws(height);
  wb(0b11110111); // Global CT flag=1, colour res=8, sort=0, size=7 → 256 entries
  wb(0); wb(0);   // background idx, pixel aspect ratio

  // Global Colour Table
  wa(PALETTE);

  // Netscape looping extension
  if (loop) {
    wa([0x21, 0xff, 0x0b]);
    wa([0x4e,0x45,0x54,0x53,0x43,0x41,0x50,0x45,0x32,0x2e,0x30]); // "NETSCAPE2.0"
    wa([0x03, 0x01]); ws(0); wb(0); // loop count=0 (∞), block terminator
  }

  for (const frame of frames) {
    const delay = frame.delay ?? 6;
    const pixels = quantize(frame.imageData.data);

    // Graphic Control Extension
    wa([0x21, 0xf9, 0x04]);
    wb(0b00000100); // disposal=do-not-dispose, no user input, no transparency
    ws(delay);
    wb(0); wb(0); // transparent idx, block terminator

    // Image Descriptor
    wb(0x2c); ws(0); ws(0); ws(width); ws(height);
    wb(0x00); // no local CT, not interlaced

    // Image Data
    const minCodeSize = 8;
    wb(minCodeSize);
    const compressed = lzwEncode(pixels, minCodeSize);
    let pos = 0;
    while (pos < compressed.length) {
      const len = Math.min(255, compressed.length - pos);
      wb(len);
      for (let i = 0; i < len; i++) wb(compressed[pos + i]);
      pos += len;
    }
    wb(0); // block terminator
  }

  wb(0x3b); // GIF Trailer
  return new Blob([new Uint8Array(bytes)], { type: "image/gif" });
}
