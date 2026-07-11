// Appraisal service — "Agente de Tasación por Foto".
// Sends a client-compressed base64 image to the backend, which calls OpenAI Vision
// (the API key stays server-side) and returns a structured identification. The
// dataset match + price range is resolved on the client (see utils/appraisal.ts).

import { api } from './client';

export interface AppraisalIdentification {
  category: 'funko' | 'nendoroid' | 'manga' | 'comic' | 'tcg' | 'unknown';
  franchise: string;
  character: string;
  variant: string;
  confidence: number; // 0..1
  recognizable: boolean;
  note?: string | null;
}

// imageBase64: a data URL ("data:image/jpeg;base64,...") produced by compressImage().
export function identifyPhoto(imageBase64: string): Promise<AppraisalIdentification> {
  return api.post('/appraisal/identify', { imageBase64 }, { auth: false });
}
