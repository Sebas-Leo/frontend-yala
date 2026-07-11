// Appraisal service — "Agente de Tasación por Foto" (solo cartas TCG).
// Sends a client-compressed base64 image to the backend, which calls OpenAI Vision
// (identifies the card) + JustTCG (real market price). Both API keys stay
// server-side; the client only renders the structured result.

import { api } from './client';

export interface AppraisalComparable {
  title: string;
  price: number;
}

export interface AppraisalPricing {
  itemName: string;
  game: string;
  priceMin: number;
  priceMax: number;
  currency: string; // "USD"
  comparables: AppraisalComparable[];
}

export interface AppraisalResult {
  category: 'tcg' | 'unknown';
  franchise: string;
  character: string;
  variant: string;
  confidence: number; // 0..1
  recognizable: boolean;
  pricing: AppraisalPricing | null; // null si no hay match en JustTCG
  note?: string | null;
}

// imageBase64: a data URL ("data:image/jpeg;base64,...") produced by compressImage().
export function identifyPhoto(imageBase64: string): Promise<AppraisalResult> {
  return api.post('/appraisal/identify', { imageBase64 }, { auth: false });
}
