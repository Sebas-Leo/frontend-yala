// Client-side helpers for the "Agente de Tasación por Foto":
//   - compressImage: resize + re-encode the photo before sending it to the API
//     (never upload a heavy raw photo).
//   - matchDataset: match the AI identification against the local dataset by
//     category + franchise + character (normalized, fuzzy — not exact text).

import { APPRAISAL_DATASET, type DatasetItem } from '../data/appraisalDataset';
import type { AppraisalIdentification } from '../api/appraisal';

const MAX_DIM = 1024;
const JPEG_QUALITY = 0.8;

// Resizes an image File so its longest side is <= MAX_DIM and returns a JPEG data URL.
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        const scale = MAX_DIM / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo procesar la imagen'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen'));
    };
    img.src = url;
  });
}

// Strip accents, lowercase, collapse spaces/punctuation for fuzzy comparison.
function norm(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// true if a and b overlap either direction (substring), tolerant to extra words.
function overlaps(a: string, b: string): boolean {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return false;
  if (na.includes(nb) || nb.includes(na)) return true;
  // token overlap: any shared word of length >= 3
  const setB = new Set(nb.split(' '));
  return na.split(' ').some((w) => w.length >= 3 && setB.has(w));
}

export interface AppraisalMatch {
  item: DatasetItem;
  score: number;
}

// Returns the best dataset match for an identification, or null if none is convincing.
export function matchDataset(id: AppraisalIdentification): AppraisalMatch | null {
  if (!id || id.category === 'unknown') return null;

  let best: AppraisalMatch | null = null;
  for (const item of APPRAISAL_DATASET) {
    if (item.category !== id.category) continue; // categoría es el filtro fuerte
    let score = 1; // misma categoría
    if (id.franchise && overlaps(id.franchise, item.franchise)) score += 2;
    if (id.character && overlaps(id.character, item.character)) score += 3;
    // también intentamos personaje IA contra franquicia y viceversa (etiquetas cruzadas)
    if (id.character && overlaps(id.character, item.franchise)) score += 1;
    if (id.franchise && overlaps(id.franchise, item.character)) score += 1;

    if (!best || score > best.score) best = { item, score };
  }

  // Necesitamos algo más que "misma categoría" para considerarlo un match real.
  if (!best || best.score < 3) return null;
  return best;
}
