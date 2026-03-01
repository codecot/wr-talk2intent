export interface Chunk {
  index: number;
  content: string;
}

export function chunkText(
  text: string,
  maxSize: number,
  overlap: number,
  minSize: number = 200,
): Chunk[] {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  if (paragraphs.length === 0) return [];

  const rawChunks: string[] = [];
  let buffer = '';

  for (const para of paragraphs) {
    // Hard-split oversized paragraphs at sentence boundaries
    const parts = para.length > maxSize ? splitAtSentences(para, maxSize) : [para];

    for (const part of parts) {
      if (buffer.length + part.length + 1 > maxSize && buffer.length > 0) {
        rawChunks.push(buffer.trim());
        // Carry over overlap from end of buffer
        buffer = buffer.length > overlap ? buffer.slice(-overlap) : buffer;
      }
      buffer += (buffer.length > 0 ? '\n\n' : '') + part;
    }
  }

  if (buffer.trim().length > 0) {
    rawChunks.push(buffer.trim());
  }

  // Merge small chunks with neighbors
  const merged: string[] = [];
  for (const chunk of rawChunks) {
    if (
      merged.length > 0 &&
      chunk.length < minSize &&
      merged[merged.length - 1].length + chunk.length + 2 <= maxSize
    ) {
      merged[merged.length - 1] += '\n\n' + chunk;
    } else if (
      chunk.length < minSize &&
      merged.length === 0 &&
      rawChunks.length > 1
    ) {
      // Tiny first chunk — will be picked up on next iteration
      merged.push(chunk);
    } else {
      merged.push(chunk);
    }
  }

  return merged.map((content, index) => ({ index, content }));
}

function splitAtSentences(text: string, maxSize: number): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const parts: string[] = [];
  let buffer = '';

  for (const sentence of sentences) {
    if (buffer.length + sentence.length + 1 > maxSize && buffer.length > 0) {
      parts.push(buffer.trim());
      buffer = '';
    }
    buffer += (buffer.length > 0 ? ' ' : '') + sentence;
  }

  if (buffer.trim().length > 0) {
    parts.push(buffer.trim());
  }

  return parts;
}
