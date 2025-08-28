export interface ChunkOptions {
  maxLength?: number;
  overlap?: number;
  minChunkLength?: number;
}

export function chunkContent(
  text: string, 
  options: ChunkOptions = {}
): string[] {
  const {
    maxLength = 1000,
    overlap = 100,
    minChunkLength = 100
  } = options;
  
  if (!text || text.trim().length === 0) {
    return [];
  }
  
  // Split by sentences first, keeping the sentence endings
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .filter(sentence => sentence.trim().length > 0);
  
  if (sentences.length === 0) {
    return text.length > maxLength ? [text.substring(0, maxLength)] : [text];
  }
  
  const chunks: string[] = [];
  let currentChunk = '';
  let currentLength = 0;
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    const sentenceLength = sentence.length;
    
    // If adding this sentence would exceed maxLength
    if (currentLength + sentenceLength > maxLength && currentChunk.length > 0) {
      // Save current chunk if it meets minimum length requirement
      if (currentChunk.trim().length >= minChunkLength) {
        chunks.push(currentChunk.trim());
      }
      
      // Start new chunk - include overlap if available
      if (overlap > 0 && chunks.length > 0) {
        const overlapText = getOverlapText(currentChunk, overlap);
        currentChunk = overlapText + (overlapText ? ' ' : '') + sentence;
        currentLength = currentChunk.length;
      } else {
        currentChunk = sentence;
        currentLength = sentenceLength;
      }
    } else {
      // Add sentence to current chunk
      if (currentChunk) {
        currentChunk += ' ' + sentence;
        currentLength += 1 + sentenceLength; // +1 for space
      } else {
        currentChunk = sentence;
        currentLength = sentenceLength;
      }
    }
  }
  
  // Add final chunk if it exists and meets minimum length
  if (currentChunk.trim().length >= minChunkLength) {
    chunks.push(currentChunk.trim());
  }
  
  // Handle edge case where no chunks meet minimum length
  if (chunks.length === 0 && text.trim().length > 0) {
    // Just return the original text truncated to maxLength
    return [text.trim().substring(0, maxLength)];
  }
  
  return chunks;
}

function getOverlapText(text: string, overlapLength: number): string {
  if (!text || overlapLength <= 0) {
    return '';
  }
  
  // Try to get overlap at sentence boundary if possible
  const sentences = text.split(/(?<=[.!?])\s+/);
  let overlap = '';
  let currentLength = 0;
  
  // Work backwards from the end to build overlap
  for (let i = sentences.length - 1; i >= 0; i--) {
    const sentence = sentences[i];
    if (currentLength + sentence.length <= overlapLength) {
      overlap = sentence + (overlap ? ' ' + overlap : '');
      currentLength += sentence.length + (overlap !== sentence ? 1 : 0);
    } else {
      break;
    }
  }
  
  return overlap;
}

// Helper function to estimate tokens (rough approximation)
export function estimateTokens(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

// Helper function to chunk by token count instead of character count
export function chunkContentByTokens(
  text: string, 
  maxTokens: number = 250,
  overlapTokens: number = 25
): string[] {
  const maxChars = maxTokens * 4; // Rough conversion
  const overlapChars = overlapTokens * 4;
  
  return chunkContent(text, {
    maxLength: maxChars,
    overlap: overlapChars,
    minChunkLength: 50
  });
}