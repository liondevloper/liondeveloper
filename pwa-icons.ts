import { readFileSync } from 'node:fs';
import { deflateSync, inflateSync } from 'node:zlib';
import type { Plugin } from 'vite';

/* Installed-app (PWA) icons, made from public/logo.png at build time.
   Phones crop home-screen icons into a circle or rounded square, which cut the lion's ears and the
   name plate off. Every icon here puts the whole logo inside the safe centre zone on an ivory tile. */

type Rgba = { width: number; height: number; data: Uint8Array };
type IconSpec = { file: string; size: number; logoShare: number; corner: number };

export const PWA_ICONS: readonly IconSpec[] = [
  // "any" icons: the logo fills most of a rounded tile.
  { file: 'icons/icon-192.png', size: 192, logoShare: 0.84, corner: 0.22 },
  { file: 'icons/icon-512.png', size: 512, logoShare: 0.84, corner: 0.22 },
  // "maskable" icons: Android may crop to a circle, so the logo stays inside the inner 62%.
  { file: 'icons/icon-maskable-192.png', size: 192, logoShare: 0.62, corner: 0 },
  { file: 'icons/icon-maskable-512.png', size: 512, logoShare: 0.62, corner: 0 },
  // iOS rounds the corners itself and does not allow transparency.
  { file: 'icons/apple-touch-icon.png', size: 180, logoShare: 0.76, corner: 0 },
];

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const CHANNELS: Record<number, number> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

const paeth = (a: number, b: number, c: number) => {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};

// Reads 8-bit, non-interlaced PNGs (palette, grey, RGB, with or without alpha) into RGBA pixels.
function decodePng(file: Buffer): Rgba {
  if (!file.subarray(0, 8).equals(SIGNATURE)) throw new Error('pwa-icons: logo.png is not a PNG');
  let width = 0;
  let height = 0;
  let colorType = 0;
  let palette = new Uint8Array(0);
  let alpha = new Uint8Array(0);
  const parts: Buffer[] = [];
  for (let pos = 8; pos < file.length; ) {
    const length = file.readUInt32BE(pos);
    const type = file.toString('ascii', pos + 4, pos + 8);
    const body = file.subarray(pos + 8, pos + 8 + length);
    if (type === 'IHDR') {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      colorType = body[9] ?? 0;
      if (body[8] !== 8 || body[12] !== 0) throw new Error('pwa-icons: logo.png must be 8-bit and non-interlaced');
    } else if (type === 'PLTE') palette = new Uint8Array(body);
    else if (type === 'tRNS') alpha = new Uint8Array(body);
    else if (type === 'IDAT') parts.push(body);
    pos += 12 + length;
  }
  const channels = CHANNELS[colorType];
  if (!channels) throw new Error('pwa-icons: unsupported PNG colour type');

  const raw = inflateSync(Buffer.concat(parts));
  const stride = width * channels;
  const rows = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)] ?? 0;
    const src = y * (stride + 1) + 1;
    const out = y * stride;
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? rows[out + x - channels] ?? 0 : 0;
      const up = y > 0 ? rows[out - stride + x] ?? 0 : 0;
      const upLeft = y > 0 && x >= channels ? rows[out - stride + x - channels] ?? 0 : 0;
      const value = raw[src + x] ?? 0;
      const base = filter === 1 ? left : filter === 2 ? up : filter === 3 ? (left + up) >> 1 : filter === 4 ? paeth(left, up, upLeft) : 0;
      rows[out + x] = (value + base) & 255;
    }
  }

  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const s = i * channels;
    const d = i * 4;
    if (colorType === 3) {
      const index = rows[s] ?? 0;
      data[d] = palette[index * 3] ?? 0;
      data[d + 1] = palette[index * 3 + 1] ?? 0;
      data[d + 2] = palette[index * 3 + 2] ?? 0;
      data[d + 3] = alpha[index] ?? 255;
    } else if (colorType === 0 || colorType === 4) {
      const grey = rows[s] ?? 0;
      data[d] = grey;
      data[d + 1] = grey;
      data[d + 2] = grey;
      data[d + 3] = colorType === 4 ? rows[s + 1] ?? 255 : 255;
    } else {
      data[d] = rows[s] ?? 0;
      data[d + 1] = rows[s + 1] ?? 0;
      data[d + 2] = rows[s + 2] ?? 0;
      data[d + 3] = colorType === 6 ? rows[s + 3] ?? 255 : 255;
    }
  }
  return { width, height, data };
}

// Smallest box around the visible (non-transparent) part of the logo, so empty margins do not shrink it.
function visibleBounds({ width, height, data }: Rgba) {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if ((data[(y * width + x) * 4 + 3] ?? 0) < 8) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  return right < 0 ? { left: 0, top: 0, right: width - 1, bottom: height - 1 } : { left, top, right, bottom };
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (bytes: Buffer) => {
  let c = 0xffffffff;
  for (const byte of bytes) c = (CRC_TABLE[(c ^ byte) & 255] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type: string, body: Buffer) => {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length, 0);
  head.write(type, 4, 'ascii');
  const tail = Buffer.alloc(4);
  tail.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
  return Buffer.concat([head, body, tail]);
};

function encodePng({ width, height, data }: Rgba): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) Buffer.from(data.buffer, data.byteOffset + y * width * 4, width * 4).copy(raw, y * (width * 4 + 1) + 1);
  return Buffer.concat([SIGNATURE, chunk('IHDR', header), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// Coverage of a pixel by a rounded square, with a soft 1px edge.
function cornerAlpha(x: number, y: number, size: number, radius: number) {
  if (radius <= 0) return 1;
  const cx = Math.min(Math.max(x + 0.5, radius), size - radius);
  const cy = Math.min(Math.max(y + 0.5, radius), size - radius);
  return Math.min(Math.max(radius - Math.hypot(x + 0.5 - cx, y + 0.5 - cy) + 0.5, 0), 1);
}

function renderIcon(logo: Rgba, spec: IconSpec): Buffer {
  const { size, logoShare, corner } = spec;
  const bounds = visibleBounds(logo);
  const srcW = bounds.right - bounds.left + 1;
  const srcH = bounds.bottom - bounds.top + 1;
  const scale = (size * logoShare) / Math.max(srcW, srcH);
  const drawW = srcW * scale;
  const drawH = srcH * scale;
  const offX = (size - drawW) / 2;
  const offY = (size - drawH) / 2;
  const samples = Math.max(1, Math.ceil(1 / scale));
  const out = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Ivory tile with a soft warm radial glow, matching the site background.
      const dist = Math.min(Math.hypot(x - size / 2, y - size / 2) / (size * 0.72), 1);
      let r = 255 - 12 * dist;
      let g = 252 - 20 * dist;
      let b = 246 - 32 * dist;

      // Box-filter the logo pixels under this icon pixel, so downscaling stays smooth.
      let sr = 0;
      let sg = 0;
      let sb = 0;
      let sa = 0;
      for (let j = 0; j < samples; j++) {
        for (let i = 0; i < samples; i++) {
          const lx = Math.floor((x + (i + 0.5) / samples - offX) / scale) + bounds.left;
          const ly = Math.floor((y + (j + 0.5) / samples - offY) / scale) + bounds.top;
          if (lx < bounds.left || lx > bounds.right || ly < bounds.top || ly > bounds.bottom) continue;
          const p = (ly * logo.width + lx) * 4;
          const a = (logo.data[p + 3] ?? 0) / 255;
          sr += (logo.data[p] ?? 0) * a;
          sg += (logo.data[p + 1] ?? 0) * a;
          sb += (logo.data[p + 2] ?? 0) * a;
          sa += a;
        }
      }
      const count = samples * samples;
      const a = sa / count;
      r = sr / count + r * (1 - a);
      g = sg / count + g * (1 - a);
      b = sb / count + b * (1 - a);

      const d = (y * size + x) * 4;
      out[d] = Math.round(r);
      out[d + 1] = Math.round(g);
      out[d + 2] = Math.round(b);
      out[d + 3] = Math.round(cornerAlpha(x, y, size, size * corner) * 255);
    }
  }
  return encodePng({ width: size, height: size, data: out });
}

export function buildPwaIcons(logoPath: string): Map<string, Buffer> {
  const logo = decodePng(readFileSync(logoPath));
  return new Map(PWA_ICONS.map((spec) => [spec.file, renderIcon(logo, spec)]));
}

// Serves the icons in dev and writes them into dist/icons on build. Nothing binary lives in git.
export function pwaIcons(logoPath = 'public/logo.png'): Plugin {
  let icons: Map<string, Buffer> | null = null;
  const load = () => (icons ??= buildPwaIcons(logoPath));
  return {
    name: 'lion-pwa-icons',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const icon = load().get((req.url ?? '').split('?')[0]?.replace(/^\//, '') ?? '');
        if (!icon) return next();
        res.setHeader('Content-Type', 'image/png');
        res.end(icon);
      });
    },
    generateBundle() {
      for (const [fileName, source] of load()) this.emitFile({ type: 'asset', fileName, source });
    },
  };
}
