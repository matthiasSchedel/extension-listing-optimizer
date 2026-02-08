import { setTimeout as sleep } from 'node:timers/promises';

export interface ImageDimensions {
  width: number | null;
  height: number | null;
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function matchesPngSignature(data: Uint8Array): boolean {
  return PNG_SIGNATURE.every((value, index) => data[index] === value);
}

function parsePng(data: Uint8Array): ImageDimensions {
  if (data.length < 24 || !matchesPngSignature(data)) {
    return { width: null, height: null };
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return {
    width: view.getUint32(16),
    height: view.getUint32(20)
  };
}

function parseJpeg(data: Uint8Array): ImageDimensions {
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) {
    return { width: null, height: null };
  }

  let offset = 2;

  while (offset + 9 < data.length) {
    if (data[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = data[offset + 1];
    const blockLength = (data[offset + 2] << 8) + data[offset + 3];

    const isStartOfFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      ![0xc4, 0xc8, 0xcc].includes(marker);

    if (isStartOfFrame && offset + 8 < data.length) {
      return {
        height: (data[offset + 5] << 8) + data[offset + 6],
        width: (data[offset + 7] << 8) + data[offset + 8]
      };
    }

    if (blockLength <= 0) {
      break;
    }

    offset += blockLength + 2;
  }

  return { width: null, height: null };
}

function parseWebp(data: Uint8Array): ImageDimensions {
  const riff = String.fromCharCode(...data.slice(0, 4));
  const webp = String.fromCharCode(...data.slice(8, 12));
  if (riff !== 'RIFF' || webp !== 'WEBP') {
    return { width: null, height: null };
  }

  const chunk = String.fromCharCode(...data.slice(12, 16));

  if (chunk === 'VP8X' && data.length >= 30) {
    const width = 1 + (data[24] | (data[25] << 8) | (data[26] << 16));
    const height = 1 + (data[27] | (data[28] << 8) | (data[29] << 16));
    return { width, height };
  }

  if (chunk === 'VP8 ' && data.length >= 30) {
    const width = data[26] | (data[27] << 8);
    const height = data[28] | (data[29] << 8);
    return { width, height };
  }

  if (chunk === 'VP8L' && data.length >= 25) {
    const bits =
      data[21] |
      (data[22] << 8) |
      (data[23] << 16) |
      (data[24] << 24);
    const width = (bits & 0x3fff) + 1;
    const height = ((bits >> 14) & 0x3fff) + 1;
    return { width, height };
  }

  return { width: null, height: null };
}

function parseImageDimensions(data: Uint8Array): ImageDimensions {
  const png = parsePng(data);
  if (png.width && png.height) {
    return png;
  }

  const jpeg = parseJpeg(data);
  if (jpeg.width && jpeg.height) {
    return jpeg;
  }

  return parseWebp(data);
}

export async function probeImageDimensions(
  url: string,
  timeoutMs = 10000,
  retries = 1
): Promise<ImageDimensions> {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        headers: { Range: 'bytes=0-65535' },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      const data = new Uint8Array(buffer);
      return parseImageDimensions(data);
    } catch {
      if (attempt < retries) {
        await sleep(300 * (attempt + 1));
        continue;
      }
      return { width: null, height: null };
    } finally {
      clearTimeout(timeout);
    }
  }

  return { width: null, height: null };
}
